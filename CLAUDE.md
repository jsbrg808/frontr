# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the Vite dev server (also via `frontr.bat` on Windows)
- `npm run build` — type-check (`tsc -b`) then production build
- `npm run lint` — run Oxlint (config in `.oxlintrc.json`)
- `npm run preview` — preview the production build locally

There is no test runner configured in this project.

## Architecture

This is a React 19 + TypeScript + Vite single-page app that is a thin frontend over a separate Java backend ("ordinal.third" / "back"). The backend base URL comes from `VITE_BACK_BASE_URL` in `.env` (defaults to `http://localhost:8090`). There is no server-side code in this repo.

### Request flow

- `src/api/client.ts` is the only place HTTP calls are made. `apiGet`/`apiPostForm`/`apiPostQuery`/`apiPostJson` all build a URL via `apiUrl()` against `BACK_BASE_URL` and parse JSON, throwing an `Error` with the backend's `message` field on non-OK responses. Pages call these directly in `useEffect`/event handlers — there is no query-caching layer or global state store.
- `toBackApiPath()` exists because the backend returns paths like `/pogo/5pc/download` (frontend proxy-relative) inside response bodies (e.g. `downloadPath`/`savePath` in Excel-preview cells), which must be rewritten to the backend's real `/api/...` path before being requested directly.
- `src/api/types.ts` mirrors the backend's REST response shapes (VO = "value object", matching Java naming) one-to-one. When the backend response shape changes, update this file first — all pages type against it.

### Routing & pages

- `src/App.tsx` defines all routes under a shared `Layout` (`src/components/Layout.tsx`, sidebar nav + `<Outlet>`). `src/main.tsx` wraps the app in `BrowserRouter`.
- Each page in `src/pages/` is a self-contained fetch-on-mount component (`useEffect` + `apiGet`, local `useState` for data/error/loading) — there's no shared data-fetching hook, so new pages typically follow the same pattern as `CoinListPage.tsx` or `Pogo5dePage.tsx`.
- `PogoExcelPreviewPage` is reused for two routes (`/pogo/5pc` and `/pogo/5y`) via a `type` prop, rendering an editable Excel-like grid (`contentEditable` cells) that saves individual cell edits back to the backend on blur via `toBackApiPath(cell.savePath)`.
- `Pogo5TablePage` handles the dynamic `/pogo/:tbl` route (tables `5f`/`5s`/`5t`) and implements inline CRUD (append/update/delete/insert) against `/api/pogo/:tbl/*` endpoints, plus `srchNm` search synced to the URL query string and scroll-to-row-by-hash on reload.
- `PokedexPage` is a one-off control panel: it POSTs a sequence of named "steps" (`/api/pogo/dex/update?stepX=true`) and streams a textual log, rather than fetching/displaying a dataset.

### Styling

Plain CSS files per feature area in `src/styles/` (`global`, `layout`, `list`, `toolbar`, `pogoExcelPreview`, `pokedex`), imported directly into the component(s) that use them — no CSS modules or CSS-in-JS.

### Language

UI text, comments, and some identifiers are in Korean (this is a Korean-language internal tool — coin collection tracking + Pokémon GO "pogo" data tools). Keep user-facing strings and comments in Korean to match the existing codebase unless told otherwise.
