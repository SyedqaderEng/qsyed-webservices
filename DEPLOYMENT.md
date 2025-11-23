# 🚀 Deployment Guide

## Prerequisites

- Node.js 18+ installed
- Redis installed and running
- (Optional) FFmpeg for video/audio processing
- (Optional) LibreOffice for office file conversions

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
nano .env
```

### 3. Install Redis (if not installed)

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Docker:**
```bash
docker run -d -p 6379:6379 redis:alpine
```

### 4. Install FFmpeg (for video/audio tools)

**Ubuntu/Debian:**
```bash
sudo apt-get install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

### 5. Build the Project

```bash
npm run build
```

## Running the Application

### Development Mode

```bash
npm run dev
```

The server will start on `http://localhost:3000` with hot-reload enabled.

### Production Mode

```bash
npm run build
npm start
```

## Production Deployment

### Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start dist/server.js --name qsyed-webservices

# Enable startup on boot
pm2 startup
pm2 save

# Monitor logs
pm2 logs qsyed-webservices

# Restart application
pm2 restart qsyed-webservices
```

### Using Docker

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/server.js"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - REDIS_HOST=redis
    depends_on:
      - redis
    volumes:
      - ./uploads:/app/uploads
      - ./outputs:/app/outputs

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

Run with Docker:

```bash
docker-compose up -d
```

### Environment Variables for Production

```bash
NODE_ENV=production
PORT=3000
API_BASE_URL=https://your-domain.com

# Use strong secrets
JWT_SECRET=<generate-strong-random-secret>

# Configure file paths
UPLOAD_DIR=/var/app/uploads
OUTPUT_DIR=/var/app/outputs
TEMP_DIR=/var/app/temp

# Redis configuration
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Allowed origins
ALLOWED_ORIGINS=https://your-frontend.com,https://app.your-domain.com
```

## Nginx Configuration

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## Health Checks

```bash
curl http://localhost:3000/api/health
```

## Monitoring

### PM2 Monitoring

```bash
pm2 monit
```

### Logs

```bash
# View logs
pm2 logs qsyed-webservices

# Clear logs
pm2 flush
```

## Scaling

### Horizontal Scaling

Run multiple instances with PM2:

```bash
pm2 start dist/server.js -i max --name qsyed-webservices
```

This will run one instance per CPU core.

### Worker Scaling

Increase worker concurrency in `.env`:

```bash
WORKER_CONCURRENCY=10
```

## Backup

### Database Backup (if using database)

```bash
# Example for PostgreSQL
pg_dump dbname > backup.sql
```

### File Backup

```bash
# Backup uploads and outputs
tar -czf backup-$(date +%Y%m%d).tar.gz uploads outputs
```

## Security Checklist

- [ ] Change JWT_SECRET to a strong random value
- [ ] Enable HTTPS (use Let's Encrypt)
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up firewall rules
- [ ] Regular security updates
- [ ] Enable Redis password authentication
- [ ] Review file size limits
- [ ] Set up monitoring and alerts

## Troubleshooting

### Redis Connection Issues

```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# Check Redis logs
sudo journalctl -u redis
```

### File Permission Issues

```bash
# Ensure correct permissions
sudo chown -R node:node /var/app
chmod -R 755 /var/app
```

### High Memory Usage

```bash
# Monitor process
top -p $(pgrep -f "node dist/server.js")

# Adjust worker concurrency
# In .env, reduce WORKER_CONCURRENCY
```

## Support

For issues, check:
1. Application logs: `pm2 logs`
2. Redis logs: `sudo journalctl -u redis`
3. Nginx logs: `/var/log/nginx/error.log`
4. System resources: `htop`
