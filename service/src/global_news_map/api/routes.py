from fastapi import APIRouter, HTTPException

from global_news_map.models.schemas import (
    GameResultsResponse,
    GameStartResponse,
    GuessRequest,
    GuessResponse,
    HealthResponse,
    Location,
    NewsResponse,
)
from global_news_map.services import game as game_service
from global_news_map.services.locations import get_all_locations, get_location_by_id
from global_news_map.services.news import get_headlines

router = APIRouter(prefix="/api")


@router.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(status="ok", version="1.0.0")


@router.get("/locations", response_model=list[Location])
async def list_locations():
    return get_all_locations()


@router.get("/news/{location_id}", response_model=NewsResponse)
async def get_news(location_id: str):
    location = get_location_by_id(location_id)
    if not location:
        raise HTTPException(status_code=404, detail=f"Location '{location_id}' not found")

    headlines = await get_headlines(location_id, location.city, location.country)
    if not headlines:
        raise HTTPException(status_code=503, detail="Unable to fetch news at this time")

    return NewsResponse(
        location_id=location.location_id,
        city=location.city,
        country=location.country,
        headlines=headlines,
    )


# Game endpoints


@router.post("/game/start", response_model=GameStartResponse)
async def start_game():
    """Start a new 5-round guessing game."""
    try:
        return await game_service.start_game()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/game/{game_id}/guess", response_model=GuessResponse)
async def submit_guess(game_id: str, guess: GuessRequest):
    """Submit a guess for the current round."""
    try:
        return await game_service.submit_guess(game_id, guess)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/game/{game_id}/next")
async def get_next_round(game_id: str):
    """Get the next round's headline after completing a round."""
    next_round = game_service.get_next_round(game_id)
    if not next_round:
        raise HTTPException(status_code=404, detail="Game completed or not found")
    return next_round


@router.get("/game/{game_id}/results", response_model=GameResultsResponse)
async def get_results(game_id: str):
    """Get final game statistics."""
    try:
        return game_service.get_game_results(game_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
