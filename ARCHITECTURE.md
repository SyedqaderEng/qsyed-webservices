# Universal Pipeline Architecture - Design Document

## Overview

A unified backend architecture that handles 300+ file processing utilities through a single, consistent API using a **Pipeline Orchestrator** pattern with pluggable engine modules.

---

## Core Principles

1. **5 Universal Endpoints** - All 300+ tools use the same API
2. **Pipeline-Based Processing** - Chain multiple operations sequentially
3. **Pluggable Modules** - Each tool is a module with standard interface
4. **Privacy-First** - Auto-expire files, minimal metadata storage
5. **Async by Default** - Queue-based processing with real-time status

---

## API Contract

### 1. Upload File
```http
POST /api/upload
Content-Type: multipart/form-data

Body:
  file: <binary>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fileId": "f-abc123-def456",
    "filename": "document.pdf",
    "size": 1024000,
    "mimeType": "application/pdf",
    "uploadedAt": "2024-01-15T10:30:00Z",
    "expiresAt": "2024-01-16T10:30:00Z",
    "metadata": {
      "pageCount": 10,
      "dimensions": { "width": 612, "height": 792 },
      "duration": null,
      "frameCount": null
    }
  }
}
```

---

### 2. Preview File
```http
GET /api/preview/{fileId}
```

**Response (PDF):**
```json
{
  "success": true,
  "data": {
    "fileId": "f-abc123",
    "type": "pdf",
    "pageCount": 10,
    "pages": [
      {
        "pageNumber": 1,
        "thumbnail": "https://.../thumb-1.jpg",
        "width": 612,
        "height": 792,
        "rotation": 0
      }
    ],
    "metadata": {
      "title": "Document",
      "author": "John Doe",
      "created": "2024-01-01T00:00:00Z"
    }
  }
}
```

**Response (Video):**
```json
{
  "success": true,
  "data": {
    "fileId": "f-xyz789",
    "type": "video",
    "duration": 120.5,
    "frameCount": 3600,
    "resolution": { "width": 1920, "height": 1080 },
    "fps": 30,
    "codec": "h264",
    "storyboard": [
      { "time": 0, "thumbnail": "https://.../frame-0.jpg" },
      { "time": 30, "thumbnail": "https://.../frame-30.jpg" }
    ]
  }
}
```

**Response (Image):**
```json
{
  "success": true,
  "data": {
    "fileId": "f-img123",
    "type": "image",
    "width": 1920,
    "height": 1080,
    "format": "jpeg",
    "colorSpace": "srgb",
    "hasAlpha": false,
    "preview": "https://.../preview.jpg",
    "exif": {
      "make": "Canon",
      "model": "EOS 5D",
      "dateTaken": "2024-01-15T10:00:00Z"
    }
  }
}
```

**Response (Audio):**
```json
{
  "success": true,
  "data": {
    "fileId": "f-aud456",
    "type": "audio",
    "duration": 180.5,
    "sampleRate": 44100,
    "channels": 2,
    "bitrate": 320,
    "codec": "mp3",
    "waveform": "https://.../waveform.png"
  }
}
```

---

### 3. Process Pipeline
```http
POST /api/process
Content-Type: application/json

Body:
{
  "fileId": "f-abc123",
  "pipeline": [
    {
      "module": "pdf.split",
      "action": "keepPages",
      "options": {
        "pages": [1, 3, 5, 7, 9]
      }
    },
    {
      "module": "pdf.compress",
      "action": "compress",
      "options": {
        "level": "medium"
      }
    },
    {
      "module": "pdf.watermark",
      "action": "addText",
      "options": {
        "text": "CONFIDENTIAL",
        "opacity": 0.5,
        "position": "center"
      }
    }
  ],
  "preferSync": false,
  "notify": {
    "webhook": "https://myapp.com/webhook/completed",
    "email": "user@example.com"
  }
}
```

**Response (Async):**
```json
{
  "success": true,
  "data": {
    "requestId": "req-xyz789-abc123",
    "status": "queued",
    "estimatedDuration": 30,
    "queuePosition": 3,
    "createdAt": "2024-01-15T10:30:00Z",
    "statusUrl": "/api/status/req-xyz789-abc123"
  }
}
```

**Response (Sync - if preferSync=true and quick):**
```json
{
  "success": true,
  "data": {
    "requestId": "req-xyz789-abc123",
    "status": "completed",
    "result": {
      "fileToken": "tok-result-abc123",
      "downloadUrl": "/api/download/tok-result-abc123",
      "filename": "processed-output.pdf",
      "size": 512000,
      "expiresAt": "2024-01-16T10:30:00Z"
    }
  }
}
```

