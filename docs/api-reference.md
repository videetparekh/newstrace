# API Reference

The Global News Guessing Game backend exposes a RESTful API built with FastAPI. All endpoints are prefixed with `/api` and return JSON responses. The API runs on port 8000 by default.

Base URL: `http://localhost:8000`

The API supports two primary workflows:

1. **Game Mode** - Create game sessions, submit guesses, track scores
2. **Location/News Queries** - Get city data and headlines (used during gameplay)

## Endpoints

### GET /api/health

Returns the health status and version of the running service. This endpoint requires no authentication and is intended for monitoring and readiness checks.

**Request:**

```
GET /api/health
```

No parameters required.

**Response: 200 OK**

```json
{
  "status": "ok",
  "version": "1.0.0"
}
```

**Response Fields:**

| Field     | Type   | Description                          |
|-----------|--------|--------------------------------------|
| `status`  | string | Service health status. Always `"ok"` when the service is running. |
| `version` | string | Current API version.                 |

---

### GET /api/locations

Returns the list of all supported city locations with their geographic coordinates. This data is loaded from `data/locations.json` at application startup.

**Request:**

```
GET /api/locations
```

No parameters required.

**Response: 200 OK**

```json
[
  {
    "location_id": "new-york",
    "city": "New York",
    "country": "United States",
    "lat": 40.7128,
    "lng": -74.006,
    "timezone": "America/New_York"
  },
  {
    "location_id": "london",
    "city": "London",
    "country": "United Kingdom",
    "lat": 51.5074,
    "lng": -0.1278,
    "timezone": "Europe/London"
  },
  {
    "location_id": "tokyo",
    "city": "Tokyo",
    "country": "Japan",
    "lat": 35.6762,
    "lng": 139.6503,
    "timezone": "Asia/Tokyo"
  }
]
```

Each location object contains the following fields:

| Field         | Type   | Description                                    |
|---------------|--------|------------------------------------------------|
| `location_id` | string | Unique slug identifier for the city (e.g., `"new-york"`, `"sao-paulo"`). |
| `city`        | string | Display name of the city.                      |
| `country`     | string | Country where the city is located.             |
| `lat`         | float  | Latitude coordinate.                           |
| `lng`         | float  | Longitude coordinate.                          |
| `timezone`    | string | IANA timezone identifier (e.g., `"America/New_York"`). |

The full list includes 20 cities: New York, London, Tokyo, Paris, Sydney, Mumbai, Sao Paulo, Cairo, Moscow, Beijing, Dubai, Singapore, Toronto, Berlin, Lagos, Mexico City, Seoul, Buenos Aires, Nairobi, and Istanbul.

---

## Game Endpoints

### POST /api/game/start

Initiates a new game session. Creates a game with 5 rounds and returns the first headline.

**Request:**

```
POST /api/game/start
```

No request body required.

**Response: 200 OK**

```json
{
  "game_id": "550e8400-e29b-41d4-a716-446655440000",
  "current_round_number": 1,
  "headline": "New Policy Changes Announced in Parliament"
}
```

**Response Fields:**

| Field                    | Type   | Description                                      |
|--------------------------|--------|--------------------------------------------------|
| `game_id`                | string | Unique identifier for this game session. Required for subsequent requests. |
| `current_round_number`   | integer | The current round number (1-5).                  |
| `headline`               | string | The news headline for the player to guess from.  |

**Response: 503 Service Unavailable**

Returned when headlines cannot be fetched for a game.

```json
{
  "detail": "Unable to start game - news sources unavailable"
}
```

---

### POST /api/game/{game_id}/guess

Submits a player's guess (map coordinates) for the current round. Calculates the distance to the actual city and awards points.

**Request:**

```
POST /api/game/{game_id}/guess
Content-Type: application/json

{
  "lat": 51.5074,
  "lng": -0.1278
}
```

**Path Parameters:**

| Parameter | Type   | Required | Description                                    |
|-----------|--------|----------|------------------------------------------------|
| `game_id` | string | Yes      | The game session ID from `/api/game/start`.    |

**Request Body:**

| Field | Type  | Required | Description                                    |
|-------|-------|----------|------------------------------------------------|
| `lat` | float | Yes      | Latitude of the player's guess (-90 to 90).    |
| `lng` | float | Yes      | Longitude of the player's guess (-180 to 180). |

**Response: 200 OK**

```json
{
  "location_id": "london",
  "city": "London",
  "country": "United Kingdom",
  "distance_km": 150.5,
  "score": 850,
  "is_final_round": false,
  "total_score": 850
}
```

**Response Fields:**

