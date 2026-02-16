import json
import logging
from pathlib import Path

from global_news_map.models.schemas import Location

logger = logging.getLogger(__name__)
_locations: list[Location] = []


def load_locations(file_path: str) -> list[Location]:
    global _locations
    path = Path(file_path)
    if not path.is_absolute():
        path = Path(__file__).resolve().parents[3] / file_path

    logger.info(f"Loading locations from: {path}")

    try:
        with open(path) as f:
            data = json.load(f)
        _locations = [Location(**loc) for loc in data]
        logger.info(f"Successfully loaded {len(_locations)} locations")
        for loc in _locations:
            logger.debug(f"  - {loc.city}, {loc.country}")
        return _locations
    except FileNotFoundError:
        logger.error(f"Locations file not found at: {path}")
        raise
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in locations file: {e}")
        raise


def get_all_locations() -> list[Location]:
    return _locations


def get_location_by_id(location_id: str) -> Location | None:
    for loc in _locations:
        if loc.location_id == location_id:
            return loc
    return None
