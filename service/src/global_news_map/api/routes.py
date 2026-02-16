from fastapi import APIRouter, HTTPException

from global_news_map.models.schemas import HealthResponse, Location, NewsResponse
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
