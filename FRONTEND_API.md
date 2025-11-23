# Frontend API Reference

**Backend Base URL:** `http://localhost:3000`

## 4 Endpoints You Need

### 1️⃣ Upload PDF File
```http
POST /api/upload
Content-Type: multipart/form-data

Body: file=<PDF file>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fileId": "72360b0c-6455-41d8-b475-51bafa80ae19",
    "originalName": "document.pdf",
    "mimeType": "application/pdf",
    "size": 1024000,
    "uploadedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 2️⃣ Start Conversion Job
```http
POST /api/process
Content-Type: application/json

Body:
{
  "fileId": "72360b0c-6455-41d8-b475-51bafa80ae19",
  "tool": "pdf-to-word",
  "options": {
    "outputFormat": "docx",
    "ocrEnabled": false,
    "preserveLayout": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "requestId": "abc-123-def-456",
    "status": "queued",
    "tool": "pdf_to_word",
    "fileId": "72360b0c-6455-41d8-b475-51bafa80ae19"
  },
  "message": "Processing started for pdf-to-word"
}
```

---

### 3️⃣ Poll Job Status (Every 2 seconds)
```http
GET /api/status/:requestId
```

**Response (Processing):**
```json
{
  "success": true,
  "data": {
    "requestId": "abc-123-def-456",
    "status": "converting",
    "progress": 45,
    "currentStep": "Converting page 3 of 10"
  }
}
```

**Response (Completed):**
```json
{
  "success": true,
  "data": {
    "requestId": "abc-123-def-456",
    "status": "done",
    "progress": 100,
    "currentStep": "Finalizing...",
    "fileToken": "output-abc-123.docx"
  }
}
```

**Response (Failed):**
```json
{
  "success": true,
  "data": {
    "requestId": "abc-123-def-456",
    "status": "failed",
    "progress": 0,
    "currentStep": "",
    "errorMessage": "Invalid PDF file"
  }
}
```

---

### 4️⃣ Download Result
```http
GET /api/download/:fileToken
```

**Response:** Binary file (DOCX)
```
Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
Content-Disposition: attachment; filename="output.docx"
```

---

## Processing States (Use Exact Names)

Your status polling will receive these states in order:

```
queued → processing → ocr → converting → finalizing → done
```

Or:
```
queued → processing → failed
```

**State Details:**
- `queued` - Job is waiting in queue
- `processing` - Job has started
- `ocr` - Performing OCR (only if `ocrEnabled: true`)
- `converting` - Converting PDF to Word
- `finalizing` - Saving output file
- `done` - Complete! `fileToken` is available
- `failed` - Error occurred, check `errorMessage`

---

## Complete Flow Example (JavaScript)

```javascript
// 1. Upload file
const formData = new FormData();
formData.append('file', pdfFile);

const uploadRes = await fetch('http://localhost:3000/api/upload', {
  method: 'POST',
  body: formData
});
const { data: { fileId } } = await uploadRes.json();

// 2. Start processing
const processRes = await fetch('http://localhost:3000/api/process', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fileId,
    tool: 'pdf-to-word',
    options: {
      outputFormat: 'docx',
      ocrEnabled: false,
      preserveLayout: true
    }
  })
});
const { data: { requestId } } = await processRes.json();

// 3. Poll status every 2 seconds
const pollStatus = setInterval(async () => {
  const statusRes = await fetch(`http://localhost:3000/api/status/${requestId}`);
  const { data } = await statusRes.json();

  console.log(`Status: ${data.status} - ${data.progress}%`);

  if (data.status === 'done') {
    clearInterval(pollStatus);

    // 4. Download result
    window.location.href = `http://localhost:3000/api/download/${data.fileToken}`;
  } else if (data.status === 'failed') {
    clearInterval(pollStatus);
    console.error('Error:', data.errorMessage);
  }
}, 2000);
```

---

## Available Tools

| Tool Name | Description | Options |
|-----------|-------------|---------|
| `pdf-to-word` | PDF to Word (DOCX) | `ocrEnabled`, `preserveLayout`, `ocrLanguage` |
| `pdf-split` | Split PDF pages | Various split options |
| More tools coming... | | |

---

## Error Handling

All endpoints return this format on error:
```json
{
  "success": false,
  "error": "Error message here"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad request (missing parameters)
- `404` - Resource not found (fileId or requestId invalid)
- `500` - Server error

---

## CORS

The following origins are allowed in development:
- `http://localhost:3000`
- `http://localhost:3001`
- `http://localhost:3002`
- `http://localhost:5173`
- `http://localhost:5174`

All endpoints support `OPTIONS` preflight requests.

---

## Ready to Test! 🚀

1. Start Redis: `redis-server` or `docker run -d -p 6379:6379 redis:alpine`
2. Start backend: `npm run dev`
3. Your frontend can now call these 4 endpoints!
