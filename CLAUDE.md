# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ASPRDT (ASPR Digital Tools) is an MCI (Mass Casualty Incident) patient tracking application. The active codebase lives entirely in `mci-flows/`. The root `.vs/` directory is a Visual Studio IDE artifact and can be ignored.

## Commands

All commands must be run from the `mci-flows/` directory.

```bash
cd mci-flows

# Install dependencies
npm install

# Run the development server (Express + Vite on port 62031)
npm run dev

# Type-check without emitting (acts as lint)
npm run lint

# Build for production
npm run build

# Reset the database to seed data via API (while server is running)
curl -X POST http://localhost:62031/api/reset
```

There is no test suite configured.

## Architecture

The app is a full-stack TypeScript SPA with a unified Express + Vite server.

**Entry point:** `server.ts` starts an Express server on port `62031`. In development, Vite middleware is injected for HMR/SPA serving. In production, the built `dist/` folder is served statically.

**Backend (`server.ts`):**
- Uses `better-sqlite3` for a local SQLite database (`patients.db`)
- Seeds / resets patient data on every server restart
- REST API endpoints: `GET /api/patients`, `GET /api/patients/:id`, `PATCH /api/patients/:id`, `POST /api/reset`
- JSON columns in SQLite: `vitals`, `alerts`, `transferNote`, `dischargePlan`, `documentation` are stored as JSON strings and parsed on read
- Boolean columns (`tmStatus`, `meds`, `labs`, etc.) are stored as integers (0/1) in SQLite

**Frontend (`src/`):**
- `src/types.ts` — All domain types: `Patient`, `TriageCode` enum, `PatientStatus` enum, `Vitals`, `TransferNote`, `DischargePlan`, `DocumentationEntry`
- `src/store.ts` — Thin API client (fetch wrappers): `getPatients`, `getPatientById`, `updatePatient`, `resetPatients`
- `src/App.tsx` — React Router setup; resets patients on mount; two routes: `/` (TrackingBoard) and `/patient/:id` (PatientChart)
- `src/components/Layout.tsx` — Top nav shell with site identifier, nav links, and `<Outlet />`
- `src/components/TrackingBoard.tsx` — Main patient list table with filtering (by site, location, patient type), search, and a context-menu with transfer/triage actions. Polls `/api/patients` every 5 seconds.
- `src/components/PatientChart.tsx` — Detailed patient view with tabs including discharge plan and discharge process forms
- `src/components/TransferNoteModal.tsx` — Modal for initiating, updating, or editing patient transfers

**`shared-state.js`:** A legacy in-memory state manager using `sessionStorage`. This predates the SQLite/Express backend and is no longer used by the React app; it exists as a reference implementation.

**Patient status flow:** `Admitted` → `Transport Ordered` → `In-Transit` → `Transfer Complete` / `D/C` / `D/C-C`

**Triage levels:** `I` (Immediate), `D` (Delayed), `M` (Minor), `Ex` (Expectant), `X` (Deceased)

**Environment:** Set `GEMINI_API_KEY` in `.env.local` for Gemini AI integration (currently commented out in `vite.config.ts`). HMR can be disabled with `DISABLE_HMR=true`.
