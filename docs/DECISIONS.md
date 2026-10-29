# Decisions

- Express and MongoDB are the only application data source; Supabase and browser demo persistence are to be removed from active workflows.
- OTP delivery defaults to console output in development; production delivery requires an explicitly configured email provider.
- School and person identities are scoped by the authenticated user's token; public school discovery exposes only active-school name and location fields.