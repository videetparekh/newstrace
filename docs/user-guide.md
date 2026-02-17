# User Guide

Global News Guessing Game is an interactive web application where you test your geography knowledge by guessing where news headlines are happening. The game uses real headlines from 20 major cities around the world.

## Overview

When you start the application, you'll see a welcome screen with game rules and scoring information. Click "Start Game" to begin playing. The game consists of 5 rounds where you see a headline and must guess which city it comes from by clicking on the map.

## How to Play

### Starting a Game

1. Click the "Start Game" button on the welcome screen.
2. The first headline will load, and the interactive world map will appear.
3. Read the headline carefully to help you guess the location.

### Making a Guess

1. Click anywhere on the map where you think the news headline is from.
2. A blue marker pin will appear showing your guess location.
3. You can click a new location to move your guess pin.
4. Once you're confident in your guess, click the "Submit Guess" button.

### Viewing Your Score

After submitting your guess:
1. A result screen shows how accurate your guess was.
2. You'll see the distance between your guess and the actual location.
3. Your score for that round is displayed (up to 1,000 points).
4. Your cumulative total score is shown.

### Playing Multiple Rounds

1. Click "Next Round" to move to the next headline.
2. Repeat the guessing process for all 5 rounds.
3. After round 5, your final score will be displayed with your game summary.

## Scoring System

Points are awarded based on accuracy:

- **Perfect guess (0 km away):** 1,000 points
- **10,000 km away:** 500 points
- **20,000+ km away:** 0 points
- **Maximum possible score:** 5,000 points (1,000 per round × 5 rounds)

Closer guesses earn more points. The scoring formula rewards geographic accuracy.

## Navigating the Map

### Zooming

- **Scroll wheel:** Scroll up to zoom in, scroll down to zoom out.
- **Zoom controls:** Use the `+` and `-` buttons in the top-left corner of the map.
- **Pinch gesture (touchscreens):** Pinch to zoom in and out on mobile and tablet devices.

The map supports zoom levels from 2 (full world view) to 10 (city-level detail).

### Panning

- **Click and drag:** Click anywhere on the map and drag to move around.
- **Touch and drag (touchscreens):** Touch and slide your finger to pan the map on mobile devices.

### Default View

The map loads centered at coordinates (20, 0), which provides a balanced view of all continents. All 20 city markers are visible at the default zoom level.

## Theme Toggle

The application supports both light and dark themes. To switch between themes:

1. Click the theme toggle button in the top-right corner of the header.
2. In light mode, the button shows a 🌙 moon icon.
3. In dark mode, the button shows a ☀️ sun icon.

Your theme preference is automatically saved and will persist when you reload the application. The theme applies to all interface elements including the header, score display, and game screens.

## Supported Cities

The application covers the following 20 cities:

| City          | Country              |
|---------------|----------------------|
| New York      | United States        |
| London        | United Kingdom       |
| Tokyo         | Japan                |
| Paris         | France               |
| Sydney        | Australia            |
| Mumbai        | India                |
| Sao Paulo     | Brazil               |
| Cairo         | Egypt                |
| Moscow        | Russia               |
| Beijing       | China                |
| Dubai         | United Arab Emirates |
| Singapore     | Singapore            |
| Toronto       | Canada               |
| Berlin        | Germany              |
| Lagos         | Nigeria              |
| Mexico City   | Mexico               |
| Seoul         | South Korea          |
| Buenos Aires  | Argentina            |
| Nairobi       | Kenya                |
| Istanbul      | Turkey               |

## Mobile Usage

The application is playable on mobile devices and tablets. On smaller screens:

- The map occupies the full viewport width.
- Use standard touch gestures (pinch to zoom, drag to pan) to navigate the map.
- Tap on the map to place your guess marker.
- Tap the "Submit Guess" button to submit your answer.

## Error States

If something goes wrong:

- **"Game session expired":** The game session timed out. Click "Play Again" to start a new game.
- **"Failed to fetch headlines":** A network error occurred. Check your internet connection and try starting a new game.

## Tips for Better Guessing

- Read the headline carefully for location clues (place names, languages, time references).
- Consider regional news patterns and which cities frequently appear in the news.
- Use the map zoom to explore different regions while thinking about your guess.
- Remember that some news stories have regional or global impact and may originate from major news hubs.
