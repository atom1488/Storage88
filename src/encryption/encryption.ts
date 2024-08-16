import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;
const IV_LENGTH = 16;

export function encryptFilename(filename: string): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(
      "aes-256-cbc",
      Buffer.from(ENCRYPTION_KEY),
      iv
    );
    let encrypted = cipher.update(filename, "utf-8", "hex");
    encrypted += cipher.final("hex");
    return `${iv.toString("hex")}:${encrypted}`;
  } catch (error) {
    console.error("Error encrypting filename:", error);
    throw error;
  }
}

export function decryptFilename(encryptedFilename: string): string {
  try {
    const [ivHex, encrypted] = encryptedFilename.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      Buffer.from(ENCRYPTION_KEY),
      iv
    );
    let decrypted = decipher.update(encrypted, "hex", "utf-8");
    decrypted += decipher.final("utf-8");
    return decrypted;
  } catch (error) {
    console.error("Error decrypting filename:", error);
    throw error;
  }
}

const STATIC_IV = Buffer.from("0123456789ABCDEF0123456789ABCDEF", "hex");

export function encryptBuffer(buffer: Buffer): Buffer {
  try {
    if (buffer.length === 0) {
      throw new Error("Buffer is empty");
    }

    const cipher = crypto.createCipheriv(
      "aes-256-cbc",
      Buffer.from(ENCRYPTION_KEY),
      STATIC_IV
    );
    const encryptedBuffer = Buffer.concat([
      cipher.update(buffer),
      cipher.final(),
    ]);
    return encryptedBuffer;
  } catch (error) {
    console.error("Error encrypting buffer:", error);
    throw error;
  }
}

export function decryptBuffer(encryptedBuffer: Buffer): Buffer {
  try {
    if (encryptedBuffer.length === 0) {
      throw new Error("Encrypted buffer is empty");
    }

    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      Buffer.from(ENCRYPTION_KEY),
      STATIC_IV
    );
    const decryptedBuffer = Buffer.concat([
      decipher.update(encryptedBuffer),
      decipher.final(),
    ]);
    return decryptedBuffer;
  } catch (error) {
    console.error("Error decrypting buffer:", error);
    throw error;
  }
}

export function estimateEncryptedSize(inputBuffer: Buffer): number {
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    ENCRYPTION_KEY,
    STATIC_IV
  );
  const encryptedBuffer = Buffer.concat([
    cipher.update(inputBuffer),
    cipher.final(),
  ]);

  return encryptedBuffer.length;
}