---

### 4. Check Status
```http
GET /api/status/{requestId}
```

**Response (Processing):**
```json
{
  "success": true,
  "data": {
    "requestId": "req-xyz789",
    "status": "processing",
    "progress": 65,
    "currentStep": 2,
    "totalSteps": 3,
    "steps": [
      {
        "step": 1,
        "module": "pdf.split",
        "action": "keepPages",
        "status": "completed",
        "duration": 2.5,
        "startedAt": "2024-01-15T10:30:01Z",
        "completedAt": "2024-01-15T10:30:03Z"
      },
      {
        "step": 2,
        "module": "pdf.compress",
        "action": "compress",
        "status": "processing",
        "progress": 65,
        "startedAt": "2024-01-15T10:30:03Z"
      },
      {
        "step": 3,
        "module": "pdf.watermark",
        "action": "addText",
        "status": "pending"
      }
    ],
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Response (Completed):**
```json
{
  "success": true,
  "data": {
    "requestId": "req-xyz789",
    "status": "completed",
    "progress": 100,
    "totalDuration": 8.5,
    "result": {
      "fileToken": "tok-result-abc123",
      "downloadUrl": "/api/download/tok-result-abc123",
      "filename": "processed-output.pdf",
      "size": 512000,
      "expiresAt": "2024-01-16T10:30:00Z"
    },
    "steps": [
      { "step": 1, "module": "pdf.split", "status": "completed", "duration": 2.5 },
      { "step": 2, "module": "pdf.compress", "status": "completed", "duration": 4.0 },
      { "step": 3, "module": "pdf.watermark", "status": "completed", "duration": 2.0 }
    ],
    "createdAt": "2024-01-15T10:30:00Z",
    "completedAt": "2024-01-15T10:30:08Z"
  }
}
```

**Response (Failed):**
```json
{
  "success": true,
  "data": {
    "requestId": "req-xyz789",
    "status": "failed",
    "progress": 33,
    "error": {
      "code": "MODULE_EXECUTION_ERROR",
      "message": "Failed to compress PDF: File too large",
      "step": 2,
      "module": "pdf.compress",
      "action": "compress",
      "details": {
        "maxSize": "100MB",
        "actualSize": "150MB"
      }
    },
    "steps": [
      { "step": 1, "module": "pdf.split", "status": "completed", "duration": 2.5 },
      { "step": 2, "module": "pdf.compress", "status": "failed", "error": "..." }
    ]
  }
}
```

---

### 5. Download Result
```http
GET /api/download/{fileToken}
```

**Response:**
- Binary file download with appropriate headers
- Content-Disposition: attachment; filename="processed-output.pdf"
- Content-Type: application/pdf
- Signed token valid for limited time (1 hour)

---

## Module Interface Standard

Every processing module must implement this interface:

```typescript
interface ProcessingModule {
  /**
   * Module metadata
   */
  name: string;           // "pdf.split"
  category: string;       // "pdf"
  version: string;        // "1.0.0"
  description: string;

  /**
   * List of actions this module supports
   */
  capabilities(): ModuleCapabilities;

  /**
   * Validate input options before execution
   */
  validate(
    options: any,
    fileMeta: FileMeta
  ): ValidationResult;

  /**
   * Execute the processing action
   */
  execute(
    inputPath: string,
    options: any,
    workDir: string,
    context: ExecutionContext
  ): Promise<ExecutionResult>;

  /**
   * Cleanup temporary files
   */
  cleanup(paths: string[]): Promise<void>;

  /**
   * Estimate cost units for monitoring
   */
  estimateCost(options: any): number;
}

interface ModuleCapabilities {
  actions: {
    [actionName: string]: {
      description: string;
      inputTypes: string[];    // ["application/pdf"]
      outputType: string;      // "application/pdf"
      options: OptionSchema;   // JSON schema for options
      sync: boolean;           // Can run synchronously?
      estimatedDuration: number; // Seconds
    }
  };
}

