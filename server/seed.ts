import "dotenv/config";

import { connectDatabase, disconnectDatabase } from "./config/db";
import { seedDemoData } from "./services/seedDemoData";

async function seed() {
  try {
    await connectDatabase();
    await seedDemoData();
    console.log("Demo school, accounts, classes, and published timetable are ready.");
  } catch (error) {
    console.error("ClassSync seed failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
  }
}

void seed();
