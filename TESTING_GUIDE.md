# Testing Guide - Frontend Integration

## How to Test the Backend Right Now

### Prerequisites

1. **Install Dependencies**
```bash
cd /home/user/qsyed-webservices
npm install
```

2. **Start Redis** (required for job queue)
```bash
# Option 1: If Redis is installed
redis-server

# Option 2: Using Docker
docker run -d -p 6379:6379 redis:alpine
```

3. **Start Backend Server**
```bash
npm run dev
```

You should see:
```
[Module Loader] Loading processing modules...
[Module Loader] Loaded 2 modules across 1 categories
  - pdf.split (pdf): 4 actions
  - pdf.toWord (pdf): 1 actions
🚀 Server running on port 3000
```

---

## Testing Flow - What Frontend Should Expect

### **STEP 1: Upload File**

**Frontend Action:**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('http://localhost:3000/api/upload/single', {
  method: 'POST',
  body: formData
});

const data = await response.json();
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "fileId": "abc123-def456-ghi789",
    "originalName": "document.pdf",
    "mimeType": "application/pdf",
    "size": 1024000,
    "path": "/path/to/uploads/abc123-def456.pdf",
    "uploadedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "File uploaded successfully"
}
```

**What Frontend Should Do:**
```javascript
const fileId = data.data.fileId;
// Save this fileId - you'll need it for processing
```

---

### **STEP 2: Get File Metadata (Optional)**

**Frontend Action:**
```javascript
// For PDF files, you might want to get page count
const response = await fetch(`http://localhost:3000/api/preview/pdf/${fileId}/info`);
const metadata = await response.json();
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "pageCount": 10,
    "title": "Sample Document",
    "author": "John Doe",
    "pages": [
      {
        "pageNumber": 1,
        "width": 612,
        "height": 792,
        "rotation": 0
      }
    ]
  }
}
```

**What Frontend Should Do:**
```javascript
// Show user: "PDF has X pages"
console.log(`PDF has ${metadata.data.pageCount} pages`);
```

---

### **STEP 3: Process File (Convert PDF to Word)**

**Frontend Action:**
```javascript
const response = await fetch('http://localhost:3000/api/tools/pdf-split/process', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fileIds: [fileId],
    settings: {
      mode: 'individual'
    }
  })
});

const result = await response.json();
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "job-abc123-def456",
    "status": "pending",
    "toolId": "pdf-split",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**What Frontend Should Do:**
```javascript
const jobId = result.data.jobId;
// Start polling for status
pollJobStatus(jobId);
```

---

### **STEP 4: Poll Job Status**

**Frontend Action:**
```javascript
async function pollJobStatus(jobId) {
  const interval = setInterval(async () => {
    const response = await fetch(`http://localhost:3000/api/jobs/${jobId}`);
    const status = await response.json();

    console.log('Progress:', status.data.progress + '%');
    console.log('Status:', status.data.status);

    if (status.data.status === 'completed') {
      clearInterval(interval);
      downloadResult(jobId);
    }

    if (status.data.status === 'failed') {
      clearInterval(interval);
      console.error('Job failed:', status.data.error);
    }
  }, 2000); // Poll every 2 seconds
}
```

**Expected Response (Processing):**
```json
{
  "success": true,
  "data": {
    "jobId": "job-abc123-def456",
    "status": "processing",
    "progress": 65,
    "currentStep": "Split page 7/10...",
    "toolId": "pdf-split",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:15.000Z"
  }
}
```

**Expected Response (Completed):**
```json
{
  "success": true,
  "data": {
    "jobId": "job-abc123-def456",
    "status": "completed",
    "progress": 100,
    "currentStep": "Split complete! Created 10 files",
    "result": {
      "outputFileId": "output-xyz789",
      "filename": "output.zip",
      "size": 2048000
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "completedAt": "2024-01-15T10:30:20.000Z"
  }
}
```

**What Frontend Should Display:**
```javascript
// Show progress bar
<progress value={status.data.progress} max="100" />
// Show status message
<p>{status.data.currentStep}</p>
```

---

### **STEP 5: Download Result**

**Frontend Action:**
```javascript
function downloadResult(jobId) {
  // Option 1: Direct download
  window.location.href = `http://localhost:3000/api/download/${jobId}`;

  // Option 2: Download with custom filename
  fetch(`http://localhost:3000/api/download/${jobId}`)
    .then(response => response.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'result.zip';
      a.click();
    });
}
```

**Expected Response:**
- Binary file download (ZIP or DOCX depending on tool)
- Headers:
  - `Content-Type: application/zip` or `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  - `Content-Disposition: attachment; filename="output.zip"`

