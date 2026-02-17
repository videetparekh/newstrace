"""Distance calculation utilities for game scoring."""

import math


def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Calculate distance between two points on Earth using Haversine formula.

    Args:
        lat1: Latitude of first point in degrees
        lng1: Longitude of first point in degrees
        lat2: Latitude of second point in degrees
        lng2: Longitude of second point in degrees

    Returns:
        Distance in kilometers
    """
    R = 6371  # Earth's radius in kilometers

    # Convert degrees to radians
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)

    # Haversine formula
    a = (math.sin(delta_lat / 2) ** 2 +
         math.cos(lat1_rad) * math.cos(lat2_rad) *
         math.sin(delta_lng / 2) ** 2)

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


def calculate_score(distance_km: float) -> int:
    """
    Calculate score based on distance from guess to actual location.

    Scoring formula: max(0, 1000 - (distance_km / 20000 * 1000))
    - Perfect guess (0 km): 1000 points
    - 10,000 km away: 500 points
    - 20,000+ km away: 0 points

    Args:
        distance_km: Distance in kilometers

    Returns:
        Score (0-1000 points)
    """
    if distance_km < 0:
        distance_km = 0

    score = 1000 - (distance_km / 20000 * 1000)
    return max(0, int(score))
