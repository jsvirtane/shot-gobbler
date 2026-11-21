# Shot Gobbler

A simple and efficient tool for collecting, analyzing, and visualizing shot & touch data from football/soccer matches.

## Overview

Shot Gobbler helps football analysts, fans, and data enthusiasts gather touch and/or shot information from matches ~~and calculate expected goals metrics~~ _(Coming!)_.

## Features

### Recording

- Pitch-first: tap where it happened and pick from a ring of options around the tap (no forms)
- Focus mode: a full-screen pitch with a floating bar for the match clock, undo, tracker switch and half pitch
- Tap a marker to edit it in the same ring (move, minute, delete); press and hold to drag it
- Matches with team names and a running clock; events are stamped with minute and period
- Football or futsal per match: the futsal pitch (40 x 20 m) has its own markings, 6 m penalty spot, goal size for xG and 2 x 20 min clock, plus the 10 m kick, kick-ins (for throw-ins) and no offside

### Shot map

- Result ring (goal, saved, blocked, miss) with details: header, set piece, penalty, shirt number
- Both teams on the full pitch, or one half with a remembered team toggle
- xG per shot, shown by marker size, with totals
- List and stats views, with filters on every tab (team, action category, chains that ended in a goal)

### Touch map

- Single player's touches: action ring (attack, defend, duel, more) then an outcome ring
- List and stats, with pitch zones

### Pass chains map

- Tap each place the ball goes and pick the step (pass, carry, cross, shot)
- End ring for how the chain ended (shot result, ball lost, stoppage), or cancel it
- Pitch zone tracking (defensive/midfield/attacking × left/central/right)
- List and stats with action sequences and termination details

### Data

- Share the map as an image (with its legend)
- Export and import data as JSON

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
