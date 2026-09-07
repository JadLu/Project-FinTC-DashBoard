# Orbit HR Journey Tracker

A dense React + TypeScript dashboard for the HR journey tracker. Supabase is read directly from the browser; all step/case state changes go through the Fusion webhook proxy.

## Run

```bash
npm install
cp .env.example .env
npm run dev
```

Open the local Vite URL shown in the terminal.

## Required setup

1. Paste the Supabase anon key into `.env` as `VITE_SUPABASE_ANON_KEY`.
2. Replace `TODO-FUSION-BASE-URL` in `vite.config.ts` with the Fusion host, for example `https://your-fusion-host`.
3. Keep `VITE_FUSION_WEBHOOK_PATH=/api/validate`. Vite rewrites this same-origin request to `/hook/hr/validate`, avoiding browser CORS/preflight issues.
4. Ensure the `personnes`, `hr_cases`, `hr_steps`, `hr_events`, and `hr_conflicts` tables are readable by the anon role. For this testing project, disable RLS or add permissive anon policies. This is testing-only and must not be used as a production authorization model.

When Supabase variables are still placeholders, the app runs in demo mode with representative data so the dashboard and navigation can be reviewed. Writes still call `/api/validate` and require the Fusion proxy to be configured.

## Routes

- `/` dashboard KPIs and six monitoring sections
- `/tasks` selected actor's pending and overdue work
- `/case/:caseId` case header, nested step tree, event timeline, and conflicts

The actor selector reads eligible actors from `personnes`. The selected `person_ref` is sent as `actor` to Fusion. The browser never writes directly to `hr_steps` or `hr_cases`.
