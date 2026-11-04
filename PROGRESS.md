# Build Progress

## ClassSync redesign (branch `classsync-redesign`)

- Done: rebrand to ClassSync (titles, meta, nav, footer, OTP email text, README, favicon) with a new logo mark and wordmark.
- Done: warm light design system (cream, peach, blush, plum accent; Fraunces + Plus Jakarta Sans) as CSS variables mapped into Tailwind; shadcn primitives restyled; dark-theme overrides and dead CSS removed.
- Done: landing page with illustrated hero, typewriter sub line, About, Features (alternating rows + bento previews), How it works, Roles, FAQ, CTA, footer, Privacy and Terms pages.
- Done: simplified two-panel login (email or phone, or Try as Principal/Teacher/Student) and registration (school, teacher, student) with inline validation and a demo OTP.
- Done: app shell and every app screen rebuilt on live data: admin dashboard, substitutions, timetable, requests, people, student concerns, teacher day/routine/requests, student today/weekly/concerns, profile.
- Done: realistic demo seed (10 sections, 24 teachers, 480 clash-free periods, students, absences, requests, notices, concerns).
- Done: removed dead components, unused UI wrappers and 30 unused dependencies; React's production runtime is now used in builds; app routes are lazy-loaded.
- Verified: typecheck, lint, 18 tests, client build; Playwright screenshots at 360/390/768/1440 with no horizontal overflow; end-to-end assign, approve request, approve sign-up, post notice and mark absent.

## Open items

- Timetable generation/editing UI is not exposed; the timetable page shows the published version.
- Replace placeholder contact email and social links in `src/components/public/site-footer.tsx` before launch.
- Privacy and terms pages are placeholders and need a reviewed policy.
