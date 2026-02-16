# Global News Map

An interactive web application that displays live news headlines from cities around the world on a map. Click on any city marker to read the latest headlines for that location.

## Features

- Interactive world map with clickable city markers
- Coverage of 20 major cities across six continents
- Live headlines fetched from NewsAPI
- Server-side caching to reduce API calls and improve response times
- Responsive design that works on desktop and mobile browsers

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- A [NewsAPI](https://newsapi.org/) API key

### Backend Setup

```bash
cd service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Frontend Setup

```bash
cd ui
npm install
```

### Running the Application

1. Start the backend server:

```bash
cd service
export NEWS_API_KEY=your_api_key_here
uvicorn src.global_news_map.main:app --reload
```

2. Start the frontend development server:

```bash
cd ui
npm start
```

The application will be available at `http://localhost:3000`.

## Project Structure

```
global_news_map/
├── service/       # FastAPI backend (API routes, data models, caching)
├── ui/            # React frontend (map, components, styles)
├── data/          # Static data files (city coordinates, config)
├── docs/          # Documentation (API reference, user guide, changelog)
└── scripts/       # Utility and deployment scripts
```

## Tech Stack

- **Backend:** FastAPI (Python)
- **Frontend:** React
- **Map:** Leaflet
- **News Source:** NewsAPI

## Environment Variables

| Variable       | Description                          | Required |
|----------------|--------------------------------------|----------|
| `NEWS_API_KEY` | API key from https://newsapi.org/    | Yes      |

## Documentation

See the [docs/](docs/) directory for detailed documentation, including the API reference, user guide, and changelog.

## License

This project is licensed under the MIT License.
