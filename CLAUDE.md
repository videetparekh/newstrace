# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Global News Map is a two-tier web application that displays the latest news headlines from 20 major cities on an interactive world map. It consists of:

- **Backend**: Python FastAPI service that fetches news from NewsAPI.org (with Google News RSS fallback) and serves location data
- **Frontend**: React 19.2 application with react-leaflet for interactive maps, theme toggle, and dynamic headline display

## Development Commands

### Backend (FastAPI)

```bash
cd service/

# Install dependencies
poetry install

# Run development server (local deployment style)
poetry run python3 src/global_news_map/main.py

# Or use Uvicorn directly with auto-reload
poetry run uvicorn global_news_map.main:app --reload --port 8000

# Run all tests
poetry run pytest

# Run specific test file
poetry run pytest tests/test_routes.py

# Run with coverage
poetry run pytest --cov=global_news_map --cov-report=html

# Lint with Ruff
poetry run ruff check .

# Format with Ruff
poetry run ruff format .
```

Backend runs on http://localhost:8000
Health check: http://localhost:8000/api/health

### Frontend (React + Vite)

```bash
cd ui/

# Install dependencies
yarn install

# Run development server
yarn dev

# Run all tests
yarn vitest run

# Run tests in watch mode
yarn vitest

# Run specific test file
yarn vitest run src/components/WorldMap.test.jsx

# Build for production
yarn build

# Preview production build
yarn preview

# Lint
yarn lint
```

Frontend runs on http://localhost:5173 (Vite dev server proxies `/api` requests to backend)

### Docker Compose

