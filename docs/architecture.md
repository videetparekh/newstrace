# Architecture

This document describes the system design, component architecture, and data flow of the Global News Map application.

## System Overview

Global News Guessing Game is a two-tier web application consisting of a React single-page application (frontend) and a Python FastAPI service (backend). The frontend implements a news guessing game where players read headlines and must guess their source city by clicking on an interactive map. The backend manages game sessions, provides headlines for gameplay, and validates player guesses against actual news locations.

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
                              |                   |         +-------------------+
                              |                   |
                              |   Game Sessions   |
                              |   (in-memory or   |
                              |    persistent)    |
                              |                   |
                              +--------+----------+
                                       |
                                       v
                              +-------------------+
                              |                   |
                              |   In-Memory Cache |
                              |   (30 min TTL)    |
                              |                   |
                              +-------------------+
```

## Game Modes

The application supports two game flows:

### Game Mode (Primary)
Players participate in a guessing game where:
1. A game session is created with 5 rounds
2. Each round presents a headline from a random city
3. Players click the map to place their guess
4. After submission, distance and score are calculated
5. Players advance through 5 rounds accumulating points
6. Final score is calculated and displayed

### Map Exploration (Legacy)
Users can view news from cities by hovering over markers (if implemented as a legacy feature).

## Data Flow - Game Session

A game session flow follows these steps:

1. **Game initiation:** The user clicks "Start Game" in the React frontend.

2. **Session creation:** The `useGame` hook calls `POST /api/game/start`. The backend creates a new game session and selects the first random headline.

3. **Headline presentation:** The backend returns the headline text (without location info) and a unique `game_id`. The frontend displays the headline and interactive map.

4. **Player guesses:** The player clicks on the map to place their guess (latitude/longitude).

5. **Guess submission:** The `useGame` hook calls `POST /api/game/{game_id}/guess` with the coordinates.

6. **Distance calculation:** The backend:
   - Retrieves the game session and current round's actual location
   - Calculates distance from guess coordinates to actual city coordinates
   - Converts distance to a score (1000 points at 0 km, scaling down to 0 points at 20,000+ km)
   - Returns location data, distance, and score to the frontend

7. **Result display:** The frontend displays the actual location, distance, and score for the round.

8. **Next round:** The player clicks "Next Round" or the application determines if it's the final round.

9. **Round progression:** If not the final round, `GET /api/game/{game_id}/next` fetches the next headline.

10. **Game completion:** After 5 rounds, the final score is displayed with game summary.

## Backend Architecture

### Directory Structure

```
service/
  src/global_news_map/
    main.py              # Application entry point and middleware configuration
    config.py            # Settings management with pydantic-settings
    api/
      routes.py          # API endpoint definitions (/api/game/*, /api/locations)
    models/
      schemas.py         # Pydantic models for request/response validation
    services/
      news.py            # News fetching, fallback logic, and caching
      locations.py       # Location data loading and lookup
      game.py            # Game session management and scoring logic
    utils/
      distance.py        # Distance calculation utilities
```

### Application Startup

The FastAPI application uses a lifespan context manager defined in `main.py`. During startup, it calls `load_locations()` which reads `service/data/locations.json` and parses each entry into a `Location` Pydantic model. These are stored in a module-level list in `services/locations.py` and remain in memory for the lifetime of the process.

Logging is configured at startup to provide visibility into the application state. When locations are loaded successfully, you will see:

```
INFO - Loading locations from: .../service/data/locations.json
INFO - Successfully loaded 20 locations
```

If there are any errors loading the locations file (file not found, invalid JSON), the application will log an error and fail to start.

### Configuration

Settings are managed by the `Settings` class in `config.py`, which extends `pydantic_settings.BaseSettings`. Configuration values are read from environment variables or a `.env` file in the service directory. The three configurable values are:

- `NEWS_API_KEY` -- API key for NewsAPI.org (default: empty string).
- `CACHE_TTL_MINUTES` -- Cache duration in minutes (default: 30).
- `LOCATIONS_FILE` -- Path to the locations JSON file (default: `data/locations.json`, relative to service working directory).

### Caching Strategy

The cache is a module-level Python dictionary in `services/news.py` with the structure:

```python
_cache: dict[str, tuple[Headline, float]] = {}
```

Each entry maps a `location_id` to a tuple of the `Headline` object and a Unix timestamp of when it was cached. On each request, the cache is checked first. If the entry exists and the elapsed time is less than the TTL, the cached headline is returned. If the entry has expired, it is deleted and a fresh fetch is performed.

This approach is simple and effective for single-worker deployments. In multi-worker configurations (using `--workers > 1`), each Uvicorn worker maintains its own independent cache.

### Data Models

Pydantic models are defined in `models/schemas.py`:

- **Location** -- Represents a city with `location_id`, `city`, `country`, `lat`, `lng`, and `timezone` fields.
- **Headline** -- Represents a news headline with `title`, `source`, `published_at`, `url`, and `cached_at` fields.
- **GameStartResponse** -- Response when starting a game with `game_id`, `current_round_number`, and `headline`.
- **GuessRequest** -- Request body with player's `lat` and `lng` coordinates.
- **GuessResponse** -- Response after guess submission with `location_id`, `city`, `country`, `distance_km`, `score`, `is_final_round`, `total_score`.
- **NextRoundResponse** -- Response for next round with `round_number` and `headline`.
- **HealthResponse** -- The API response for the health endpoint with `status` and `version` fields.

## Frontend Architecture

### Directory Structure

```
ui/
  src/
    main.jsx                    # React DOM entry point
    App.jsx                     # Root component, game state orchestration
    App.css                     # Application-level styles with theme CSS variables
    contexts/
      ThemeContext.jsx          # Theme provider for dark/light mode
    components/
      WorldMap.jsx              # Map container with tile layer and markers/guess pins
      WorldMap.css              # Map styling
      LocationMarker.jsx        # Individual city marker component (blue pins)
      ThemeToggle.jsx           # Theme toggle button component
      ThemeToggle.css           # Theme toggle styling
      game/
        GameStartScreen.jsx      # Welcome screen with rules and start button
        GameStartScreen.css      # Start screen styling
        GameHUD.jsx             # In-game HUD (score display, hint)
        GameHUD.css             # HUD styling
        HeadlineBox.jsx         # Displays current headline with submit button
        HeadlineBox.css         # Headline box styling
        RoundResultModal.jsx    # Round result with distance and score
        RoundResultModal.css    # Result modal styling
        GameResultsScreen.jsx   # Final game summary and score
        GameResultsScreen.css   # Results screen styling
        ScoreDisplay.jsx        # Score counter component
        ScoreDisplay.css        # Score display styling
    hooks/
      useGame.js                # Hook for game state, API calls, and session management
