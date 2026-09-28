// Local / long-running server entry (pnpm dev, pnpm start).
import { createApp } from "./createApp";
import { config } from "./config";
import { connectDb } from "./db";

connectDb()
  .then(() => {
    console.log("MongoDB connected");
    createApp().listen(config.port, () => console.log(`API listening on :${config.port}`));
  })
  .catch((err) => {
    console.error("Failed to start API:", err);
    process.exit(1);
  });
