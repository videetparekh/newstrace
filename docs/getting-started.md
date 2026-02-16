# Getting Started

This guide walks you through setting up the Global News Map project for local development. The application consists of a Python FastAPI backend service and a React frontend, which together display the latest news headlines on an interactive world map.

## Prerequisites

Before you begin, ensure the following tools are installed on your machine:

| Tool       | Minimum Version | Purpose                         |
|------------|----------------|---------------------------------|
| Python     | 3.11+          | Backend runtime                 |
| Node.js    | 18+            | Frontend runtime                |
| Poetry     | 1.7+           | Python dependency management    |
| Yarn       | 1.22+          | Node.js dependency management   |

You will also need a **NewsAPI key** for full functionality. You can obtain one for free at [https://newsapi.org](https://newsapi.org). The application will fall back to Google News RSS if no key is provided, but results may be less reliable.

## Project Structure

```
global_news_map/
  service/                  # FastAPI backend
    data/
      locations.json        # 20 city definitions with coordinates
    src/global_news_map/
      api/routes.py         # API endpoint definitions
      models/schemas.py     # Pydantic data models
      services/news.py      # News fetching and caching logic
      services/locations.py # Location data loader
      config.py             # Application settings
      main.py               # FastAPI application entry point
    pyproject.toml          # Poetry project configuration
  ui/                       # React frontend
    src/
      components/           # React components (WorldMap, HeadlineCard, etc.)
      hooks/                # Custom hooks (useLocations, useNews)
      App.jsx               # Root application component
      main.jsx              # Entry point
    package.json            # Yarn project configuration
    vite.config.js          # Vite build and dev server configuration
```

## Backend Setup

1. Navigate to the service directory:

```bash
cd service
```

2. Install Python dependencies with Poetry:

```bash
poetry install
```

3. Configure the NewsAPI key. Create a `.env` file in the `service/` directory:

```bash
echo 'NEWS_API_KEY=your_api_key_here' > .env
```

Alternatively, you can export the environment variable directly:

```bash
export NEWS_API_KEY=your_api_key_here
```

4. Start the backend development server:

```bash
poetry run python3 src/global_news_map/main.py
```

Alternatively, you can use Uvicorn directly:

```bash
poetry run uvicorn global_news_map.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. When the server starts, you should see log output indicating locations were loaded successfully:

```
INFO - Loading locations from: .../service/data/locations.json
INFO - Successfully loaded 20 locations
```

You can verify the API is running by visiting `http://localhost:8000/api/health` in your browser or with curl:

```bash
curl http://localhost:8000/api/health
```

Expected response:

```json
{"status": "ok", "version": "1.0.0"}
```

## Frontend Setup

1. Open a new terminal and navigate to the UI directory:

```bash
cd ui
```

2. Install Node.js dependencies with Yarn:

```bash
yarn install
```

3. Start the frontend development server:

```bash
yarn dev
```

The React application will be available at `http://localhost:5173`. The Vite development server is configured to proxy all `/api` requests to `http://localhost:8000`, so both servers must be running simultaneously.

## Running Both Servers

For local development, you need two terminal sessions running concurrently:

**Terminal 1 -- Backend:**

```bash
cd service
poetry run python3 src/global_news_map/main.py
```

**Terminal 2 -- Frontend:**

```bash
cd ui
yarn dev
```

Then open `http://localhost:5173` in your browser to use the application.

## Running Tests

**Backend tests:**

```bash
cd service
poetry run pytest
```

**Frontend tests:**

```bash
cd ui
yarn vitest run
```

## Environment Variables

| Variable           | Required | Default                      | Description                                  |
|--------------------|----------|------------------------------|----------------------------------------------|
| `NEWS_API_KEY`     | No       | `""` (empty)                 | API key for NewsAPI.org. Falls back to Google News RSS if not set. |
| `CACHE_TTL_MINUTES`| No       | `30`                         | Duration in minutes to cache news headlines. |
| `LOCATIONS_FILE`   | No       | `data/locations.json`        | Path to the locations JSON file (relative to working directory). |

## Troubleshooting

**Backend fails to start with module not found errors:**
Ensure you are running the command from within the `service/` directory and that `poetry install` completed successfully.

**Frontend shows a blank map or network errors:**
Confirm the backend server is running on port 8000. The Vite proxy expects the API at `http://localhost:8000`.

**No news headlines appear when clicking a city:**
If `NEWS_API_KEY` is not set, the application relies on Google News RSS, which may occasionally be rate-limited. Check the backend terminal for error messages.
