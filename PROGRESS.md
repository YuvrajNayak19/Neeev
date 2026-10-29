# Build Progress

## Step 1: Baseline and single dev command

- Done: documented initial architecture decisions, expanded the environment template, and made `npm run dev` start frontend and API processes together.
- Remaining: replace active Supabase and browser-demo paths with the Express API; implement the remaining product phases.
- Assumptions: local development may use MongoDB at `mongodb://127.0.0.1:27017/timely`; production email and holiday integrations are opt-in through environment configuration.

## Current status

- Latest completed step: 2 foundation and initial authentication endpoints; the frontend school/teacher/student registration and login screens are connected to these endpoints.
- Done: mandatory token school scope, active-account middleware, admin-only academic/timetable writes, school-scoped unique account indexes, Zod body/query helpers, tenant scope tests, OTP-backed school/teacher registration, pending student registration, school search/classes/subjects, and setup CRUD write validation.
- Remaining: complete all auth reset/change flows, link and approve records robustly, replace remaining demo/Supabase UI paths, then implement setup UI, versioned timetables, calendar, substitutions, requests, complaints, notifications, seed, and end-to-end tests.
- Assumptions: MongoDB is the only persistence target; OTP uses console output outside production and Resend when configured; students do not need email verification.
- Next step: add domain models for versioned schedules, calendar, requests, complaints, and notifications, then build the corresponding APIs.