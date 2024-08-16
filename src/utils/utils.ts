import FormData from "form-data";
import { AxiosError } from "axios";
import { FileUpload, UploadRecord } from "../types/types";
import Bottleneck from "bottleneck";
import { discordApi } from "../api/discordApi";
import { decryptBuffer } from "../encryption/encryption";
import UploadRecordModel from "../types/uploadRecordModel";
import mongoose from "mongoose";

const CHANNEL_ID = process.env.CHANNEL_ID;

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 1000,
});

export async function sendToDiscord(
  file: FileUpload,
  index: number
): Promise<string | undefined> {
  try {
    const formData = new FormData();
    const filename = `${file.filename}_${index}`;
    formData.append("file", file.payload, { filename });

    await delay(1000);

    const response = limiter.wrap(async () => {
      const axiosResponse = await discordApi.post(
        `/channels/${CHANNEL_ID}/messages`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
        }
      );
      return axiosResponse;
    });

    const data = await response();
    console.log(`Upload done for chunk ${index}!`);

    return data.data.id as string;
  } catch (error: any) {
    if (error.response && error.response.status === 429) {
      const retryAfter = error.response.headers["retry-after"];
      console.log(`Rate limit exceeded. Retrying after ${retryAfter} seconds.`);
      await delay(Number(retryAfter) * 1000);
      return sendToDiscord(file, index);
    } else {
      console.error("Error uploading to Discord:", error.message);
      throw error;
    }
  }
}

export function readDatabase(): Promise<UploadRecord[]> {
  return UploadRecordModel.find().lean().exec();
}

export async function writeDatabase(data: UploadRecord[]): Promise<void> {
  try {
    await mongoose.connection.dropCollection("uploadrecords");
    await UploadRecordModel.insertMany(data);
  } catch (error) {
    console.error("Error writing to database:", error);
    throw error;
  }
}

export async function downloadFromDiscord(
  messageId: string,
  record: UploadRecord
): Promise<Buffer> {
  try {
    const attachmentUrls = await getAttachmentUrls(messageId);

    if (attachmentUrls.length === 0) {
      throw new Error("No attachments found for the specified message ID.");
    }

    const downloadedChunks = await Promise.all(
      attachmentUrls.map(async (attachmentUrl, index) => {
        await delay(1000);

        const response = limiter.wrap(() =>
          discordApi.get(attachmentUrl, {
            responseType: "arraybuffer",
          })
        );

        const { data } = await response();

        const filename = `${record.filename}_${index}`;

        return { filename, buffer: Buffer.from(data) };
      })
    );

    const sortedChunks = downloadedChunks.sort((a, b) => {
      const indexA = parseInt(a.filename.split("_")[1]);
      const indexB = parseInt(b.filename.split("_")[1]);
      return indexA - indexB;
    });

    const concatenatedBuffer = Buffer.concat(
      sortedChunks.map((chunk) => chunk.buffer)
    );

    return decryptBuffer(concatenatedBuffer);
  } catch (error: unknown) {
    console.error("Error in download handler:", (error as Error).message);
    throw error;
  }
}

export function concatBuffers(
  chunks: { filename: string; data: Buffer }[]
): Buffer {
  const uint8Arrays = chunks.map((chunk) => Buffer.from(chunk.data));
  return Buffer.concat(uint8Arrays);
}

async function getAttachmentUrls(messageId: string): Promise<string[]> {
  try {
    const response = limiter.wrap(() =>
      discordApi.get(`/channels/${CHANNEL_ID}/messages/${messageId}`)
    );

    const { data } = await response();

    return data.attachments.map(
      (attachment: { url: string }) => attachment.url
    );
  } catch (error: AxiosError | unknown) {
    if (error instanceof AxiosError) {
      if (error.response && error.response.status === 429) {
        const retryAfter = error.response.headers["retry-after"];

        console.log(
          `Rate limit exceeded. Retrying after ${retryAfter} seconds.`
        );
        await delay(Number(retryAfter) * 1000);

        return getAttachmentUrls(messageId);
      } else {
        console.error("Error getting attachment URLs:", error.message);
        throw error;
      }
    } else {
      console.error(error);
      throw error;
    }
  }
}
