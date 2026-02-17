from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from global_news_map.main import app
from global_news_map.models.schemas import Headline
from global_news_map.services.locations import load_locations


@pytest.fixture(autouse=True)
def _load_test_locations():
    data_path = str(Path(__file__).resolve().parents[1] / "data" / "locations.json")
    load_locations(data_path)


@pytest.fixture
def client():
    return TestClient(app)


def test_health(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["version"] == "1.0.0"


def test_list_locations(client):
    resp = client.get("/api/locations")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 118  # Expanded to 118 cities for better game variety
    ids = [loc["location_id"] for loc in data]
    assert "new-york" in ids
    assert "tokyo" in ids


def test_get_news_unknown_location(client):
    resp = client.get("/api/news/atlantis")
    assert resp.status_code == 404


@patch("global_news_map.api.routes.get_headlines", new_callable=AsyncMock)
def test_get_news_success(mock_headlines, client):
    mock_headlines.return_value = [
        Headline(
            title="Test headline",
            source="TestSource",
            published_at="2026-02-15T12:00:00Z",
            url="https://example.com/article",
            cached_at="2026-02-15T12:00:00Z",
        )
    ]
    resp = client.get("/api/news/new-york")
    assert resp.status_code == 200
    data = resp.json()
    assert data["location_id"] == "new-york"
    assert data["headlines"][0]["title"] == "Test headline"


@patch("global_news_map.api.routes.get_headlines", new_callable=AsyncMock)
def test_get_news_unavailable(mock_headlines, client):
    mock_headlines.return_value = None
    resp = client.get("/api/news/new-york")
    assert resp.status_code == 503
