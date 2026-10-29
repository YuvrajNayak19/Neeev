import "dotenv/config";

import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import morgan from "morgan";

import { connectDatabase } from "./config/db";
import { env } from "./config/env";
import { authRoutes } from "./routes/auth.routes";
import { academicRoutes } from "./routes/academic.routes";
import { timetableRoutes } from "./routes/timetable.routes";
import { calendarRoutes } from "./routes/calendar.routes";
import { operationsRoutes } from "./routes/operations.routes";
import { complaintsRoutes } from "./routes/complaints.routes";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL ?? "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(
  rateLimit({
    windowMs: 60_000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "timely-api" });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1", academicRoutes);
app.use("/api/v1/timetable", timetableRoutes);
app.use("/api/v1/calendar", calendarRoutes);
app.use("/api/v1", operationsRoutes);
app.use("/api/v1/complaints", complaintsRoutes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error", error: err.message });
});

async function startServer() {
  try {
    await connectDatabase();
    app.listen(env.port, () => {
      console.log(`Timely API listening on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.warn("MongoDB unavailable; continuing in demo mode.");
    app.listen(env.port, () => {
      console.log(`Timely API listening in demo mode on http://localhost:${env.port}`);
    });
  }
}

startServer().catch((error) => {
  console.error("Failed to boot Timely API", error);
  process.exit(1);
});
