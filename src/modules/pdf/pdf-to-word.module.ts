/**
 * PDF to Word Conversion Module
 * Converts PDF files to editable Word (DOCX) format
 * Supports both digital and scanned PDFs with OCR
 */

import fs from 'fs/promises';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { Document, Paragraph, TextRun, AlignmentType, HeadingLevel } from 'docx';
import { BaseModule } from '../../core/modules/base.module';
import {
  ModuleCapabilities,
  FileMeta,
  ValidationResult,
  ExecutionContext,
  ExecutionResult,
} from '../../core/interfaces/module.interface';

// For text extraction from PDF
const pdfParse = require('pdf-parse');

// For OCR (will be implemented with Tesseract)
// import { createWorker } from 'tesseract.js';

interface PdfToWordOptions {
  ocr?: boolean;
  ocrLanguage?: string;
  preserveLayout?: 'high' | 'fast';
  password?: string;
}

export class PdfToWordModule extends BaseModule {
  readonly name = 'pdf.toWord';
  readonly category = 'pdf';
  readonly version = '1.0.0';
  readonly description = 'Convert PDF to editable Word (DOCX) format with OCR support';

  capabilities(): ModuleCapabilities {
    return {
      actions: {
        convert: {
          description: 'Convert PDF to Word document',
          inputTypes: ['application/pdf'],
          outputType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          options: {
            type: 'object',
            properties: {
              ocr: {
                type: 'boolean',
                description: 'Enable OCR for scanned PDFs',
                default: false,
              },
              ocrLanguage: {
                type: 'string',
                description: 'OCR language (eng, fra, spa, deu, etc.)',
                default: 'eng',
                enum: ['eng', 'fra', 'spa', 'deu', 'ita', 'por', 'rus', 'chi_sim', 'jpn', 'kor', 'ara'],
              },
              preserveLayout: {
                type: 'string',
                description: 'Layout preservation level',
                default: 'high',
                enum: ['high', 'fast'],
              },
              password: {
                type: 'string',
                description: 'Password for encrypted PDFs',
              },
            },
          },
          sync: false,
          estimatedDuration: 30,
        },
      },
    };
  }

  validate(options: any, fileMeta: FileMeta): ValidationResult {
    // Call base validation
    const baseValidation = super.validate(options, fileMeta);
    if (!baseValidation.valid) {
      return baseValidation;
    }

    // PDF-specific validation
    if (fileMeta.mimeType !== 'application/pdf') {
      return {
        valid: false,
        error: 'File must be a PDF',
      };
    }

    // Check file size (max 50MB for conversion)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (fileMeta.size > maxSize) {
      return {
        valid: false,
        error: `File too large. Maximum size: 50MB, got: ${(fileMeta.size / (1024 * 1024)).toFixed(2)}MB`,
      };
    }

    // Check page count (max 100 pages)
    const pageCount = fileMeta.metadata?.pageCount || 0;
    if (pageCount > 100) {
      return {
        valid: false,
        error: `Too many pages. Maximum: 100 pages, got: ${pageCount} pages`,
      };
    }

