# Finish accounts, cloud sync and teacher categories

The database is already set up (profile, teachers with a PRT/TGT/PGT category, saved plans per date), all locked to the signed-in owner. The app code still runs entirely on local state, so nothing is saved to an account yet. This plan finishes that.

## 1. Sign up / log in

- New public page at `/auth` with two tabs: Sign up (email, password, full name, school name) and Log in (email, password).
- Google sign-in button alongside email/password, enabled the same turn so the first attempt works.
- Signing up logs the user straight in (no email confirmation step) and stores name + school name on their profile.
- Password reset page at `/reset-password` plus a "Forgot password?" link.

## 2. Session-aware navigation

- Homepage and dashboard header show "Log in" when signed out, and the user's name with a Sign out action when signed in.
- Signing out clears cached data and returns to `/auth`.
- The dashboard stays usable without an account (local-only, as today); a small banner explains that signing in saves the timetable.

## 3. Teacher categories (PRT / TGT / PGT)

- Each teacher row gets a three-way toggle for PRT, TGT and PGT — visible in both the mobile cards and the desktop table.
- Category is included in Excel/CSV import when a "Category" / "Level" column exists, defaulting to TGT otherwise, and appears in the exported substitution CSV.

## 4. Cloud saving

- When signed in: the teacher schedule loads from the account on open and saves automatically on add / edit / delete / import, so the daily routine reduces to ticking which teachers miss which periods.
- Saved Days move to the account too: saving a day writes the dated plan, and the list, open, export and delete actions read from the account.
- When signed out: everything keeps working from browser storage exactly as now. On first sign-in, any locally stored teachers are offered for upload.

## 5. Verification

Sign up, import a timetable, reload, and confirm the schedule and saved days come back; repeat signed out to confirm local mode still works.

## Technical notes

- Auth via the browser client; profile row created on signup with name + school.
- Data access through authenticated server functions (`requireSupabaseAuth`) in a new `src/lib/cloud.functions.ts`, read via TanStack Query so cache invalidation is consistent; `src/start.ts` already registers the bearer middleware.
- `Teacher` type in `src/lib/substitution.ts` gains `category: "PRT" | "TGT" | "PGT"`; demo data and `timetable-import.ts` updated accordingly.
- `/app` remains public (works without login); no route gate needed, so shared links keep working.
- `src/lib/history.ts` stays as the signed-out fallback behind a single storage layer that picks cloud or local based on session.
