import time
from datetime import datetime, timezone

import feedparser
import httpx

from global_news_map.config import settings
from global_news_map.models.schemas import Headline

_cache: dict[str, tuple[list[Headline], float]] = {}


def _cache_ttl_seconds() -> int:
    return settings.cache_ttl_minutes * 60


def _get_cached(location_id: str) -> list[Headline] | None:
    if location_id in _cache:
        headlines, cached_time = _cache[location_id]
        if time.time() - cached_time < _cache_ttl_seconds():
            return headlines
        del _cache[location_id]
    return None


def _set_cache(location_id: str, headlines: list[Headline]) -> None:
    _cache[location_id] = (headlines, time.time())


async def fetch_from_newsapi(city: str, country: str) -> list[Headline] | None:
    if not settings.news_api_key:
        return None
    url = "https://newsdata.io/api/1/latest"
    params = {
        "q": city,
        "apikey": settings.news_api_key,
        "language": "en",
        "category": "politics,business,breaking"
    }
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, params=params, timeout=10)
        if resp.status_code != 200:
            return None
        data = resp.json()
        results = data.get("results", [])
        if not results:
            return None
        headlines = []
        for article in results[:3]:
            headlines.append(Headline(
                title=article.get("title", "No title"),
                source=article.get("source_id", "Unknown"),
                published_at=article.get("pubDate", ""),
                url=article.get("link", ""),
                cached_at=datetime.now(timezone.utc),
            ))
        return headlines if headlines else None


async def fetch_from_google_rss(city: str, country: str) -> list[Headline] | None:
    query = f"{city} {country}"
    url = f"https://news.google.com/rss/search?q={query}&hl=en&gl=US&ceid=US:en"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, timeout=10)
        if resp.status_code != 200:
            return None
    feed = feedparser.parse(resp.text)
    if not feed.entries:
        return None
    headlines = []
    for entry in feed.entries[:3]:
        published = entry.get("published", "")
        headlines.append(Headline(
            title=entry.get("title", "No title"),
            source=entry.get("source", {}).get("title", "Google News"),
            published_at=published,
            url=entry.get("link", ""),
            cached_at=datetime.now(timezone.utc),
        ))
    return headlines if headlines else None


async def get_headlines(location_id: str, city: str, country: str) -> list[Headline] | None:
    cached = _get_cached(location_id)
    if cached:
        return cached

    headlines = await fetch_from_newsapi(city, country)

    if not headlines:
        headlines = await fetch_from_google_rss(city, country)

    if headlines:
        _set_cache(location_id, headlines)

    return headlines