interface ExecutionResult {
  success: boolean;
  outputPath: string;
  metadata?: any;
  duration: number;
  costUnits: number;
  logs?: string[];
}
```

---

## Pipeline Orchestrator Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    PIPELINE ORCHESTRATOR                    │
└─────────────────────────────────────────────────────────────┘

1. Receive Pipeline Request
   ↓
2. Validate Request
   - Check fileId exists
   - Validate each module exists
   - Validate options schema
   - Check user quota
   ↓
3. Create Request Record
   - Generate requestId
   - Store pipeline definition
   - Set status = "queued"
   ↓
4. Queue Job (if async) OR Execute (if sync)
   ↓
5. Worker Picks Up Job
   ↓
6. For Each Step in Pipeline:
   ├─ Load Module
   ├─ Validate Options
   ├─ Create Work Directory
   ├─ Execute Module
   │  ├─ Update status = "processing"
   │  ├─ Update progress
   │  ├─ Call module.execute()
   │  ├─ Store intermediate output
   │  └─ Log duration & cost
   ├─ Pass Output to Next Step
   └─ Cleanup Temporary Files
   ↓
7. Upload Final Result
   - Store in object storage
   - Generate signed fileToken
   - Set TTL for auto-deletion
   ↓
8. Update Request Status
   - Set status = "completed"
   - Store result metadata
   - Record total duration
   ↓
9. Notify User (if webhook configured)
   - POST to webhook URL
   - Send email notification
   ↓
10. Cleanup Pipeline Artifacts
    - Delete intermediate files
    - Keep only final output
```

---

## Database Schema

### `files` table
```sql
CREATE TABLE files (
  file_id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64),
  storage_key VARCHAR(255) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes BIGINT NOT NULL,
  metadata JSONB,              -- {pageCount, duration, dimensions, etc.}
  uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
);
```

### `requests` table
```sql
CREATE TABLE requests (
  request_id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64),
  file_id VARCHAR(64) REFERENCES files(file_id),
  pipeline JSONB NOT NULL,     -- Full pipeline definition
  status VARCHAR(20) NOT NULL, -- queued, processing, completed, failed
  current_step INT DEFAULT 0,
  total_steps INT NOT NULL,
  progress INT DEFAULT 0,
  result JSONB,                -- {fileToken, downloadUrl, filename, size}
  error JSONB,                 -- Error details if failed
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  total_duration_ms INT,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);
```

### `pipeline_steps` table
```sql
CREATE TABLE pipeline_steps (
  id SERIAL PRIMARY KEY,
  request_id VARCHAR(64) REFERENCES requests(request_id),
  step_number INT NOT NULL,
  module_name VARCHAR(100) NOT NULL,
  action_name VARCHAR(100) NOT NULL,
  options JSONB,
  status VARCHAR(20) NOT NULL,
  progress INT DEFAULT 0,
  duration_ms INT,
  cost_units DECIMAL(10,2),
  error TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  INDEX idx_request_id (request_id)
);
```

### `api_keys` table
```sql
CREATE TABLE api_keys (
  key_id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  key_hash VARCHAR(255) NOT NULL,
  plan VARCHAR(50) DEFAULT 'free',
  status VARCHAR(20) DEFAULT 'active',
  quota_daily_requests INT DEFAULT 100,
  quota_max_file_size_mb INT DEFAULT 10,
  quota_max_concurrent_jobs INT DEFAULT 3,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP,
  last_used_at TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
);
```

### `usage_tracking` table
```sql
CREATE TABLE usage_tracking (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(64),
  request_id VARCHAR(64),
  module_name VARCHAR(100),
  action_name VARCHAR(100),
  cost_units DECIMAL(10,2),
  duration_ms INT,
  file_size_bytes BIGINT,
  status VARCHAR(20),
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  INDEX idx_user_id_timestamp (user_id, timestamp),
  INDEX idx_module (module_name)
);
```

---

## Module Registry

All modules are registered in a central registry:

```typescript
// src/modules/registry.ts

class ModuleRegistry {
  private modules: Map<string, ProcessingModule> = new Map();

  register(module: ProcessingModule): void {
    this.modules.set(module.name, module);
  }

  get(moduleName: string): ProcessingModule | undefined {
    return this.modules.get(moduleName);
  }

  list(): ModuleCapabilities[] {
    return Array.from(this.modules.values()).map(m => ({
      name: m.name,
      category: m.category,
      version: m.version,
      description: m.description,
      capabilities: m.capabilities()
    }));
  }

  validatePipeline(pipeline: PipelineStep[]): ValidationResult {
    for (const step of pipeline) {
      const module = this.get(step.module);
      if (!module) {
        return {
          valid: false,
          error: `Module not found: ${step.module}`
        };
      }

      const validation = module.validate(step.options, fileMeta);
      if (!validation.valid) {
        return validation;
      }
    }
    return { valid: true };
  }
}

export const moduleRegistry = new ModuleRegistry();
```

