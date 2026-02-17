"""Tests for distance calculation utilities."""

import pytest

from global_news_map.utils.distance import calculate_score, haversine_distance


def test_haversine_nyc_to_london():
    """NYC to London is approximately 5,570 km."""
    # New York: 40.7128, -74.006
    # London: 51.5074, -0.1278
    distance = haversine_distance(40.7128, -74.006, 51.5074, -0.1278)
    assert 5550 < distance < 5600, f"Expected ~5570km, got {distance:.1f}km"


def test_haversine_same_point():
    """Distance between same point should be essentially zero."""
    distance = haversine_distance(40.7128, -74.006, 40.7128, -74.006)
    assert distance < 0.1, f"Expected ~0km for same point, got {distance:.1f}km"


def test_haversine_tokyo_to_sydney():
    """Tokyo to Sydney is approximately 7,820 km."""
    # Tokyo: 35.6762, 139.6503
    # Sydney: -33.8688, 151.2093
    distance = haversine_distance(35.6762, 139.6503, -33.8688, 151.2093)
    assert 7800 < distance < 7850, f"Expected ~7820km, got {distance:.1f}km"


def test_score_perfect_guess():
    """Perfect guess (0 km) should score 1000 points."""
    score = calculate_score(0)
    assert score == 1000


def test_score_halfway():
    """10,000 km should score 500 points."""
    score = calculate_score(10000)
    assert score == 500


def test_score_maximum_distance():
    """20,000 km or more should score 0 points."""
    assert calculate_score(20000) == 0
    assert calculate_score(30000) == 0
    assert calculate_score(50000) == 0


def test_score_near_perfect():
    """Small distance should score close to 1000."""
    score = calculate_score(100)  # 100 km
    assert 990 < score < 1000


def test_score_negative_distance():
    """Negative distance should be treated as 0."""
    score = calculate_score(-100)
    assert score == 1000
