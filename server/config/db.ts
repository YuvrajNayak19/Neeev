import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import { env } from "./env";

let memoryServer: MongoMemoryServer | undefined;

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    await mongoose.connect(env.mongoUri, { dbName: "timely", serverSelectionTimeoutMS: 5_000 });
  } catch (error) {
    if (!env.demoMode) {
      throw new Error(
        "Could not connect to MongoDB. Start MongoDB locally or set MONGO_URI in .env.",
        { cause: error },
      );
    }

    console.warn(
      "MongoDB is unavailable. Starting a temporary in-memory demo database; its data resets when the server stops.",
    );
    try {
      memoryServer = await MongoMemoryServer.create();
      await mongoose.connect(memoryServer.getUri(), { dbName: "timely" });
    } catch (memoryError) {
      await memoryServer?.stop();
      memoryServer = undefined;
      throw new Error(
        "Could not start the in-memory demo database. Check your internet connection for the first MongoDB binary download, or start a local MongoDB service.",
        { cause: memoryError },
      );
    }
  }

  return mongoose.connection;
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = undefined;
  }
}
