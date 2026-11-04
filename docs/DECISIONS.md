# Decisions

- Express and MongoDB are the only application data source; Supabase and browser demo persistence are to be removed from active workflows.
- OTP delivery defaults to console output in development; production delivery requires an explicitly configured email provider.
- School and person identities are scoped by the authenticated user's token; public school discovery exposes only active-school name and location fields.
## ClassSync redesign

- Product name is ClassSync. Internal identifiers that would break existing data keep old names: the MongoDB database name `timely` and the `eduSyncRules.ts` module.
- The demo school (`68f000000000000000000001`) is wiped and rebuilt on each API start in demo mode so the showcase always starts from the same realistic day. Other schools are never touched.
- Demo mode outside production returns the registration OTP in the API response and shows it on screen; production still requires a configured email provider.
- Staff sign in with email or phone without choosing admin/teacher; students sign in with school + admission number.
- Re-running the substitution draft keeps cover that is already confirmed or chosen manually.
- Supabase/Lovable demo paths were already removed from active flows; nothing further was needed.
