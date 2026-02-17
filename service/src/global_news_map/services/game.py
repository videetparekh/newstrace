"""Game service for managing guessing game sessions."""

import logging
import random
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from global_news_map.models.schemas import (
    GameResultsResponse,
    GameRound,
    GameSession,
    GameStartResponse,
    GuessRequest,
    GuessResponse,
)
from global_news_map.services.locations import get_all_locations, get_location_by_id
from global_news_map.services.news import get_headlines
from global_news_map.utils.distance import calculate_score, haversine_distance

logger = logging.getLogger(__name__)

# In-memory session storage
_game_sessions: dict[str, GameSession] = {}


async def start_game() -> GameStartResponse:
    """
    Start a new 5-round guessing game.

    Returns:
        GameStartResponse with game_id and first round's headline

    Raises:
        Exception: If unable to fetch enough headlines for game
    """
    locations = get_all_locations()

    if len(locations) < 5:
        raise Exception(f"Need at least 5 locations, but only {len(locations)} available")

    # Select 5 random unique cities
    selected_locations = random.sample(locations, 5)

    # Fetch headlines for each location
    rounds = []
    for i, location in enumerate(selected_locations):
        headlines = await get_headlines(
            location.location_id,
            location.city,
            location.country
        )

        if not headlines or len(headlines) == 0:
            logger.warning(f"No headlines available for {location.city}, skipping")
            continue

        # Randomly select a headline from available headlines
        headline = random.choice(headlines)

        rounds.append(GameRound(
            round_number=i + 1,
            headline_title=headline.title,
            location_id=location.location_id
        ))

        # Stop once we have 5 rounds
        if len(rounds) >= 5:
            break

    if len(rounds) < 5:
        # Try to fetch more rounds if we didn't get enough
        remaining_locations = [loc for loc in locations if loc.location_id not in
                              [round.location_id for round in rounds]]
        random.shuffle(remaining_locations)

        for location in remaining_locations:
            if len(rounds) >= 5:
                break

            headlines = await get_headlines(
                location.location_id,
                location.city,
                location.country
            )

            if headlines and len(headlines) > 0:
                # Randomly select a headline from available headlines
                headline = random.choice(headlines)
                rounds.append(GameRound(
                    round_number=len(rounds) + 1,
                    headline_title=headline.title,
                    location_id=location.location_id
                ))

    if len(rounds) < 5:
        raise Exception(f"Unable to fetch enough headlines for game. Only got {len(rounds)} rounds.")

    # Create game session
    game_id = str(uuid.uuid4())
    session = GameSession(
        game_id=game_id,
        rounds=rounds[:5],  # Ensure exactly 5 rounds
        current_round_index=0,
        total_score=0,
        created_at=datetime.now(timezone.utc)
    )

    _game_sessions[game_id] = session

    # Clean up old sessions
    _cleanup_old_sessions()

    logger.info(f"Started new game {game_id} with {len(session.rounds)} rounds")

    return GameStartResponse(
        game_id=game_id,
        total_rounds=5,
        current_round_number=1,
        headline=rounds[0].headline_title
    )


async def submit_guess(game_id: str, guess: GuessRequest) -> GuessResponse:
    """
    Process a player's guess for the current round.

    Args:
        game_id: Game session identifier
        guess: Player's guess coordinates

    Returns:
        GuessResponse with distance, score, and feedback

    Raises:
        ValueError: If game not found, already completed, or round already completed
    """
    session = _game_sessions.get(game_id)
    if not session:
        raise ValueError(f"Game {game_id} not found")

    if session.completed:
        raise ValueError("Game already completed")

    current_round = session.rounds[session.current_round_index]

    if current_round.completed:
        raise ValueError("Current round already completed")

    # Get the correct location
    correct_location = get_location_by_id(current_round.location_id)

    if not correct_location:
        raise ValueError(f"Location data not found for {current_round.location_id}")

    # Calculate distance
    distance_km = haversine_distance(
        guess.lat, guess.lng,
        correct_location.lat, correct_location.lng
    )

    # Calculate score
    round_score = calculate_score(distance_km)

    # Update round
    current_round.guess_lat = guess.lat
    current_round.guess_lng = guess.lng
    current_round.distance_km = distance_km
    current_round.score = round_score
    current_round.completed = True

    # Update total score
    session.total_score += round_score

    # Check if this is the final round
    is_final = session.current_round_index == 4

    # Move to next round if not final
    if not is_final:
        session.current_round_index += 1
    else:
        session.completed = True

    logger.info(
        f"Game {game_id} round {current_round.round_number}: "
        f"distance={distance_km:.1f}km, score={round_score}, total={session.total_score}"
    )

    return GuessResponse(
        correct_location=correct_location,
        guess_location={"lat": guess.lat, "lng": guess.lng},
        distance_km=distance_km,
        round_score=round_score,
        total_score=session.total_score,
        current_round_number=current_round.round_number,
        is_final_round=is_final
    )


def get_next_round(game_id: str) -> Optional[dict]:
    """
    Get the next round's headline after completing previous round.

    Args:
        game_id: Game session identifier

    Returns:
        Dictionary with round_number and headline, or None if game complete
    """
    session = _game_sessions.get(game_id)
    if not session or session.completed:
        return None

    next_round = session.rounds[session.current_round_index]
    return {
        "round_number": next_round.round_number,
        "headline": next_round.headline_title
    }


def get_game_results(game_id: str) -> GameResultsResponse:
    """
    Get final game results and statistics.

    Args:
        game_id: Game session identifier

    Returns:
        GameResultsResponse with final score and round breakdown

    Raises:
        ValueError: If game not found or has no completed rounds
    """
    session = _game_sessions.get(game_id)
    if not session:
        raise ValueError(f"Game {game_id} not found")

    completed_rounds = [r for r in session.rounds if r.completed]

    if not completed_rounds:
        raise ValueError("No completed rounds in this game")

    # Calculate average distance
    total_distance = sum(r.distance_km for r in completed_rounds)
    avg_distance = total_distance / len(completed_rounds)

    # Build rounds summary
    rounds_summary = []
    for round in completed_rounds:
        location = get_location_by_id(round.location_id)
        rounds_summary.append({
            "round_number": round.round_number,
            "city": location.city if location else "Unknown",
            "country": location.country if location else "Unknown",
            "headline": round.headline_title,
            "distance_km": round.distance_km,
            "score": round.score
        })

    logger.info(f"Game {game_id} results: total_score={session.total_score}, avg_distance={avg_distance:.1f}km")

    return GameResultsResponse(
        game_id=game_id,
        total_score=session.total_score,
        max_possible_score=5000,
        average_distance_km=avg_distance,
        rounds_summary=rounds_summary
    )


def _cleanup_old_sessions():
    """Remove game sessions older than 1 hour to prevent memory leak."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=1)
    to_delete = [
        game_id for game_id, session in _game_sessions.items()
        if session.created_at < cutoff
    ]

    for game_id in to_delete:
        del _game_sessions[game_id]
        logger.debug(f"Cleaned up old game session {game_id}")

    if to_delete:
        logger.info(f"Cleaned up {len(to_delete)} old game sessions")
