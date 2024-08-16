import Hapi from "@hapi/hapi";
import { decryptFilename } from "../encryption/encryption";
import { downloadFromDiscord, concatBuffers } from "../utils/utils";
import UploadRecordModel from "../types/uploadRecordModel";

export const downloadRoute: Hapi.ServerRoute = {
  method: "GET",
  path: "/download/{id?}",
  handler: async (request, h) => {
    try {
      const { id } = request.params;

      if (!id) {
        return h.response("Please provide an ID.").code(400);
      }

      const record = await UploadRecordModel.findOne({ id });

      if (!record) {
        return h.response("File not found.").code(404);
      }

      const chunks = await Promise.all(
        record.messageChunks.map(async ({ discordMessageId }) => {
          try {
            const chunkBuffer = await downloadFromDiscord(
              discordMessageId,
              record
            );
            return {
              filename: record.filename,
              data: chunkBuffer,
            };
          } catch (error: unknown) {
            console.error("Error downloading chunk:", (error as Error).message);
            throw error;
          }
        })
      );

      const assembledBuffer = concatBuffers(chunks);

      return h
        .response(assembledBuffer)
        .header(
          "Content-Disposition",
          `attachment; filename=${decryptFilename(record.filename)}`
        );
    } catch (error: unknown) {
      console.error("Error in download handler:", (error as Error).message);
      return h.response("Internal Server Error").code(500);
    }
  },
};
