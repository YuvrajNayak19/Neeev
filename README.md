# EduSync

EduSync is a school operations and timetable platform for Indian schools. This repository now includes a working monorepo-style setup with a Vite + React frontend and an Express + TypeScript backend, along with the timetable-rule and substitution-rule logic that drives the demo workflow.

## Features

- Admin dashboard with live coverage and noticeboard cards
- Teacher and student demo views
- Timetable validation and substitution ranking services
- Express API with JWT-based auth and demo login flow
- Seed script for demo educational data

## Quick start

```bash
npm install
npm run seed
npm run dev
```

The frontend runs on port 5173 and the API runs on port 4000. Use the demo login flow in the app for admin, teacher, or student access.

## Environment variables

Create a `.env` file in the repo root if you want to customize the API. A template is included in `.env.example`.

```bash
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/timely
JWT_SECRET=change-this-strong-secret-at-least-32-characters
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

## Scripts

```bash
npm run dev
npm run build
npm run test
npm run seed
```

## Demo account

- Admin: admin@edusync.school / admin123
- Teacher: teacher@edusync.school / teacher123
- Student: student@edusync.school / student123

This implementation follows the same rule framework as the EduSync build prompt, including qualification checks, teacher-load validation, substitution ranking, and the landing/dashboard experience expected for a live demo.
