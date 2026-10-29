EduSync: school timetable and substitution app (classes 6-12, India).
Source of truth: docs/EduSync_Master_Build_Prompt.md and docs/EduSync_Copilot_Make_It_Work_Prompt.md.
Stack: React + TypeScript + Vite + Tailwind + React Router + TanStack Query + Framer Motion (client); Node + Express + TypeScript + Mongoose + Zod (server).
Rules: TGT teachers never teach grades 11-12; teachers are fixed per class and subject for the year; Science appears daily, Computer only 1-2 days a week; substitute order is same subject, then teacher who knows the class, then any free qualified teacher; leave requests never change the timetable; period requests need admin approval; serious complaints are visible only to SUPER_ADMIN; anonymous complaints store no identity.
Design: indigo #442DC5 primary, sidebar #030416, page #F2F6F9, geometric sans + JetBrains Mono for times, 12-hour times, 150-250ms animations that respect prefers-reduced-motion.
No mock data in components. No language toggle. No fairness ledger. No tokens in localStorage. Work one phase at a time and stop for review.