---

## Testing with cURL / Postman

### **Test 1: Upload PDF**

```bash
curl -X POST http://localhost:3000/api/upload/single \
  -F "file=@/path/to/your/document.pdf"
```

**Copy the `fileId` from response**

---

### **Test 2: Get PDF Info**

```bash
curl http://localhost:3000/api/preview/pdf/{fileId}/info
```

---

### **Test 3: Split PDF**

```bash
curl -X POST http://localhost:3000/api/tools/pdf-split/process \
  -H "Content-Type: application/json" \
  -d '{
    "fileIds": ["YOUR_FILE_ID_HERE"],
    "settings": {
      "mode": "individual"
    }
  }'
```

**Copy the `jobId` from response**

---

### **Test 4: Check Status**

```bash
# Run this multiple times until status is "completed"
curl http://localhost:3000/api/jobs/{jobId}
```

---

### **Test 5: Download Result**

```bash
curl -O http://localhost:3000/api/download/{jobId}
```

---

## Complete Frontend Example (React)

```javascript
import React, { useState } from 'react';

function PdfConverter() {
  const [file, setFile] = useState(null);
  const [fileId, setFileId] = useState('');
  const [jobId, setJobId] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [error, setError] = useState('');

  // Step 1: Upload
  const handleUpload = async (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://localhost:3000/api/upload/single', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setFileId(data.data.fileId);
        console.log('File uploaded:', data.data.fileId);
      } else {
        setError('Upload failed');
      }
    } catch (err) {
      setError('Upload error: ' + err.message);
    }
  };

  // Step 2: Process
  const handleProcess = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/tools/pdf-split/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileIds: [fileId],
          settings: {
            mode: 'individual'
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        setJobId(data.data.jobId);
        pollStatus(data.data.jobId);
      } else {
        setError('Process failed');
      }
    } catch (err) {
      setError('Process error: ' + err.message);
    }
  };

  // Step 3: Poll Status
  const pollStatus = (id) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/jobs/${id}`);
        const data = await response.json();

        if (data.success) {
          setProgress(data.data.progress);
          setStatus(data.data.currentStep || data.data.status);

          // Completed
          if (data.data.status === 'completed') {
            clearInterval(interval);
            setDownloadUrl(`http://localhost:3000/api/download/${id}`);
          }

          // Failed
          if (data.data.status === 'failed') {
            clearInterval(interval);
            setError('Job failed: ' + data.data.error);
          }
        }
      } catch (err) {
        clearInterval(interval);
        setError('Status check error: ' + err.message);
      }
    }, 2000);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px' }}>
      <h1>PDF Splitter</h1>

      {/* Upload */}
      <div>
        <input
          type="file"
          accept=".pdf"
          onChange={handleUpload}
        />
        {file && <p>Selected: {file.name}</p>}
        {fileId && <p style={{ color: 'green' }}>✓ Uploaded (ID: {fileId.substring(0, 8)}...)</p>}
      </div>

      {/* Process */}
      {fileId && !jobId && (
        <div style={{ marginTop: '20px' }}>
          <button onClick={handleProcess}>
            Split PDF into Individual Pages
          </button>
        </div>
      )}

      {/* Progress */}
      {jobId && !downloadUrl && (
        <div style={{ marginTop: '20px' }}>
          <h3>Processing...</h3>
          <progress value={progress} max="100" style={{ width: '100%' }} />
          <p>{progress}% - {status}</p>
        </div>
      )}

      {/* Download */}
      {downloadUrl && (
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ color: 'green' }}>✓ Complete!</h3>
          <a href={downloadUrl} download>
            <button>Download ZIP File</button>
          </a>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ marginTop: '20px', color: 'red' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
}

