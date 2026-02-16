# Architecture

This document describes the system design, component architecture, and data flow of the Global News Map application.

## System Overview

Global News Map is a two-tier web application consisting of a React single-page application (frontend) and a Python FastAPI service (backend). The frontend renders an interactive map and makes API calls to the backend, which aggregates news data from external sources and returns it to the client.

```
+-------------------+         +-------------------+         +-------------------+
|                   |  /api/* |                   |         |                   |
|   React Frontend  +-------->+   FastAPI Backend  +-------->+   NewsAPI.org     |
|   (Vite / Port    |         |   (Uvicorn / Port |         |   (Primary)       |
|    5173 dev)      |<--------+    8000)           |<--------+                   |
|                   |  JSON   |                   |  JSON   +-------------------+
+-------------------+         |                   |
                              |                   |         +-------------------+
                              |                   +-------->+                   |
                              |                   |         |   Google News RSS |
                              |                   |<--------+   (Fallback)      |
                              +--------+----------+         +-------------------+
                                       |
                                       v
                              +-------------------+
                              |                   |
                              |   In-Memory Cache |
                              |   (30 min TTL)    |
                              |                   |
                              +-------------------+
```

## Data Flow

A complete request cycle follows these steps:

1. **User interaction:** The user clicks a city marker on the interactive map in the React frontend.

2. **Frontend API call:** The `useNews` hook calls `fetch('/api/news/{location_id}')`. During development, the Vite proxy forwards this request from port 5173 to the backend on port 8000. In production, a reverse proxy (such as Nginx) handles this routing.

3. **Route handling:** The FastAPI router in `api/routes.py` receives the request and resolves the `location_id` against the loaded location data.

4. **Location validation:** The `get_location_by_id()` function in `services/locations.py` looks up the location. If not found, the API returns a 404 error.

5. **Cache check:** The `get_headline()` function in `services/news.py` checks the in-memory cache for an existing headline for this `location_id`. If a valid (non-expired) cached entry exists, it is returned immediately, skipping steps 6 and 7.

6. **Primary source -- NewsAPI:** If no cached headline exists, the service calls the NewsAPI `/v2/top-headlines` endpoint with the city name as a query parameter. If a valid API key is configured and results are returned, the first article is used.

7. **Fallback source -- Google News RSS:** If NewsAPI fails (no API key, rate limit, network error, or no results), the service fetches the Google News RSS feed with a search query of `"{city} {country}"`. The first entry from the parsed feed is used.

8. **Cache storage:** If a headline was successfully retrieved from either source, it is stored in the in-memory cache with the current timestamp. The cache entry expires after the configured TTL (default: 30 minutes).

9. **Response:** The backend returns a JSON response containing the `location_id`, `city`, `country`, and `headline` object. If neither source returned a result, the API returns a 503 error.

10. **Frontend rendering:** The `useNews` hook updates its state, causing the `HeadlineCard` component to render with the headline title, source, publication time, and a link to the full article.

## Backend Architecture

### Directory Structure

```
service/
  src/global_news_map/
    main.py              # Application entry point and middleware configuration
    config.py            # Settings management with pydantic-settings
    api/
      routes.py          # API endpoint definitions
    models/
      schemas.py         # Pydantic models for request/response validation
    services/
      news.py            # News fetching, fallback logic, and caching
      locations.py       # Location data loading and lookup
```

### Application Startup

The FastAPI application uses a lifespan context manager defined in `main.py`. During startup, it calls `load_locations()` which reads `data/locations.json` and parses each entry into a `Location` Pydantic model. These are stored in a module-level list in `services/locations.py` and remain in memory for the lifetime of the process.

### Configuration

Settings are managed by the `Settings` class in `config.py`, which extends `pydantic_settings.BaseSettings`. Configuration values are read from environment variables or a `.env` file in the service directory. The three configurable values are:

- `NEWS_API_KEY` -- API key for NewsAPI.org (default: empty string).
- `CACHE_TTL_MINUTES` -- Cache duration in minutes (default: 30).
- `LOCATIONS_FILE` -- Path to the locations JSON file (default: `../../data/locations.json`).

### Caching Strategy

The cache is a module-level Python dictionary in `services/news.py` with the structure:

```python
_cache: dict[str, tuple[Headline, float]] = {}
```

Each entry maps a `location_id` to a tuple of the `Headline` object and a Unix timestamp of when it was cached. On each request, the cache is checked first. If the entry exists and the elapsed time is less than the TTL, the cached headline is returned. If the entry has expired, it is deleted and a fresh fetch is performed.

This approach is simple and effective for single-worker deployments. In multi-worker configurations (using `--workers > 1`), each Uvicorn worker maintains its own independent cache.

### Data Models

Four Pydantic models are defined in `models/schemas.py`:

