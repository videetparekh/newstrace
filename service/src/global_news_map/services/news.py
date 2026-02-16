import time
from datetime import datetime, timezone

import feedparser
import httpx

from global_news_map.config import settings
from global_news_map.models.schemas import Headline

_cache: dict[str, tuple[Headline, float]] = {}


def _cache_ttl_seconds() -> int:
    return settings.cache_ttl_minutes * 60


def _get_cached(location_id: str) -> Headline | None:
    if location_id in _cache:
        headline, cached_time = _cache[location_id]
        if time.time() - cached_time < _cache_ttl_seconds():
            return headline
        del _cache[location_id]
    return None


def _set_cache(location_id: str, headline: Headline) -> None:
    _cache[location_id] = (headline, time.time())


async def fetch_from_newsapi(city: str, country: str) -> Headline | None:
    if not settings.news_api_key:
        return None
    url = "https://newsdata.io/api/1/latest"
    params = {"q": city, "apikey": settings.news_api_key, "language": "en"}
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, params=params, timeout=10)
        if resp.status_code != 200:
            return None
        data = resp.json()
        results = data.get("results", [])
        if not results:
            return None
        article = results[0]
        return Headline(
            title=article.get("title", "No title"),
            source=article.get("source_id", "Unknown"),
            published_at=article.get("pubDate", ""),
            url=article.get("link", ""),
            cached_at=datetime.now(timezone.utc),
        )


async def fetch_from_google_rss(city: str, country: str) -> Headline | None:
    query = f"{city} {country}"
    url = f"https://news.google.com/rss/search?q={query}&hl=en&gl=US&ceid=US:en"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, timeout=10)
        if resp.status_code != 200:
            return None
    feed = feedparser.parse(resp.text)
    if not feed.entries:
        return None
    entry = feed.entries[0]
    published = entry.get("published", "")
    return Headline(
        title=entry.get("title", "No title"),
        source=entry.get("source", {}).get("title", "Google News"),
        published_at=published,
        url=entry.get("link", ""),
        cached_at=datetime.now(timezone.utc),
    )


async def get_headline(location_id: str, city: str, country: str) -> Headline | None:
    cached = _get_cached(location_id)
    if cached:
        return cached

    headline = await fetch_from_newsapi(city, country)

    if not headline:
        headline = await fetch_from_google_rss(city, country)

    if headline:
        _set_cache(location_id, headline)

    return headline
