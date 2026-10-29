export const env = {
  port: Number(process.env.PORT ?? 4000),
  mongoUri: process.env.MONGO_URI ?? process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/timely",
  jwtSecret: process.env.JWT_SECRET ?? "timely-development-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  demoMode: process.env.DEMO_MODE === "true",
};