```bash
# From project root
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

## Architecture & Key Concepts

### Local Deployment Pattern

The preferred local development approach is to run each service from its own directory:
- **Backend**: `cd service/ && poetry run python3 src/global_news_map/main.py`
- **Frontend**: `cd ui/ && yarn dev`

This pattern influences how paths are resolved in the backend configuration.

### Locations Data Architecture

**Critical**: The `locations.json` file is stored in `service/data/locations.json` and served via the `/api/locations` endpoint.

**Why this matters**:
- In Docker Compose, volume mounts make paths work regardless of location
- In local deployment, running from `service/` directory requires the data file to be within the service directory
- The config uses a relative path: `locations_file: str = "data/locations.json"`
- Path resolution in `services/locations.py` handles both absolute and relative paths

**Loading process**:
1. Backend startup triggers lifespan context manager in `main.py`
2. Calls `load_locations()` from `services/locations.py`
3. Resolves path, reads JSON, validates with Pydantic `Location` models
4. Stores in module-level `_locations` list for fast lookup
5. Logs success/failure with INFO level messages

**Console output you should see on successful startup**:
```
INFO - Loading locations from: .../service/data/locations.json
INFO - Successfully loaded 20 locations
```

If locations fail to load, the application will not start. Check for `FileNotFoundError` or `JSONDecodeError` in logs.

### Caching Strategy

Headlines are cached in a module-level Python dictionary in `services/news.py`:
```python
_cache: dict[str, tuple[Headline, float]] = {}
```

- Each entry maps `location_id` → `(Headline, timestamp)`
- Default TTL: 30 minutes (configurable via `CACHE_TTL_MINUTES`)
- Cache is per-worker in multi-worker deployments (not shared across Uvicorn workers)

### Theme System

Dark/light mode is implemented with CSS variables and React Context:

**Frontend Architecture**:
- `contexts/ThemeContext.jsx` provides global theme state via React Context
- `components/ThemeToggle.jsx` renders the sun/moon toggle button
- Theme preference persists in localStorage as `'light'` or `'dark'`
- `document.body` receives `data-theme` attribute that CSS responds to

**CSS Variables**:
- `:root` defines light theme colors (default)
- `[data-theme="dark"]` overrides for dark theme
- All components use `var(--bg-primary)`, `var(--text-primary)`, etc.
- 300ms transition applied to color properties for smooth switching

**Key variables**:
- `--bg-primary`, `--bg-secondary` - background colors
- `--text-primary`, `--text-secondary`, `--text-tertiary` - text colors
- `--border-color` - borders and dividers
- `--accent-color` - interactive elements and highlights

## Configuration

Environment variables (set in `service/.env` or via shell):

| Variable            | Default                | Description                                    |
|---------------------|------------------------|------------------------------------------------|
| `NEWS_API_KEY`      | `""` (empty)           | API key from NewsAPI.org (fallback to Google News RSS if empty) |
| `CACHE_TTL_MINUTES` | `30`                   | How long to cache headlines in memory          |
| `LOCATIONS_FILE`    | `data/locations.json`  | Path to locations JSON (relative to service working directory) |

## Documentation Sync Requirements

⚠️ **CRITICAL**: When updating documentation, you MUST keep the following files in sync:

### Primary Documentation (docs/ directory)
- `docs/getting-started.md` - Setup instructions and prerequisites
- `docs/architecture.md` - System design and component architecture
- `docs/deployment.md` - Production deployment and Docker instructions
- `docs/user-guide.md` - End-user feature documentation

### UI Help Content (MUST UPDATE TOGETHER)
- `ui/public/docs/how-to-use.md` - User-facing help displayed in the HelpModal component

**Why this matters**: The HelpModal component fetches `how-to-use.md` at runtime and displays it to users. If you update feature documentation in `docs/`, you MUST also update the UI help content to reflect those changes.

**Example workflow**: If you add a feature and document it in `docs/user-guide.md`, you MUST also add instructions to `ui/public/docs/how-to-use.md` so users can learn about it through the "How to Use" button in the application.

**When to update both**:
- Adding or removing features that users interact with
- Changing UI behavior (keyboard shortcuts, navigation, interactions)
- Updating city lists or supported regions
- Modifying theme/appearance features
- Changing caching behavior that affects user experience

## Code Patterns & Conventions

### Backend Patterns

**FastAPI Routes** (`api/routes.py`):
- All endpoints prefixed with `/api`
- Use Pydantic response models for type safety and auto-documentation
- Return appropriate HTTP status codes (200, 404, 503)

**Service Layer** (`services/`):
- Locations service maintains module-level `_locations` list
- News service handles fetching, fallback logic, and caching
- Both use logging extensively for visibility

**Error Handling**:
- Location not found → 404 with clear error message
- News fetch failure (both sources) → 503 with error message
- File loading errors → Log error and fail to start

**Logging**:
- Configure in `main.py` with `logging.basicConfig()`
- Use module-level loggers: `logger = logging.getLogger(__name__)`
- INFO for successful operations, ERROR for failures, DEBUG for details

### Frontend Patterns

**Custom Hooks** (`hooks/`):
- `useLocations()` - Fetches locations once on mount, returns `{ locations, loading }`
- `useNews()` - Manages headline state, provides `fetchNews(locationId)` and `clearHeadline()`, returns `{ headline, loading, error, fetchNews, clearHeadline }`

**Component Structure**:
- `App.jsx` orchestrates state and renders map + sidebar
- `WorldMap.jsx` wraps react-leaflet components and renders markers
- `LocationMarker.jsx` handles individual city markers and click events
- `HeadlineCard.jsx` displays fetched headline with metadata
- `HelpModal.jsx` fetches and displays markdown from `ui/public/docs/how-to-use.md`

**Theme Usage**:
- Import `useTheme()` from `contexts/ThemeContext`
- Destructure `{ theme, toggleTheme }`
- Use CSS variables in stylesheets, not inline styles

**API Calls**:
- Use native `fetch()` API
- Vite dev server proxies `/api` to `http://localhost:8000` (configured in `vite.config.js`)
- Handle loading states with component state
- Display errors in UI when fetch fails

## Testing

### Backend Tests

Tests use pytest fixtures and FastAPI TestClient:

```python
from fastapi.testclient import TestClient
from global_news_map.main import app

def test_health_endpoint():
    client = TestClient(app)
    response = client.get("/api/health")
    assert response.status_code == 200
```

Common fixtures:
- `client` - FastAPI TestClient instance
- Mock external API calls (NewsAPI, Google News RSS)

### Frontend Tests

Tests use Vitest + Testing Library + jsdom:

```javascript
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

test('renders component', () => {
  render(<MyComponent />)
  expect(screen.getByText('Expected Text')).toBeInTheDocument()
})
```

Setup file: `setupTests.js` configures Testing Library matchers

## File Structure Reference

