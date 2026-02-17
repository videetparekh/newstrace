# Global News Guessing Game - How to Play

Welcome to Global News Guessing Game! This guide explains how to play and use all the features of the application.

## Overview

Global News Guessing Game is an interactive geography quiz where you test your knowledge by guessing which city a news headline comes from. The game features real headlines from 20 major cities around the world, and you play 5 rounds trying to maximize your score.

## Getting Started

1. When you open the application, you'll see the welcome screen with game rules and scoring information.
2. Click the "Start Game" button to begin playing.
3. The first headline will load along with an interactive world map.

## How to Play

### Reading the Headline

Each round presents a news headline. Read it carefully—it may contain location clues such as:

- City or country names
- Language hints
- Regional context
- Time-sensitive information

### Making Your Guess

1. Click on the map where you think the news headline is from.
2. A blue marker pin will appear at your click location.
3. You can click multiple times to move your guess pin to a different location.
4. Zoom in and out using the map controls or scroll wheel to get a better view of the region you're guessing.

### Submitting Your Guess

1. Once you've placed your guess, click the "Submit Guess" button.
2. The application will show you the actual location and your accuracy.
3. You'll see:
   - The distance between your guess and the correct city
   - Your score for this round (up to 1,000 points)
   - Your cumulative total score

### Proceeding to the Next Round

1. After reviewing your results, click "Next Round" to move to the next headline.
2. Repeat the guessing process for all 5 rounds.
3. After the final round, you'll see your game summary with your total score.

### Playing Again

Click "Play Again" on the final results screen to start a new game.

## Scoring System

Your score is based on how accurately you guessed the location using a logarithmic formula:

- **Perfect guess (0 km away):** 1,000 points
- **Excellent guess (5,000 km away):** ~850 points
- **Good guess (10,000 km away):** ~620 points
- **Fair guess (15,000 km away):** ~200 points
- **Far away (20,000+ km away):** 0 points

**Maximum possible score:** 5,000 points (1,000 points × 5 rounds)

The logarithmic curve keeps scores high through medium distances and collapses steeply only near maximum distance. This rewards accuracy while being forgiving with guesses that are reasonably close.

## Navigating the Map

### Zooming

- **Scroll wheel:** Scroll up to zoom in, scroll down to zoom out.
- **Zoom controls:** Use the `+` and `-` buttons in the top-left corner of the map.
- **Pinch gesture (mobile/tablet):** Pinch to zoom in and out.

The map supports zoom levels from 2 (full world view) to 10 (city-level detail).

### Panning

- **Click and drag:** Click anywhere on the map (except on existing markers) and drag to move around.
- **Touch and drag (mobile/tablet):** Touch and slide your finger to pan the map.

### Default View

The map starts centered at coordinates (20, 0), providing a balanced view of all continents.

## Supported Cities

The game includes these 20 cities:

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

## Theme Toggle

The application supports light and dark themes:

1. Click the theme toggle button in the top-right corner of the header.
2. In light mode, the button shows a 🌙 moon icon.
3. In dark mode, the button shows a ☀️ sun icon.

Your theme preference is automatically saved and will be remembered when you return.

## Tips for Better Guessing

- **Look for location clues:** Headlines often mention place names, languages, or regional context.
- **Use your geography knowledge:** Consider which major cities are news hubs.
- **Zoom in strategically:** Use the map zoom to explore specific regions as you think.
- **Consider global significance:** Some stories have worldwide impact, but many originate from these 20 major cities.
- **Regional patterns:** Think about regional news distribution and which cities typically report certain types of news.

## Troubleshooting

### Game Session Expired

If you see "Game session expired," your game session timed out. Click "Play Again" to start a new game.

### Network Errors

If you encounter network errors:

1. Check your internet connection.
2. Try starting a new game.
3. If the problem persists, refresh the page and try again.

### Can't Place a Guess

Make sure you're clicking on the map area (not on UI elements). The blue pin should appear where you click.