export default PdfConverter;
```

---

## What Frontend Should Expect - Summary

### **Data Structures**

#### **1. Upload Response**
```typescript
interface UploadResponse {
  success: boolean;
  data: {
    fileId: string;          // Use this for processing
    originalName: string;
    mimeType: string;
    size: number;
    path: string;
    uploadedAt: string;      // ISO date
  };
  message: string;
}
```

#### **2. Job Response**
```typescript
interface JobResponse {
  success: boolean;
  data: {
    jobId: string;           // Use this for status checks
    status: string;          // "pending" | "processing" | "completed" | "failed"
    toolId: string;
    createdAt: string;
  };
}
```

#### **3. Status Response**
```typescript
interface StatusResponse {
  success: boolean;
  data: {
    jobId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;        // 0-100
    currentStep: string;     // Human-readable message
    result?: {
      outputFileId: string;
      filename: string;
      size: number;
    };
    error?: string;          // Only if failed
    createdAt: string;
    completedAt?: string;
  };
}
```

---

## Expected Frontend Flow

```
┌─────────────────┐
│  User Action    │
└────────┬────────┘
         │
    Select File
         │
         ▼
┌─────────────────┐
│ Upload to API   │  POST /api/upload/single
└────────┬────────┘
         │
    Get fileId
         │
         ▼
┌─────────────────┐
│ Show Preview    │  GET /api/preview/pdf/{fileId}/info (optional)
└────────┬────────┘
         │
    User confirms
         │
         ▼
┌─────────────────┐
│ Start Process   │  POST /api/tools/pdf-split/process
└────────┬────────┘
         │
    Get jobId
         │
         ▼
┌─────────────────┐
│ Poll Status     │  GET /api/jobs/{jobId} (every 2s)
│ Show Progress   │  Update UI with progress & status
└────────┬────────┘
         │
    status = "completed"
         │
         ▼
┌─────────────────┐
│ Download Result │  GET /api/download/{jobId}
└─────────────────┘
```

---

## Error Handling

### **Frontend Should Handle:**

1. **Upload Errors**
   - File too large
   - Invalid file type
   - Network errors

2. **Processing Errors**
   - Job failed
   - Invalid parameters
   - Timeout

3. **Network Errors**
   - Connection lost
   - Server down
   - CORS issues

### **Example Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "File must be a PDF",
    "details": {
      "field": "mimeType",
      "expected": "application/pdf",
      "received": "image/jpeg"
    }
  }
}
```

---

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Can upload PDF file
- [ ] Receives fileId from upload
- [ ] Can get PDF info/preview
- [ ] Can trigger PDF split job
- [ ] Receives jobId from process
- [ ] Status endpoint returns progress
- [ ] Job completes successfully
- [ ] Can download result file
- [ ] Result file is valid ZIP/DOCX

---

## Common Issues & Solutions

### **Issue: "Connection refused"**
**Solution:** Make sure backend is running on port 3000

### **Issue: "CORS error"**
**Solution:** Backend already has CORS configured for localhost:3000, 3001, 5173, 5174

### **Issue: "Redis connection failed"**
**Solution:** Start Redis: `redis-server` or `docker run -d -p 6379:6379 redis`

### **Issue: "Module not found"**
**Solution:** Run `npm install` to install dependencies

### **Issue: "File not found for processing"**
**Solution:** Check that fileId is correct and file was uploaded successfully

---

## Next Steps

1. **Start the backend** (`npm run dev`)
2. **Test with curl/Postman** (upload → process → status → download)
3. **Build frontend UI** using the React example above
4. **Test end-to-end** with real PDF files

The backend is **ready to use right now!** 🚀
