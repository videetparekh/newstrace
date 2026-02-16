import json
from pathlib import Path

from global_news_map.models.schemas import Location

_locations: list[Location] = []


def load_locations(file_path: str) -> list[Location]:
    global _locations
    path = Path(file_path)
    if not path.is_absolute():
        path = Path(__file__).resolve().parents[3] / file_path
    with open(path) as f:
        data = json.load(f)
    _locations = [Location(**loc) for loc in data]
    return _locations


def get_all_locations() -> list[Location]:
    return _locations


def get_location_by_id(location_id: str) -> Location | None:
    for loc in _locations:
        if loc.location_id == location_id:
            return loc
    return None