```

### Component Hierarchy

```
App
  +-- header
  |     +-- title
  |     +-- ScoreDisplay (when active/round_complete)
  |     +-- ThemeToggle
  +-- main
      +-- GameStartScreen (state: idle)
      +-- game-container (state: active/round_complete)
      |     +-- WorldMap
      |           +-- MapContainer (react-leaflet)
      |                 +-- TileLayer (OpenStreetMap)
      |                 +-- Guess Pin (player's click)
      |     +-- HeadlineBox
      +-- RoundResultModal (state: round_complete)
      +-- GameResultsScreen (state: game_complete)
      +-- error-message (if error exists)
```

### Component Responsibilities

**App** (`App.jsx`): The root component orchestrating game flow. Uses the `useGame` hook to manage game state. Renders different screens based on `gameState`: idle (start screen), active (map + headline), round_complete (result modal), game_complete (final results). Includes header with score display and theme toggle.

**WorldMap** (`WorldMap.jsx`): Wraps react-leaflet `MapContainer` and `TileLayer`. When in game mode, renders the player's guess pin at clicked coordinates and handles map clicks for guess placement. Displays actual city markers for reference. The map is centered at (20, 0) with zoom 2 initially.

**HeadlineBox** (`game/HeadlineBox.jsx`): Displays the current round's headline and provides the "Submit Guess" button. Becomes enabled only after player places a guess pin.

**RoundResultModal** (`game/RoundResultModal.jsx`): Modal overlay showing the result of a guess with: actual location, distance in km, points earned, and "Next Round" button. Different layout for final round.

**GameStartScreen** (`game/GameStartScreen.jsx`): Welcome screen with game title, rules explanation, scoring table, and "Start Game" button.

**GameResultsScreen** (`game/GameResultsScreen.jsx`): Final screen showing total score, average accuracy, and "Play Again" button.

**ScoreDisplay** (`game/ScoreDisplay.jsx`): Compact component showing current round number and total score.

### Custom Hooks

**useGame** (`hooks/useGame.js`): Manages all game state and API interactions. State includes: `gameId`, `currentRound`, `roundNumber`, `guessPin`, `roundResult`, `gameState`, `totalScore`, `loading`, `error`. Methods include: `startGame()`, `placeGuess(lat, lng)`, `submitGuess()`, `nextRound()`, `resetGame()`. Handles game session lifecycle and error scenarios (expired sessions, network errors).

### Theme System

The application supports light and dark themes via React Context and CSS variables:

**ThemeContext** (`contexts/ThemeContext.jsx`): Provides global theme state management. The `ThemeProvider` component wraps the entire application and manages theme state, localStorage persistence, and applying the `data-theme` attribute to the document body. The `useTheme()` hook exposes `{ theme, toggleTheme }` to child components.

**CSS Variables** (`App.css`): Theme colors are defined as CSS variables in two scopes:
- `:root` defines light theme colors (default)
- `[data-theme="dark"]` defines dark theme colors

All color references throughout the application use these variables (e.g., `var(--text-primary)`, `var(--bg-secondary)`), ensuring consistent theming. A 300ms transition is applied to all color properties for smooth theme switching.

**ThemeToggle** (`components/ThemeToggle.jsx`): A button component that displays a sun (☀️) or moon (🌙) icon based on the current theme and calls `toggleTheme()` when clicked. The user's theme preference persists in localStorage.

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
