# Deployment Guide

This document covers how to build and deploy the Global News Map application for production environments. It includes instructions for Docker-based deployment, manual production builds, and environment variable configuration.

## Environment Variables

The following environment variables must be configured for production:

| Variable            | Required | Default                     | Description                                                  |
|---------------------|----------|-----------------------------|--------------------------------------------------------------|
| `NEWS_API_KEY`      | Yes      | `""` (empty)                | API key from [NewsAPI.org](https://newsapi.org). Without this, the service falls back to Google News RSS only. |
| `CACHE_TTL_MINUTES` | No       | `30`                        | How long (in minutes) to cache each headline in memory.      |
| `LOCATIONS_FILE`    | No       | `data/locations.json`       | Path to the locations JSON data file (relative to service working directory). |

## Production Builds

### Backend

The FastAPI backend should be run with Uvicorn in production mode (without `--reload`). For production, use multiple workers to handle concurrent requests:

```bash
cd service
poetry install --only main
poetry run uvicorn global_news_map.main:app --host 0.0.0.0 --port 8000 --workers 4
```

The `--workers 4` flag spawns four worker processes. Adjust this number based on the number of available CPU cores.

### Frontend

Build the React frontend into static assets:

```bash
cd ui
yarn install --frozen-lockfile
yarn build
```

This produces optimized static files in the `ui/dist/` directory. These files can be served by any static file server (Nginx, Caddy, a CDN, etc.).

**Important:** In production, the frontend must be configured to send API requests to the backend's actual URL, since the Vite development proxy will not be available. You can achieve this by serving the frontend through a reverse proxy that forwards `/api` paths to the backend, or by configuring the `VITE_API_BASE_URL` at build time.

## Docker Deployment

### Dockerfile for the Backend

Create a `Dockerfile` in the `service/` directory:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

RUN pip install poetry && \
    poetry config virtualenvs.create false

COPY pyproject.toml poetry.lock ./
RUN poetry install --only main --no-interaction

COPY src/ src/
COPY data/ data/

ENV LOCATIONS_FILE=/app/data/locations.json

EXPOSE 8000

CMD ["uvicorn", "global_news_map.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

Build and run:

```bash
docker build -t global-news-map-api ./service
docker run -d \
  --name gnm-api \
  -p 8000:8000 \
  -e NEWS_API_KEY=your_api_key_here \
  -e CACHE_TTL_MINUTES=30 \
  global-news-map-api
```

### Dockerfile for the Frontend

Create a `Dockerfile` in the `ui/` directory to build the frontend and serve it with Nginx:

```dockerfile
FROM node:18-alpine AS build

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration

Create an `nginx.conf` file in the `ui/` directory to proxy API requests to the backend:

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location /api/ {
        proxy_pass http://gnm-api:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Build and run:

```bash
docker build -t global-news-map-ui ./ui
docker run -d \
  --name gnm-ui \
  -p 80:80 \
  --link gnm-api \
  global-news-map-ui
```

### Docker Compose

For convenience, create a `docker-compose.yml` in the project root:

```yaml
version: "3.8"

services:
  api:
    build: ./service
    container_name: gnm-api
    ports:
      - "8000:8000"
    environment:
      - NEWS_API_KEY=${NEWS_API_KEY}
      - CACHE_TTL_MINUTES=30
      - LOCATIONS_FILE=/app/data/locations.json
    volumes:
      - ./service/data:/app/data:ro
    restart: unless-stopped

  ui:
    build: ./ui
    container_name: gnm-ui
    ports:
      - "80:80"
    depends_on:
      - api
    restart: unless-stopped
```

Run the full stack:

```bash
NEWS_API_KEY=your_api_key_here docker compose up -d
```

## Production Considerations

### CORS

The default CORS configuration allows all origins (`*`). For production, update `service/src/global_news_map/main.py` to restrict `allow_origins` to your frontend's domain:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-domain.com"],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)
```

### HTTPS

Use a reverse proxy (Nginx, Caddy, or a cloud load balancer) to terminate TLS in front of the application containers. Do not expose the backend directly to the internet without TLS.

### Health Checks

Use the `/api/health` endpoint for container health checks and load balancer readiness probes:

```yaml
# Docker Compose health check example
services:
  api:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
```

### Caching

The default in-memory cache is not shared across Uvicorn workers. In a multi-worker setup, each worker maintains its own cache. For deployments requiring shared caching, consider adding Redis as an external cache store.

### Logging

Uvicorn provides access logs by default. For structured logging in production, configure a logging framework and pipe output to your log aggregation system.
