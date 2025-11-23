# ⚡ Quick Start Guide

Get up and running in 5 minutes!

## 1️⃣ Installation

```bash
# Clone the repository (or you're already here)
cd qsyed-webservices

# Install dependencies
npm install
```

## 2️⃣ Setup Redis

**Quick Setup with Docker:**
```bash
docker run -d -p 6379:6379 --name redis redis:alpine
```

**Or install locally:**
- macOS: `brew install redis && brew services start redis`
- Ubuntu: `sudo apt-get install redis-server`

## 3️⃣ Configure Environment

```bash
# The .env file is already configured for development
# No changes needed for local testing!
```

## 4️⃣ Start the Server

```bash
npm run dev
```

You should see:
```
🚀 Server running on port 3000
📁 Upload directory: ./uploads
⚙️  Environment: development
🔧 Worker concurrency: 5
```

## 5️⃣ Test the API

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Upload a File
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@test.pdf"
```

### Process a File
```bash
# First upload returns a fileId, then use it:
curl -X POST http://localhost:3000/api/tools/pdf-compress \
  -H "Content-Type: application/json" \
  -d '{
    "fileIds": "your-file-id-here",
    "settings": {
      "quality": "medium"
    }
  }'
```

### Check Job Status
```bash
# Use the jobId from previous step
curl http://localhost:3000/api/jobs/your-job-id-here
```

## 📚 Next Steps

1. **Explore the API**: See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for all 192 endpoints
2. **Frontend Integration**: Check [FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md)
3. **Deployment**: Read [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup

## 🎯 Available Tools

- **PDF Tools** (35): merge, split, compress, convert, etc.
- **Word Tools** (25): convert, merge, compress, etc.
- **Excel Tools** (30): convert, merge, analyze, etc.
- **Image Tools** (30): resize, compress, filters, etc.
- **Video Tools** (20): compress, convert, trim, etc.
- **Audio Tools** (15): convert, trim, merge, etc.
- **Archive Tools** (12): zip, extract, convert, etc.
- **Utility Tools** (25): QR codes, hashing, encoding, etc.

## 🛠️ Development Commands

```bash
npm run dev      # Start development server with hot-reload
npm run build    # Build for production
npm start        # Run production build
npm test         # Run tests
npm run lint     # Lint code
```

## ❓ Common Issues

**Redis not running?**
```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG
```

**Port 3000 already in use?**
```bash
# Change port in .env
PORT=3001
```

**Permission errors?**
```bash
# Ensure directories exist
mkdir -p uploads temp outputs
chmod 755 uploads temp outputs
```

That's it! You're ready to start building! 🚀