```
global_news_map/
├── service/                    # FastAPI backend
│   ├── data/
│   │   └── locations.json      # 20 city definitions (served via /api/locations)
│   ├── src/global_news_map/
│   │   ├── main.py             # App entry point, logging config, lifespan
│   │   ├── config.py           # Settings with pydantic-settings
│   │   ├── api/
│   │   │   └── routes.py       # API endpoints (/api/locations, /api/news/{id})
│   │   ├── models/
│   │   │   └── schemas.py      # Pydantic models (Location, Headline, NewsResponse)
│   │   └── services/
│   │       ├── locations.py    # Load and lookup locations with logging
│   │       └── news.py         # Fetch headlines, fallback logic, caching
│   ├── tests/                  # pytest test suite
│   ├── pyproject.toml          # Poetry dependencies and config
│   └── .env                    # Environment variables (NEWS_API_KEY, etc.)
├── ui/                         # React frontend
│   ├── public/
│   │   └── docs/
│   │       └── how-to-use.md   # ⚠️ MUST UPDATE when docs/ changes
│   ├── src/
│   │   ├── main.jsx            # React DOM entry, wraps App with ThemeProvider
│   │   ├── App.jsx             # Root component, state orchestration
│   │   ├── App.css             # CSS variables for theming
│   │   ├── contexts/
│   │   │   └── ThemeContext.jsx  # Theme state management and localStorage
│   │   ├── components/
│   │   │   ├── WorldMap.jsx    # Map container with markers
│   │   │   ├── LocationMarker.jsx  # Individual city marker
│   │   │   ├── HeadlineCard.jsx    # News display card
│   │   │   ├── ThemeToggle.jsx     # Dark/light mode toggle button
│   │   │   └── HelpModal.jsx       # Fetches how-to-use.md
│   │   └── hooks/
│   │       ├── useLocations.js # Fetch locations on mount
│   │       └── useNews.js      # Headline fetching logic
│   ├── vite.config.js          # Vite config with /api proxy
│   └── package.json            # Yarn dependencies
├── docs/                       # Developer documentation
│   ├── getting-started.md      # Setup instructions
│   ├── architecture.md         # System design
│   ├── deployment.md           # Production deployment
│   └── user-guide.md           # Feature documentation
├── docker-compose.yml          # Orchestration (api + ui services)
└── CLAUDE.md                   # This file
```

## Common Tasks

### Adding a New City

1. Edit `service/data/locations.json`
2. Add entry with `location_id`, `city`, `country`, `lat`, `lng`, `timezone`
3. Restart backend to reload locations
4. Verify marker appears on map at correct coordinates
5. Update `docs/user-guide.md` with new city in the table
6. Update `ui/public/docs/how-to-use.md` with new city in the table

### Changing Cache Duration

1. Set `CACHE_TTL_MINUTES` environment variable in `service/.env`
2. Restart backend to apply new TTL
3. Update `docs/user-guide.md` if caching behavior is documented

### Updating Styles

1. Modify CSS files, using `var(--css-variable)` for colors
2. Test in both light and dark themes
3. Ensure 300ms transition applies to new color properties

### Adding a New API Endpoint

1. Define route in `service/src/global_news_map/api/routes.py`
2. Add Pydantic response model in `service/src/global_news_map/models/schemas.py`
3. Implement logic in appropriate service module
4. Add pytest test in `service/tests/`
5. Update `docs/architecture.md` if endpoint represents new functionality

### Troubleshooting "No Markers on Map"

**Symptom**: Map loads but no city markers appear

**Diagnosis**:
1. Check backend console for location loading logs
2. Expected: `INFO - Successfully loaded 20 locations`
3. If missing, backend failed to load locations.json

**Common causes**:
- Path resolution issue (file not in `service/data/locations.json`)
- Invalid JSON syntax in locations.json
- Pydantic validation failure (missing required fields)

**Fix**:
1. Verify file exists: `ls service/data/locations.json`
2. Validate JSON syntax: `python3 -m json.tool service/data/locations.json`
3. Check backend logs for specific error messages
4. Ensure running from correct directory (`cd service/` before starting)

### Deploying to Production

1. Set `NEWS_API_KEY` environment variable
2. Build frontend: `cd ui && yarn build`
3. Configure reverse proxy (Nginx) to:
   - Serve `ui/dist/` static files
   - Proxy `/api` to backend
   - Terminate TLS/HTTPS
4. Run backend with multiple workers: `uvicorn global_news_map.main:app --host 0.0.0.0 --port 8000 --workers 4`
5. Update CORS settings in `main.py` to restrict origins
6. Configure health checks using `/api/health` endpoint

See `docs/deployment.md` for detailed Docker Compose and containerization instructions.
