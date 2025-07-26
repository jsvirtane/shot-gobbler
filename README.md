# Shot Gobbler

A simple and efficient tool for collecting, analyzing, and visualizing shot & touch data from football/soccer matches.

## Overview

Shot Gobbler helps football analysts, fans, and data enthusiasts gather touch and/or shot information from matches ~~and calculate expected goals metrics~~ _(Coming!)_.

## Features

### Shot map

- Record shot locations & relevant shot data
- Visualization of shot map
- Display shot data on list view
- Filter shot data by all, home & away teams
- Export shot data as JSON
- Import shot data

### Touch map

- Record single players touch locations & relevant touch data
- Visualization of touch map
- Display touch data on list view
- Export touch data as JSON
- Import touch data

### Pass chains map

- Record sequences of actions (passes, carries, shots, crosses) that form attacking chains
- Visualization of pass chains map
- Pitch zone tracking (defensive/midfield/attacking × left/central/right)
- Display pass chain data on list view with action sequences and termination details
- Export pass chain data as JSON
- Import pass chain data

## Live demo

Check out the live demo at [Shot Gobbler](https://jsvirtane.github.io/shot-gobbler/). Best viewed on mobile.

## Run locally

```bash
# Clone the repository
git clone https://github.com/jsvirtane/shot-gobbler

# Navigate to the project directory
cd shot-gobbler

# Install dependencies
npm install

# Run the application locally
npm run dev
```

## Deployment

Application is currently deployed using GitHub Pages. To deploy the application, create a tag in the format `YY-MM-DD`.

```bash
# Create a new tag
git tag -a YY-MM-DD -m "Release YY-MM-DD"
# Push the tag to the remote repository
git push origin YY-MM-DD
```
