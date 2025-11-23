# Qsyed Web Services - File Processing Platform

A comprehensive file processing platform with 192 professional-grade tools across 8 categories.

## 🚀 Features

- **192 Tools** across 8 categories
- **Async Processing** with job queue system
- **RESTful API** with comprehensive documentation
- **File Upload/Download** with secure handling
- **Rate Limiting** and security features
- **TypeScript** for type safety
- **Scalable Architecture** using worker queues

## 📦 Categories

1. **PDF Tools** (35 tools) - Merge, split, compress, watermark, and more
2. **Word Tools** (25 tools) - Convert, merge, compress, and edit DOCX files
3. **Excel/CSV Tools** (30 tools) - Data manipulation, conversion, and analysis
4. **Image Tools** (30 tools) - Resize, compress, convert, filters, and effects
5. **Video Tools** (20 tools) - Compress, convert, trim, merge, and edit
6. **Audio Tools** (15 tools) - Convert, trim, merge, and effects
7. **Archive Tools** (12 tools) - Create, extract, and convert archives
8. **Utility Tools** (25 tools) - QR codes, hashing, encoding, and more

## 🛠️ Setup

### Prerequisites

- Node.js 18+
- Redis (for job queue)
- FFmpeg (for video/audio processing)
- LibreOffice (optional, for office conversions)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Run in development mode
npm run dev

# Build for production
npm run build

# Run in production
npm start
```

## 📚 API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

### Quick Example

```bash
# Upload a file
curl -X POST http://localhost:3000/api/upload \
  -F "file=@document.pdf" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response: { "fileId": "abc123" }

# Process with a tool
curl -X POST http://localhost:3000/api/tools/pdf-merge \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "fileIds": ["abc123", "def456"],
    "settings": {}
  }'

# Response: { "jobId": "job123" }

# Check job status
curl -X GET http://localhost:3000/api/jobs/job123 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response: { "status": "completed", "downloadUrl": "..." }
```

## 🏗️ Architecture

```
src/
├── server.ts              # Main server file
├── config/                # Configuration
├── middleware/            # Express middleware
├── routes/                # API routes
├── controllers/           # Request handlers
├── services/              # Business logic
│   ├── pdf/              # PDF processing
│   ├── word/             # Word processing
│   ├── excel/            # Excel processing
│   ├── image/            # Image processing
│   ├── video/            # Video processing
│   ├── audio/            # Audio processing
│   ├── archive/          # Archive processing
│   └── utility/          # Utility tools
├── workers/               # Background job workers
├── utils/                 # Utility functions
└── types/                 # TypeScript types
```

## 🔒 Security

- File type validation
- Size limits
- Rate limiting
- CORS protection
- Helmet.js security headers
- Secure file storage with signed URLs
- Auto-cleanup of temporary files

## 📈 Performance

- Async processing with BullMQ
- Worker pools for parallel processing
- File streaming for large files
- Redis caching
- Auto-cleanup after 24 hours

## 🧪 Testing

```bash
npm test
```

## 📄 License

MIT

## 👨‍💻 Author

Syed Qader - [SyedqaderEng](https://github.com/SyedqaderEng)
