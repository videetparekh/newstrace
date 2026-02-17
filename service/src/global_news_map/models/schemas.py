from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class Location(BaseModel):
    location_id: str
    city: str
    country: str
    lat: float
    lng: float
    timezone: str
    search_term: Optional[str] = None
    country_code: Optional[str] = None
    language: Optional[str] = None


class Headline(BaseModel):
    title: str
    source: str
    published_at: str
    url: str
    cached_at: datetime


class NewsResponse(BaseModel):
    location_id: str
    city: str
    country: str
    headlines: list[Headline]


class HealthResponse(BaseModel):
    status: str
    version: str


# Game-related models


class GameRound(BaseModel):
    """Represents a single round in a game session."""
    round_number: int
    headline_title: str
    location_id: str
    guess_lat: Optional[float] = None
    guess_lng: Optional[float] = None
    distance_km: Optional[float] = None
    score: Optional[int] = None
    completed: bool = False


class GameSession(BaseModel):
    """Represents a complete game session with 5 rounds."""
    game_id: str
    rounds: list[GameRound]
    current_round_index: int
    total_score: int
    created_at: datetime
    completed: bool = False


class GameStartResponse(BaseModel):
    """Response when starting a new game."""
    game_id: str
    total_rounds: int
    current_round_number: int
    headline: str


class GuessRequest(BaseModel):
    """Request body for submitting a guess."""
    lat: float
    lng: float


class GuessResponse(BaseModel):
    """Response after submitting a guess."""
    correct_location: Location
    guess_location: dict[str, float]
    distance_km: float
    round_score: int
    total_score: int
    current_round_number: int
    is_final_round: bool


class GameResultsResponse(BaseModel):
    """Final game statistics and round summaries."""
    game_id: str
    total_score: int
    max_possible_score: int
    average_distance_km: float
    rounds_summary: list[dict]
