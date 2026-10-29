# Build Progress

## Presentation setup

- Done: removed unused TanStack Start, Supabase, and Lovable scaffolding without removing the design-system page used by the live React Router app.
- Done: kept the Vite/Tailwind 3 CSS path singular, resolved dependencies with plain `npm install`, and disabled backend watch restarts during the presentation run.
- Done: aligned `MONGO_URI`, added an idempotent demo seed with administrator, teacher, and student accounts, and seeded a published Class 10-A timetable.
- Done: enabled a temporary in-memory MongoDB fallback for demo mode and automatic seed initialization when the API starts.
- Verified: client and server builds, 18 tests, all three API logins, public school search, and the 48-period public timetable.
- Note: the first in-memory startup downloads a MongoDB binary; its data resets when the server stops. Set `DEMO_MODE=false` to require a persistent MongoDB instance.

## Remaining presentation work

- Walk the complete administrator, teacher, and student paths in a browser and fix visible runtime issues.
- Standardize the product name to ClassSync, then polish responsive layout and seed data for the presentation.
- Run formatting/linting, complete verification, and update the presenter-focused README.