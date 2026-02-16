from datetime import datetime

from pydantic import BaseModel


class Location(BaseModel):
    location_id: str
    city: str
    country: str
    lat: float
    lng: float
    timezone: str


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
