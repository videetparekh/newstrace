# User Guide

Global News Map is an interactive web application that displays the latest news headlines from 20 major cities around the world. This guide explains how to navigate and use the application.

## Overview

When you open the application, you will see an interactive world map powered by OpenStreetMap. The map displays markers for 20 cities across six continents. Hovering over any marker fetches and displays the top 3 breaking headlines for that city in a popup popup that appears on the map.

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

## Hovering Over City Markers

Each city on the map is represented by a marker pin. To view news for a city:

1. Locate the city marker on the map.
2. Hover your mouse over the marker (or tap and hold on touchscreens).
3. The application fetches the top 3 breaking headlines from the backend service.
4. A loading indicator appears briefly while the headlines are retrieved.
5. A popup appears showing the top headlines for that city.

## Reading Headlines

When headlines are loaded, the popup displays the following information for each of the top 3 headlines:

- **City and country:** The name of the selected city and its country, shown at the top of the popup.
- **Headline ranking:** A numbered indicator (1, 2, or 3) showing the headline's position in the top headlines list.
- **Headline title:** The title of the news article.
- **Source:** The name of the news outlet that published the article (e.g., BBC News, Reuters).
- **Read more link:** A clickable link that opens the original article in a new browser tab.

To dismiss the popup, click the close button (the "x" icon) in the top-right corner of the popup, or move your mouse away from the marker.

## Switching Between Cities

You can hover over a different city marker at any time. The popup will update with the new headlines, replacing the previous ones. There is no need to close the current popup first.

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

The application is usable on mobile devices and tablets. On smaller screens:

- The map occupies the full viewport width.
- Tap and hold on a city marker to view its top 3 headlines in a popup.
- Use standard touch gestures (pinch to zoom, drag to pan) to navigate the map.
- The "Read more" link opens the source article in your device's default browser.
- Close the popup by tapping the "x" button or tapping elsewhere on the map.

## Error States

If something goes wrong when fetching a headline, an error message will appear in the sidebar instead of the headline card. Common reasons include:

- **"News unavailable for this location":** The news sources did not return any results for the selected city. This can happen during periods of low news activity for a particular region.
- **"Failed to fetch news":** A network error occurred. Check your internet connection and try again.

In both cases, you can try clicking the same city again or selecting a different city.

## Theme Toggle

The application supports both light and dark themes. To switch between themes:

1. Look for the theme toggle button in the top-right corner of the application header (next to the "How to Use" button).
2. Click the toggle button to switch between light mode (☀️ sun icon) and dark mode (🌙 moon icon).
3. Your theme preference is automatically saved and will be remembered the next time you visit the application.

The theme affects the entire application interface, including the header, sidebar, headline cards, and this help modal.

## Caching

Headlines are cached by the backend for 30 minutes. If you click the same city multiple times within that window, you will see the same headline. After 30 minutes, a fresh headline will be fetched from the news sources.
