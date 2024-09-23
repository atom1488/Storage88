import Hapi from "@hapi/hapi";
import { FilePayload, FileUpload } from "../types/types";
import {
  encryptFilename,
  estimateEncryptedSize,
  encryptBuffer,
} from "../encryption/encryption";
import { readDatabase, writeDatabase, sendToDiscord } from "../utils/utils";
import { AxiosError } from "axios";
import { v4 as uuidv4 } from "uuid";

export const uploadRoute: Hapi.ServerRoute = {
  method: "POST",
  path: "/upload",
  options: {
    payload: {
      output: "stream",
      parse: true,
      allow: "multipart/form-data",
      multipart: { output: "annotated" },
    },
  },
  handler: async (request, h) => {
    try {
      const { file } = request.payload as FilePayload;

      if (!file) {
        return h.response("No file uploaded. Please upload a file.").code(400);
      }

      const fileUpload = file as FileUpload;

      file.filename = encryptFilename(file.filename);

      const maxChunkSize = 10 * 1024 * 1024 - 1;
      const chunkSize = Math.min(
        maxChunkSize,
        estimateEncryptedSize(file.payload)
      );

      const chunks = chunkBuffer(fileUpload.payload, chunkSize);

      const messageChunks = await Promise.all(
        chunks.map(async (chunk, index) => {
          const encryptedChunk = encryptBuffer(chunk);

          const discordMessageId = await sendToDiscord(
            {
              ...fileUpload,
              payload: encryptedChunk,
            },
            index
          );

          if (discordMessageId === undefined) {
            throw new Error("Discord Message ID is undefined");
          }

          return { discordMessageId, index };
        })
      );

      const id = uuidv4();
      const uploadRecord = {
        id,
        messageChunks,
        filename: fileUpload.filename,
        timestamp: Date.now(),
      };

      const database = await readDatabase();
      database.push(uploadRecord);
      writeDatabase(database);

      return `File uploaded with ID ${id} and message(s) sent to Discord successfully!`;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error("Axios Error: ", (error as AxiosError).message);
      } else {
        console.error("Error: ", error);
      }
      return h.response("Internal Server Error").code(500);
    }
  },
};

function chunkBuffer(buffer: Buffer, chunkSize: number): Buffer[] {
  const chunks = [];
  for (let i = 0; i < buffer.length; i += chunkSize) {
    chunks.push(buffer.slice(i, i + chunkSize));
  }
  return chunks;
}
