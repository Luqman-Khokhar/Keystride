import mongoose from "mongoose";
import { createApp } from "./app";
import { config } from "./config";

async function start() {
  if (!config.mongoUri) {
    console.error("MONGODB_URI is not set. Copy .env.example to .env and fill it in.");
    process.exit(1);
  }
  await mongoose.connect(config.mongoUri);
  console.log("MongoDB connected");

  createApp().listen(config.port, () => console.log(`API listening on :${config.port}`));
}

start().catch((err) => {
  console.error("Failed to start API:", err);
  process.exit(1);
});
