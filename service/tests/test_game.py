"""Tests for game API endpoints."""

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from global_news_map.main import app
from global_news_map.services.locations import load_locations


@pytest.fixture(autouse=True)
def _load_test_locations():
    """Load locations data before running tests."""
    data_path = str(Path(__file__).resolve().parents[1] / "data" / "locations.json")
    load_locations(data_path)


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


def test_game_start_creates_session(client):
    """Verify game start returns game_id and first headline."""
    resp = client.post("/api/game/start")
    assert resp.status_code == 200

    data = resp.json()
    assert "game_id" in data
    assert "headline" in data
    assert data["total_rounds"] == 5
    assert data["current_round_number"] == 1
    assert isinstance(data["game_id"], str)
    assert len(data["game_id"]) > 0
    assert len(data["headline"]) > 0


def test_submit_guess_calculates_distance(client):
    """Verify guess submission returns distance and score."""
    # Start game
    start_resp = client.post("/api/game/start")
    assert start_resp.status_code == 200
    game_id = start_resp.json()["game_id"]

    # Submit guess
    guess_resp = client.post(
        f"/api/game/{game_id}/guess",
        json={"lat": 40.7, "lng": -74.0}
    )
    assert guess_resp.status_code == 200

    data = guess_resp.json()
    assert "distance_km" in data
    assert "round_score" in data
    assert "total_score" in data
    assert "correct_location" in data
    assert "guess_location" in data
    assert "is_final_round" in data

    # Verify score is in valid range
    assert 0 <= data["round_score"] <= 1000
    assert data["total_score"] == data["round_score"]
    assert data["distance_km"] >= 0

    # Verify correct location has expected fields
    assert "city" in data["correct_location"]
    assert "country" in data["correct_location"]
    assert "lat" in data["correct_location"]
    assert "lng" in data["correct_location"]

    # Verify guess location matches what we sent
    assert data["guess_location"]["lat"] == 40.7
    assert data["guess_location"]["lng"] == -74.0

    # First round shouldn't be final
    assert data["is_final_round"] is False


def test_complete_five_rounds(client):
    """Verify game completes after 5 rounds."""
    start_resp = client.post("/api/game/start")
    game_id = start_resp.json()["game_id"]

    for i in range(5):
        guess_resp = client.post(
            f"/api/game/{game_id}/guess",
            json={"lat": 0, "lng": 0}
        )
        assert guess_resp.status_code == 200

        data = guess_resp.json()
        assert data["current_round_number"] == i + 1
        assert data["is_final_round"] == (i == 4)


def test_get_next_round(client):
    """Verify getting next round's headline works."""
    # Start game
    start_resp = client.post("/api/game/start")
    game_id = start_resp.json()["game_id"]

    # Complete first round
    client.post(
        f"/api/game/{game_id}/guess",
        json={"lat": 0, "lng": 0}
    )

    # Get next round
    next_resp = client.get(f"/api/game/{game_id}/next")
    assert next_resp.status_code == 200

    data = next_resp.json()
    assert "round_number" in data
    assert "headline" in data
    assert data["round_number"] == 2
    assert len(data["headline"]) > 0


def test_game_results(client):
    """Verify results endpoint returns summary after game completion."""
    # Start and complete a game
    start_resp = client.post("/api/game/start")
    game_id = start_resp.json()["game_id"]

    for _ in range(5):
        client.post(
            f"/api/game/{game_id}/guess",
            json={"lat": 0, "lng": 0}
        )

    # Get results
    results_resp = client.get(f"/api/game/{game_id}/results")
    assert results_resp.status_code == 200

    data = results_resp.json()
    assert "total_score" in data
    assert "max_possible_score" in data
    assert "average_distance_km" in data
    assert "rounds_summary" in data

    assert data["max_possible_score"] == 5000
    assert len(data["rounds_summary"]) == 5
    assert 0 <= data["total_score"] <= 5000
    assert data["average_distance_km"] > 0

    # Verify round summary has expected fields
    for round_summary in data["rounds_summary"]:
        assert "round_number" in round_summary
        assert "city" in round_summary
        assert "country" in round_summary
        assert "headline" in round_summary
        assert "distance_km" in round_summary
        assert "score" in round_summary


def test_invalid_game_id(client):
    """Verify appropriate error for invalid game ID."""
    resp = client.post(
        "/api/game/invalid-game-id/guess",
        json={"lat": 0, "lng": 0}
    )
    assert resp.status_code == 400
    assert "not found" in resp.json()["detail"].lower()


def test_completed_game_submission(client):
    """Verify can't submit guess after game is completed."""
    start_resp = client.post("/api/game/start")
    game_id = start_resp.json()["game_id"]

    # Complete all 5 rounds
    for _ in range(5):
        resp = client.post(
            f"/api/game/{game_id}/guess",
            json={"lat": 0, "lng": 0}
        )
        assert resp.status_code == 200

    # Try to submit another guess after game is complete
    resp_extra = client.post(
        f"/api/game/{game_id}/guess",
        json={"lat": 10, "lng": 10}
    )
    assert resp_extra.status_code == 400
    assert "completed" in resp_extra.json()["detail"].lower()
