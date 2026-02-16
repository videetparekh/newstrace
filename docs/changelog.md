# Changelog

All notable changes to the Global News Map project are documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2025-01-15

### Added

- **Backend API** built with FastAPI, serving three endpoints: `/api/health`, `/api/locations`, and `/api/news/{location_id}`.
- **NewsAPI integration** as the primary news source, fetching top headlines by city name.
- **Google News RSS fallback** for headline retrieval when NewsAPI is unavailable or returns no results.
- **In-memory caching** of news headlines with a configurable TTL (default: 30 minutes) to reduce external API calls.
- **Location data** with 20 major cities across six continents, stored in `data/locations.json`. Cities include New York, London, Tokyo, Paris, Sydney, Mumbai, Sao Paulo, Cairo, Moscow, Beijing, Dubai, Singapore, Toronto, Berlin, Lagos, Mexico City, Seoul, Buenos Aires, Nairobi, and Istanbul.
- **React frontend** with an interactive world map powered by react-leaflet and OpenStreetMap tiles.
- **WorldMap component** displaying city markers at geographic coordinates with zoom levels from 2 to 10.
- **LocationMarker component** for individual city markers with click handling.
- **HeadlineCard component** displaying headline title, source, publication time, and a link to the full article.
- **LoadingState component** for visual feedback during data fetches.
- **Custom React hooks** (`useLocations` and `useNews`) for data fetching and state management.
- **Vite development server** with proxy configuration forwarding `/api` requests to the backend at `http://localhost:8000`.
- **CORS middleware** configured on the backend for cross-origin requests during development.
- **Pydantic data models** for type-safe request validation and response serialization (`Location`, `Headline`, `NewsResponse`, `HealthResponse`).
- **Environment-based configuration** using pydantic-settings with support for `.env` files.
- **Backend test suite** using pytest and pytest-asyncio.
- **Frontend test setup** using Vitest with jsdom environment and Testing Library.
- **ESLint configuration** for frontend code quality.
- **Poetry** for backend dependency management.
- **Yarn** for frontend dependency management.
