export type FileUpload = {
  filename: string;
  headers: {
    "content-disposition": string;
    "content-type": string;
  };
  payload: Buffer;
};

export type FilePayload = {
  file: {
    filename: string;
    headers: {
      "content-disposition": string;
      "content-type": string;
    };
    payload: Buffer;
  };
};

export type Attachment = {
  id: string;
  filename: string;
  size: number;
  url: string;
  proxy_url: string;
  content_scan_version: number;
};

export type MessageChunk = {
  discordMessageId: string;
  index: number;
};

export type UploadRecord = {
  id: string;
  messageChunks: MessageChunk[];
  filename: string;
  timestamp: number;
};
