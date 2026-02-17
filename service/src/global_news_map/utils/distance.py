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

    Scoring formula: 1000 * ln(1 + (1 - d/D) * (e - 1))
    - Perfect guess (0 km): 1000 points
    - 10,000 km away: ~620 points
    - 20,000+ km away: 0 points

    The logarithmic curve keeps scores high through medium distances and
    collapses steeply only near maximum distance.

    Args:
        distance_km: Distance in kilometers

    Returns:
        Score (0-1000 points)
    """
    if distance_km < 0:
        distance_km = 0

    max_distance = 20000.0
    t = max(0.0, 1.0 - distance_km / max_distance)
    score = 1000.0 * math.log(1.0 + t * (math.e - 1.0))
    return int(score)
