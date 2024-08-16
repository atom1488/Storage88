import Hapi from "@hapi/hapi";
import { uploadRoute } from "./routes/upload";
import { downloadRoute } from "./routes/download";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

function checkRequiredEnvVars() {
  const requiredEnvVars = [
    "DISCORD_BOT_TOKEN",
    "CHANNEL_ID",
    "MAX_FILE_SIZE_GB",
    "MONGODB_URI",
    "ENCRYPTION_KEY",
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`${envVar} is not defined.`);
    }
  }
}

const init = async () => {
  checkRequiredEnvVars();

  const server = Hapi.server({
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    host: process.env.HOST || "localhost",
    routes: {
      payload: {
        maxBytes:
          1073741824 *
          (process.env.MAX_FILE_SIZE_GB
            ? parseInt(process.env.MAX_FILE_SIZE_GB)
            : 10),
      },
      cors: true,
    },
  });

  if (process.env.MONGODB_URI) await mongoose.connect(process.env.MONGODB_URI);

  server.route({
    method: "GET",
    path: "/",
    handler: (request, h) => {
      return h
        .response({
          message: "Welcome to the Storage88!",
          routes: [
            {
              method: "POST",
              path: "/upload",
              description: "Upload a file",
            },
            {
              method: "GET",
              path: "/download/{id}",
              description: "Download a file by ID",
            },
          ],
        })
        .code(200);
    },
  });

  server.route(uploadRoute);
  server.route(downloadRoute);

  try {
    await server.start();
    console.log("Storage88 - Secure Storage System via Discord");
    console.log("Server running on %s", server.info.uri);
    console.log("Channel ID:", process.env.CHANNEL_ID);
  } catch (error: unknown) {
    console.error("Error starting the server:", (error as Error).message);
    process.exit(1);
  }
};

process.on("unhandledRejection", (err) => {
  console.log("Unhandled Rejection:", err);
  process.exit(1);
});

init();
