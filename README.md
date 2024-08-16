# Storage88 - Secure Storage System via Discord

Storage88 is a Node.js application that provides secure file storage and retrieval using Discord as a backend. It encrypts files before sending them to Discord and decrypts them upon retrieval.

## Features

- End-to-end file encryption
- Discord-based file storage
- Secure file retrieval and decryption
- Handling of Discord file size limits
- Rate limiting for Discord API compliance
- RESTful API for file upload and download

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- A Discord bot with necessary permissions

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/atom1488/Storage88.git
   cd storage88
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the project root with the following content:
   ```
   DISCORD_BOT_TOKEN=your_discord_bot_token
   CHANNEL_ID=discord_channel_id
   MAX_FILE_SIZE_GB=10
   MONGODB_URI=mongodb://localhost:27017/storage88
   ENCRYPTION_KEY=your_secure_encryption_key
   ```
   
   Note: The `ENCRYPTION_KEY` should be a secure, randomly generated string. It's crucial for the encryption and decryption of your files.

4. Start the application:
   ```
   npm start
   ```

## API Usage

### File Upload

```
POST /upload
Content-Type: multipart/form-data

file: [your file]
```

Response: Unique ID of the uploaded file

### File Download

```
GET /download/{id}
```

Response: The downloaded file

## Project Structure

- `src/api/discordApi.ts`: Discord API configuration
- `src/encryption/encryption.ts`: Encryption and decryption functions
- `src/routes/upload.ts`: Upload route handling
- `src/routes/download.ts`: Download route handling
- `src/types/types.ts`: TypeScript type definitions
- `src/types/uploadRecordModel.ts`: Mongoose model for upload records
- `src/utils/utils.ts`: Utility functions
- `src/server.ts`: Server configuration and launch

## Security

- Files are encrypted using AES-256-CBC before being sent to Discord
- File names are also encrypted
- A static IV is used for buffer encryption
- The encryption key is stored as an environment variable for added security

## Limitations

- Maximum file size is limited by Discord configuration and the `MAX_FILE_SIZE_GB` parameter
- Performance may be affected by Discord API rate limits

## Environment Variables

- `DISCORD_BOT_TOKEN`: Your Discord bot token
- `CHANNEL_ID`: The ID of the Discord channel used for storage
- `MAX_FILE_SIZE_GB`: Maximum allowed file size in GB
- `MONGODB_URI`: MongoDB connection string
- `ENCRYPTION_KEY`: Secret key used for file encryption and decryption

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