| Field                | Type    | Description                                      |
|----------------------|---------|--------------------------------------------------|
| `location_id`        | string  | The actual location ID for this round.           |
| `city`               | string  | The actual city name.                            |
| `country`            | string  | The country of the actual city.                  |
| `distance_km`        | float   | Distance in kilometers between guess and actual location. |
| `score`              | integer | Points earned for this round (0-1000).           |
| `is_final_round`     | boolean | Whether this is the final (5th) round.           |
| `total_score`        | integer | Cumulative score across all rounds.              |

**Response: 400 Bad Request**

Returned when the game session is invalid or not found.

```json
{
  "detail": "Game not found"
}
```

---

### GET /api/game/{game_id}/next

Fetches the next round's headline. Should be called after the player views a round result.

**Request:**

```
GET /api/game/{game_id}/next
```

**Path Parameters:**

| Parameter | Type   | Required | Description                                    |
|-----------|--------|----------|------------------------------------------------|
| `game_id` | string | Yes      | The game session ID from `/api/game/start`.    |

**Response: 200 OK**

```json
{
  "round_number": 2,
  "headline": "Major Scientific Discovery Announced by Research Team"
}
```

**Response Fields:**

| Field          | Type    | Description                                      |
|----------------|---------|--------------------------------------------------|
| `round_number` | integer | The next round number (2-5).                     |
| `headline`     | string  | The news headline for this round.                |

**Response: 404 Not Found**

Returned when the game session is not found or expired.

```json
{
  "detail": "Game not found"
}
```

---

## News/Location Endpoints

### GET /api/news/{location_id}

Fetches the latest news headline for a specific city. The service first attempts to retrieve the headline from NewsAPI. If that fails (no API key configured, rate limit exceeded, or no results), it falls back to Google News RSS. Responses are cached for 30 minutes by default.

**Request:**

```
GET /api/news/{location_id}
```

**Path Parameters:**

| Parameter     | Type   | Required | Description                                    |
|---------------|--------|----------|------------------------------------------------|
| `location_id` | string | Yes      | The unique identifier of the city (e.g., `"london"`, `"new-york"`). Must match a value from the `/api/locations` endpoint. |

**Response: 200 OK**

```json
{
  "location_id": "london",
  "city": "London",
  "country": "United Kingdom",
  "headline": {
    "title": "Major Infrastructure Project Announced for Greater London",
    "source": "BBC News",
    "published_at": "2025-01-15T14:30:00Z",
    "url": "https://www.bbc.com/news/example-article",
    "cached_at": "2025-01-15T14:35:12.456789+00:00"
  }
}
```

**Response Fields:**

| Field                    | Type   | Description                                      |
|--------------------------|--------|--------------------------------------------------|
| `location_id`            | string | The requested location identifier.               |
| `city`                   | string | Display name of the city.                        |
| `country`                | string | Country where the city is located.               |
| `headline`               | object | The headline data object.                        |
| `headline.title`         | string | Title of the news article.                       |
| `headline.source`        | string | Name of the news source (e.g., `"BBC News"`, `"Google News"`). |
| `headline.published_at`  | string | Publication timestamp in ISO 8601 format.        |
| `headline.url`           | string | Direct URL to the full article.                  |
| `headline.cached_at`     | string | UTC timestamp of when this headline was cached by the service. |

**Response: 404 Not Found**

Returned when the `location_id` does not match any known location.

```json
{
  "detail": "Location 'unknown-city' not found"
}
```

**Response: 503 Service Unavailable**

Returned when neither NewsAPI nor Google News RSS can provide a headline for the requested location.

```json
{
  "detail": "Unable to fetch news at this time"
}
```

## Error Responses

All error responses follow FastAPI's standard error format:

```json
{
  "detail": "Description of the error"
}
```

| HTTP Status | Condition                                          |
|-------------|---------------------------------------------------|
| 404         | The requested `location_id` does not exist.       |
| 422         | Request validation failed (invalid parameters).    |
| 503         | News sources are unavailable or returned no data. |

## Caching Behavior

The service maintains an in-memory cache of news headlines keyed by `location_id`. When a headline is fetched successfully, it is stored in the cache along with a timestamp. Subsequent requests for the same location within the cache TTL (default: 30 minutes) will return the cached headline without making external API calls. The `cached_at` field in the response indicates when the headline was originally fetched and cached.

## CORS Configuration

The API is configured with permissive CORS settings for development:

- **Allowed Origins:** All (`*`)
- **Allowed Methods:** All
- **Allowed Headers:** All
- **Credentials:** Enabled

For production deployments, these settings should be restricted to your frontend's domain.
