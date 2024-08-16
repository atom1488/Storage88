import axios from "axios";
import FormData from "form-data";
import Bottleneck from "bottleneck";
import { delay } from "../utils/utils";

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_API_BASE_URL = "https://discord.com/api/v10";
const CHANNEL_ID = process.env.CHANNEL_ID;

const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 1000,
});

export const discordApi = axios.create({
  baseURL: DISCORD_API_BASE_URL,
  headers: {
    Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
  },
});

interface FileUpload {
  filename: string;
  payload: Buffer;
}

export async function sendToDiscord(
  file: FileUpload,
  index: number
): Promise<string> {
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

    const { data } = await response();

    console.log(`Upload done for chunk ${index}!`);

    return data.id as string;
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