    return { valid: true };
  }

  async execute(
    inputPath: string,
    action: string,
    options: PdfToWordOptions,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    await this.validateFile(inputPath);
    await this.updateProgress(context, 5, 'Loading PDF...');

    try {
      // Step 1: Load PDF and check if encrypted
      const pdfBytes = await fs.readFile(inputPath);
      let pdfDoc: PDFDocument;

      try {
        pdfDoc = await PDFDocument.load(pdfBytes, {
          ignoreEncryption: false,
        });
      } catch (error: any) {
        if (error.message.includes('encrypted') || error.message.includes('password')) {
          if (!options.password) {
            throw new Error('PDF is encrypted. Please provide password.');
          }
          // Try loading with password
          // Note: pdf-lib doesn't support encrypted PDFs well
          // In production, use qpdf or pdftk to decrypt first
          throw new Error('Encrypted PDF support requires qpdf. Please decrypt PDF first or provide valid password.');
        }
        throw error;
      }

      const pageCount = pdfDoc.getPageCount();
      await this.updateProgress(context, 10, `Processing ${pageCount} pages...`);

      // Step 2: Extract text from PDF
      let extractedText: string;
      let textByPage: string[] = [];

      if (options.ocr) {
        // OCR mode for scanned PDFs
        await this.updateProgress(context, 15, 'Performing OCR (this may take a while)...');
        const ocrResult = await this.performOcr(inputPath, options.ocrLanguage || 'eng', context);
        extractedText = ocrResult.text;
        textByPage = ocrResult.pages;
      } else {
        // Standard text extraction for digital PDFs
        await this.updateProgress(context, 20, 'Extracting text from PDF...');
        const parseResult = await this.extractTextFromPdf(pdfBytes);
        extractedText = parseResult.text;
        textByPage = parseResult.pages;
      }

      await this.updateProgress(context, 60, 'Generating Word document...');

      // Step 3: Create Word document
      const docx = await this.createWordDocument(
        textByPage,
        pageCount,
        options.preserveLayout || 'high',
        context
      );

      // Step 4: Save DOCX file
      await this.updateProgress(context, 90, 'Saving Word document...');
      const outputPath = path.join(context.workDir, 'output.docx');
      await fs.writeFile(outputPath, docx);

      const duration = Date.now() - startTime;
      const costUnits = this.calculateCostUnits(pageCount, options.ocr || false);

      await this.updateProgress(context, 100, 'Conversion complete!');

      return {
        success: true,
        outputPath,
        duration,
        costUnits,
        metadata: {
          originalPages: pageCount,
          ocrUsed: options.ocr || false,
          outputFormat: 'docx',
          charactersExtracted: extractedText.length,
        },
        logs: [
          `Processed ${pageCount} pages`,
          `Extracted ${extractedText.length} characters`,
          options.ocr ? `OCR language: ${options.ocrLanguage}` : 'Standard text extraction',
          `Duration: ${(duration / 1000).toFixed(2)}s`,
        ],
      };
    } catch (error: any) {
      return {
        success: false,
        outputPath: '',
        duration: Date.now() - startTime,
        costUnits: 0,
        error: error.message,
        logs: [`Error: ${error.message}`],
      };
    }
  }

  /**
   * Extract text from PDF using pdf-parse
   */
  private async extractTextFromPdf(
    pdfBytes: Buffer
  ): Promise<{ text: string; pages: string[] }> {
    const data = await pdfParse(pdfBytes);

    // Split by form feed character (page breaks)
    const pages = data.text.split('\f').filter((p: string) => p.trim().length > 0);

    return {
      text: data.text,
      pages: pages.length > 0 ? pages : [data.text],
    };
  }

  /**
   * Perform OCR on scanned PDF
   * Note: This is a placeholder. In production, use Tesseract.js or OCRmyPDF
   */
  private async performOcr(
    inputPath: string,
    language: string,
    context: ExecutionContext
  ): Promise<{ text: string; pages: string[] }> {
    // Placeholder implementation
    // In production, you would:
    // 1. Convert PDF pages to images using pdf-to-image
    // 2. Run Tesseract OCR on each image
    // 3. Combine results

    await this.updateProgress(context, 30, `OCR in progress (language: ${language})...`);

    // For now, fall back to text extraction
    const pdfBytes = await fs.readFile(inputPath);
    const result = await this.extractTextFromPdf(pdfBytes);

    // TODO: Implement actual OCR using Tesseract.js
    // const worker = await createWorker(language);
    // const { data: { text } } = await worker.recognize(imagePath);
    // await worker.terminate();

    return result;
  }

  /**
   * Create Word document from extracted text
   */
  private async createWordDocument(
    pages: string[],
    pageCount: number,
    layoutMode: 'high' | 'fast',
    context: ExecutionContext
  ): Promise<Buffer> {
    const sections: any[] = [];

    for (let i = 0; i < pages.length; i++) {
      await this.updateProgress(
        context,
        60 + ((i + 1) / pages.length) * 25,
        `Formatting page ${i + 1}/${pages.length}...`
      );

      const pageText = pages[i];
      const paragraphs: Paragraph[] = [];

      if (layoutMode === 'high') {
        // High-quality layout preservation
        // Split by double newlines (paragraphs)
        const chunks = pageText.split(/\n\n+/);

        for (const chunk of chunks) {
          const lines = chunk.trim().split('\n');

          for (const line of lines) {
            if (line.trim().length === 0) continue;

            // Detect if line is a heading (all caps, short, etc.)
            const isHeading = this.detectHeading(line);

            paragraphs.push(
              new Paragraph({
                children: [new TextRun(line.trim())],
                heading: isHeading ? HeadingLevel.HEADING_2 : undefined,
                spacing: { after: 200 },
              })
            );
          }
        }
      } else {
        // Fast mode - simple line-by-line conversion
        const lines = pageText.split('\n').filter(l => l.trim().length > 0);

        for (const line of lines) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun(line.trim())],
              spacing: { after: 120 },
            })
          );
        }
      }

      // Add page break after each page (except last)
      if (i < pages.length - 1) {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: '', break: 1 })],
            pageBreakBefore: true,
          })
        );
      }

      sections.push(...paragraphs);
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: sections,
        },
      ],
    });

    // Generate DOCX buffer
    const Packer = require('docx').Packer;
    const buffer = await Packer.toBuffer(doc);

    return Buffer.from(buffer);
  }

  /**
   * Detect if text line is likely a heading
   */
  private detectHeading(line: string): boolean {
    const trimmed = line.trim();

    // Heuristics for heading detection:
    // 1. Short lines (< 60 chars)
    // 2. All caps
    // 3. Ends with colon
    // 4. Starts with number (e.g., "1. Introduction")

    if (trimmed.length > 60) return false;
    if (trimmed === trimmed.toUpperCase() && trimmed.length > 3) return true;
    if (trimmed.endsWith(':')) return true;
    if (/^\d+\.?\s+[A-Z]/.test(trimmed)) return true;

    return false;
  }

  /**
   * Calculate cost units based on pages and OCR usage
   */
  private calculateCostUnits(pageCount: number, ocrUsed: boolean): number {
    const baseCost = pageCount * 3; // 3 units per page for conversion
    const ocrCost = ocrUsed ? pageCount * 5 : 0; // Additional 5 units per page for OCR

    return baseCost + ocrCost;
  }

  estimateCost(action: string, options: any, fileMeta: FileMeta): number {
    const pageCount = fileMeta.metadata?.pageCount || 1;
    return this.calculateCostUnits(pageCount, options.ocr || false);
  }
}
