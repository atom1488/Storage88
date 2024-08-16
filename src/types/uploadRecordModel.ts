import { Document, Schema, model } from "mongoose";

export interface UploadRecord {
  id: string;
  messageChunks: { discordMessageId: string; index: number }[];
  filename: string;
  timestamp: number;
}

const UploadRecordSchema = new Schema<UploadRecord & Document>({
  id: { type: String, required: true },
  messageChunks: {
    type: [{ discordMessageId: String, index: Number }],
    required: true,
  },
  filename: { type: String, required: true },
  timestamp: { type: Number, required: true },
});

const UploadRecordModel = model("UploadRecord", UploadRecordSchema);

export default UploadRecordModel;
