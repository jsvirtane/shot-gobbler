# Shot Gobbler - AI Coding Agent Instructions

## Project Overview

Shot Gobbler is a React + TypeScript football analytics tool for collecting and visualizing shot, touch, and pass chain data. Built with Vite, Tailwind CSS v4, and React 19. Deployed to GitHub Pages at `/shot-gobbler/` base path.

## Architecture

### View-Based Structure

Three main analysis modes in `src/views/`: `ShotsView`, `TouchesView`, `PassChainsView`. Each manages its own state and localStorage persistence with keys:

- `shot-gobbler-data` (shots)
- `shot-gobbler-touches-data` (touches)
- `shot-gobbler-pass-chains` (pass chains)

State lives in views (not global state management). Each view follows this pattern:

1. Initialize from localStorage in `useState` initializer
2. `useEffect` to sync state changes back to localStorage
3. Handle CRUD operations with local functions
4. Pass down data/handlers to presentational components

### Type System (`src/types/`)

Core domain types with discriminated unions:

- `Shot`: Result (`Goal | Miss | Saved | Blocked`), team (`home | away`)
- `Action`: Category-based (`attacking | defensive | duel`) with type-specific outcomes
- `PassChain`: Sequential actions with `ChainAction[]` and termination reasons
- All entities use `Coordinates` (`{x: number, y: number}` as 0-100% of pitch)

### Component Patterns

**PitchContainer**: The foundation for all map visualizations. Converts absolute pixel clicks to relative coordinates (0-100%). All child markers position using absolute positioning with `left/top` percentages.

**Map Components** (`ShotMap`, `TouchMap`, `PassChainMap`): Render markers on `PitchContainer`. Pass click handler upward to parent view.

**Form Components**: Modal-based data entry. All use button-based selection (no dropdowns) for mobile-first UX. Forms reset on modal open using `useEffect` dependencies.

**Marker Components**: Absolutely positioned via inline styles from coordinate data. Use constants from `src/constants/` for color mapping (e.g., `ShotMarkerColors.home.goal`).

## Development Workflows

### Running & Building

```bash
npm run dev          # Vite dev server
npm run build        # TypeScript check + Vite build
npm run type-check   # TypeScript only
npm test             # Vitest in watch mode
npm run lint         # ESLint with Prettier
```

### Testing Philosophy

Tests exist for core views and complex components (`ShotForm.test.tsx`, `PassChainsView.test.tsx`). Use Vitest + Testing Library with jsdom environment. Mock `localStorage` in tests - see `PassChainsView.test.tsx` for pattern.

**Regression Testing**: When fixing a bug, ALWAYS write a test that reproduces the bug first, then verify the fix resolves it. Add tests to the appropriate test file (e.g., `App.test.tsx` for App-level bugs, component test files for component bugs). This ensures the bug won't reoccur in future changes.

### Deployment

GitHub Actions deploys on tags matching `YY-MM-DD` format. `vite.config.ts` sets `base: "/shot-gobbler/"` for GitHub Pages.

## Project-Specific Conventions

### Color System

Custom Tailwind colors in `src/constants/`:

- `attacking-500`, `defensive-500`, `duel-500` for touch markers
- Team colors: home (yellow/red), away (blue/purple)
- Outcome borders: white (success), black (unsuccessful)

Access via constants files, not raw Tailwind classes: `ActionMarkerColors.category.attacking`

### Coordinate System

All pitch interactions use **percentage-based coordinates** (0-100). `PitchContainer` handles conversion from pixel clicks. Markers receive `{x, y}` and apply as:

```tsx
style={{ left: `${x}%`, top: `${y}%` }}
```

### Pitch Zones

9-zone system (3×3 grid): `{horizontal: 'left' | 'central' | 'right', vertical: 'defensive' | 'midfield' | 'attacking'}`. See `utils/pitchZones.ts`. Used in pass chain analysis.

### Share Functionality

`ShareButton` uses `html2canvas-pro` to capture `#share-pitch` element. Tries Web Share API (mobile), falls back to download. Hidden on docs page only.

### Button Styles

Centralized in `utils/buttonStyles.ts` - `getSubmitButtonStyle()`, `getCancelButtonStyle()`, etc. All forms use these helpers.

### Import/Export Pattern

Each view implements JSON import/export via `ShotList`/`TouchList`/`PassChainsListView`. On import, regenerate IDs with `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`.

## Key Files to Understand

- `src/App.tsx`: Tab navigation and conditional rendering of views
- `src/components/PitchContainer/PitchContainer.tsx`: Coordinate conversion logic
- `src/views/ShotsView.tsx`: Reference implementation for view pattern
- `src/types/`: Domain model definitions with outcome discriminators
- `src/utils/pitchZones.ts`: Zone calculation algorithm

## Common Tasks

**Add new shot result type**: Update `ShotResult` in `types/Shot.ts`, add button in `ShotForm.tsx`, update `ShotMarkerColors` constant.

**Add new touch action**: Update `ActionType` union in `types/Action.ts`, extend outcome types, add form button in `ActionForm.tsx`.

**Modify pitch zones**: Edit thresholds in `getZoneFromCoordinates()` in `utils/pitchZones.ts`.

**Add new view tab**: Create view component, add to `App.tsx` navigation, add localStorage key, follow existing view patterns.

## Watch Out For

- **Form resets**: Must depend on `isOpen` AND `initialCoords` in `useEffect` to reset properly on each pitch click
- **localStorage sync**: Write operations in `useEffect` with state dependency, read in `useState` initializer with try-catch
- **Percentage coordinates**: Always use `%` for positioning, never pixels
- **Mobile-first**: All interactive elements sized for touch (min 44px tap targets)
- **ID generation**: Use timestamp + random string for uniqueness across imports