---

## Security Model

### File Storage Security
- All files stored with encryption at rest
- Signed URLs for downloads (expire after 1 hour)
- Auto-delete files after TTL (24 hours default)
- No file content stored in database

### API Security
- API key authentication required
- Rate limiting per API key
- CORS policies enforced
- File size limits enforced
- MIME type validation
- Optional virus scanning on upload

### Execution Security
- Modules run in isolated work directories
- Resource limits (CPU, memory, time)
- No network access from modules
- Sandbox execution environment
- Input validation before execution

---

## Error Handling & Retries

### Retry Strategy
- Module execution failures: 3 retries with exponential backoff
- Pipeline step failures: retry current step before failing entire pipeline
- Network errors: retry with backoff
- Dead letter queue for repeated failures

### Error Responses
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid page numbers: pages must be within range 1-10",
    "details": {
      "field": "options.pages",
      "received": [1, 15],
      "expected": "1-10"
    }
  }
}
```

---

## Cost Tracking

Each module reports cost units for monitoring:

```typescript
// Example cost units
pdf.split:       1 unit per page
pdf.compress:    2 units per MB
pdf.ocr:         10 units per page
image.resize:    0.5 units per image
video.transcode: 5 units per second
```

Cost tracking helps:
- Monitor resource usage
- Implement usage-based pricing
- Detect abuse/inefficiency
- Optimize expensive operations

---

## File Retention & Privacy

### Retention Policy
- **Uploaded files:** 24 hours TTL
- **Processed results:** 24 hours TTL
- **Intermediate files:** Deleted immediately after pipeline completes
- **Request metadata:** 30 days (for analytics)
- **Preview thumbnails:** 24 hours TTL

### Privacy Guarantees
- No file content stored in database
- All files auto-expire
- User can delete files anytime
- Optional end-to-end encryption
- GDPR-compliant data handling

---

## Scalability Considerations

### Horizontal Scaling
- Stateless API servers (scale with load balancer)
- Queue-based worker pool (scale workers independently)
- Object storage for files (S3/MinIO)
- Cache layer for previews (Redis)

### Performance Optimization
- Parallel module execution (where possible)
- Streaming for large files
- Chunked uploads for large files
- CDN for download delivery
- Database indexing for fast queries

### Resource Management
- Worker pools with concurrency limits
- Timeout enforcement (max 10 minutes per step)
- Memory limits per worker
- Disk cleanup after each job

---

## Example Pipelines

### PDF Split + Compress + Watermark
```json
{
  "fileId": "f-abc123",
  "pipeline": [
    {"module": "pdf.split", "action": "keepPages", "options": {"pages": [1,3,5]}},
    {"module": "pdf.compress", "action": "compress", "options": {"level": "high"}},
    {"module": "pdf.watermark", "action": "addText", "options": {"text": "DRAFT"}}
  ]
}
```

### Image Resize + Watermark + Convert
```json
{
  "fileId": "f-img456",
  "pipeline": [
    {"module": "image.resize", "action": "resize", "options": {"width": 1920, "height": 1080}},
    {"module": "image.watermark", "action": "addText", "options": {"text": "© 2024"}},
    {"module": "image.convert", "action": "format", "options": {"format": "webp"}}
  ]
}
```

### Video Trim + Compress + Extract Audio
```json
{
  "fileId": "f-vid789",
  "pipeline": [
    {"module": "video.trim", "action": "cut", "options": {"start": 10, "end": 60}},
    {"module": "video.compress", "action": "compress", "options": {"bitrate": "2M"}},
    {"module": "video.audio", "action": "extract", "options": {"format": "mp3"}}
  ]
}
```

---

## Next Steps

1. ✅ Design architecture (this document)
2. ⏳ Implement 5 universal API endpoints
3. ⏳ Build Pipeline Orchestrator
4. ⏳ Create Module Interface standard
5. ⏳ Refactor existing PDF tools as modules
6. ⏳ Implement file storage with TTL
7. ⏳ Build preview generation system
8. ⏳ Add cost tracking and quotas
9. ⏳ Update database schema
10. ⏳ Test end-to-end pipelines

---

**This architecture allows us to build 300+ tools using the same foundation with no API changes.**