- **Location** -- Represents a city with `location_id`, `city`, `country`, `lat`, `lng`, and `timezone` fields.
- **Headline** -- Represents a news headline with `title`, `source`, `published_at`, `url`, and `cached_at` fields.
- **NewsResponse** -- The API response for the news endpoint, combining location metadata with a `Headline` object.
- **HealthResponse** -- The API response for the health endpoint with `status` and `version` fields.

## Frontend Architecture

### Directory Structure

```
ui/
  src/
    main.jsx                    # React DOM entry point
    App.jsx                     # Root component, state orchestration
    App.css                     # Application-level styles
    components/
      WorldMap.jsx              # Map container with tile layer and markers
      WorldMap.css              # Map styling
      LocationMarker.jsx        # Individual city marker component
      HeadlineCard.jsx          # News headline display card
      HeadlineCard.css          # Headline card styling
      LoadingState.jsx          # Loading spinner/indicator
      LoadingState.css          # Loading state styling
    hooks/
      useLocations.js           # Hook for fetching and managing location data
      useNews.js                # Hook for fetching and managing headline data
```

### Component Hierarchy

```
App
  +-- WorldMap
  |     +-- MapContainer (react-leaflet)
  |           +-- TileLayer (OpenStreetMap)
  |           +-- LocationMarker (one per city)
  +-- HeadlineCard (conditional)
  +-- LoadingState (conditional)
```

### Component Responsibilities

**App** (`App.jsx`): The root component that orchestrates the application. It initializes both the `useLocations` and `useNews` hooks, passes location data to `WorldMap`, and conditionally renders `HeadlineCard`, `LoadingState`, or placeholder text in the sidebar based on the current state.

**WorldMap** (`WorldMap.jsx`): Wraps the react-leaflet `MapContainer` and `TileLayer` components. It renders a `LocationMarker` for each city in the locations array. The map is centered at coordinates (20, 0) with an initial zoom of 2, minimum zoom of 2, and maximum zoom of 10. Map tiles are sourced from OpenStreetMap.

**LocationMarker** (`LocationMarker.jsx`): Renders a single Leaflet marker for a city at its latitude and longitude. Handles click events and invokes the `onLocationClick` callback passed down from `App`.

**HeadlineCard** (`HeadlineCard.jsx`): Displays the fetched headline in a card layout. Shows the city name, country, headline title, source name, formatted publication time, and a link to the full article. Includes a close button to dismiss the card.

**LoadingState** (`LoadingState.jsx`): A visual loading indicator shown while location data or news headlines are being fetched.

### Custom Hooks

**useLocations** (`hooks/useLocations.js`): Fetches the list of locations from `/api/locations` on component mount. Returns `{ locations, loading }`. The fetch runs once via a `useEffect` with an empty dependency array.

**useNews** (`hooks/useNews.js`): Manages headline fetching and state. Provides `fetchNews(locationId)` to trigger a fetch, `clearHeadline()` to reset the state, and returns `{ headline, loading, error, fetchNews, clearHeadline }`. Uses `useCallback` to memoize both functions.

### Build Tooling

The frontend uses Vite as the build tool and development server. Key configuration in `vite.config.js`:

- **React plugin:** `@vitejs/plugin-react` for JSX transformation and Fast Refresh.
- **Development proxy:** All `/api` requests are forwarded to `http://localhost:8000`.
- **Test environment:** Vitest with jsdom for component testing, configured with Testing Library setup in `setupTests.js`.

## Technology Stack

### Backend

| Technology        | Version | Purpose                                      |
|-------------------|---------|----------------------------------------------|
| Python            | 3.11+   | Runtime                                      |
| FastAPI           | 0.115+  | Web framework                                |
| Uvicorn           | 0.34+   | ASGI server                                  |
| Pydantic          | 2.10+   | Data validation and serialization            |
| pydantic-settings | 2.7+    | Configuration management                     |
| httpx             | 0.28+   | Async HTTP client for external API calls     |
| feedparser        | 6.0+    | RSS feed parsing for Google News fallback    |
| Poetry            | 1.7+    | Dependency management                        |
| pytest            | 8.3+    | Testing framework                            |
| Ruff              | 0.9+    | Linting and formatting                       |

### Frontend

| Technology           | Version | Purpose                                 |
|----------------------|---------|-----------------------------------------|
| React                | 19.2+   | UI framework                            |
| react-leaflet        | 5.0+    | React wrapper for Leaflet maps          |
| Leaflet              | 1.9+    | Interactive map library                 |
| Vite                 | 7.3+    | Build tool and development server       |
| Vitest               | 4.0+    | Testing framework                       |
| Testing Library      | 16.3+   | Component testing utilities             |
| Yarn                 | 1.22+   | Dependency management                   |
