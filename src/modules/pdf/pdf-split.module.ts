/**
 * PDF Split Module
 * Implements PDF splitting functionality using the universal module interface
 */

import fs from 'fs/promises';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import AdmZip from 'adm-zip';
import { BaseModule } from '../../core/modules/base.module';
import {
  ModuleCapabilities,
  FileMeta,
  ValidationResult,
  ExecutionContext,
  ExecutionResult,
} from '../../core/interfaces/module.interface';

export class PdfSplitModule extends BaseModule {
  readonly name = 'pdf.split';
  readonly category = 'pdf';
  readonly version = '1.0.0';
  readonly description = 'Split PDF into multiple files by pages, ranges, or individual pages';

  capabilities(): ModuleCapabilities {
    return {
      actions: {
        keepPages: {
          description: 'Keep only specified pages from PDF',
          inputTypes: ['application/pdf'],
          outputType: 'application/pdf',
          options: {
            type: 'object',
            properties: {
              pages: {
                type: 'array',
                items: { type: 'number' },
                description: 'Array of page numbers to keep (1-indexed)',
              },
            },
            required: ['pages'],
          },
          sync: true,
          estimatedDuration: 3,
        },
        splitByPages: {
          description: 'Split PDF every N pages',
          inputTypes: ['application/pdf'],
          outputType: 'application/zip',
          options: {
            type: 'object',
            properties: {
              pagesPerFile: {
                type: 'number',
                description: 'Number of pages per output file',
                minimum: 1,
              },
            },
            required: ['pagesPerFile'],
          },
          sync: true,
          estimatedDuration: 5,
        },
        splitIndividual: {
          description: 'Split PDF into individual page files',
          inputTypes: ['application/pdf'],
          outputType: 'application/zip',
          options: {
            type: 'object',
            properties: {},
          },
          sync: true,
          estimatedDuration: 5,
        },
        splitByRanges: {
          description: 'Split PDF by custom page ranges',
          inputTypes: ['application/pdf'],
          outputType: 'application/zip',
          options: {
            type: 'object',
            properties: {
              ranges: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    start: { type: 'number' },
                    end: { type: 'number' },
                  },
                },
                description: 'Array of {start, end} page ranges',
              },
            },
            required: ['ranges'],
          },
          sync: true,
          estimatedDuration: 4,
        },
      },
    };
  }

  validate(options: any, fileMeta: FileMeta): ValidationResult {
    // Call base validation first
    const baseValidation = super.validate(options, fileMeta);
    if (!baseValidation.valid) {
      return baseValidation;
    }

    // Additional PDF-specific validation
    if (fileMeta.mimeType !== 'application/pdf') {
      return {
        valid: false,
        error: 'File must be a PDF',
      };
    }

    const pageCount = fileMeta.metadata?.pageCount || 0;

    // Validate page numbers
    if (options.pages) {
      for (const page of options.pages) {
        if (page < 1 || page > pageCount) {
          return {
            valid: false,
            error: `Invalid page number: ${page}. PDF has ${pageCount} pages.`,
            details: { page, pageCount },
          };
        }
      }
    }

    // Validate ranges
    if (options.ranges) {
      for (const range of options.ranges) {
        if (range.start < 1 || range.start > pageCount) {
          return {
            valid: false,
            error: `Invalid range start: ${range.start}. PDF has ${pageCount} pages.`,
          };
        }
        if (range.end < range.start || range.end > pageCount) {
          return {
            valid: false,
            error: `Invalid range end: ${range.end}. Must be >= ${range.start} and <= ${pageCount}.`,
          };
        }
      }
    }

    return { valid: true };
  }

  async execute(
    inputPath: string,
    action: string,
    options: any,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    await this.validateFile(inputPath);
    await this.updateProgress(context, 10, 'Loading PDF...');

    const pdfBytes = await fs.readFile(inputPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const totalPages = pdfDoc.getPageCount();

    let outputPath: string;
    let costUnits: number;

    switch (action) {
      case 'keepPages':
        outputPath = await this.executeKeepPages(
          pdfDoc,
          options.pages,
          context
        );
        costUnits = options.pages.length * 0.5;
        break;

      case 'splitByPages':
        outputPath = await this.executeSplitByPages(
          pdfDoc,
          options.pagesPerFile,
          context
        );
        costUnits = totalPages * 0.3;
        break;

      case 'splitIndividual':
        outputPath = await this.executeSplitIndividual(pdfDoc, context);
        costUnits = totalPages * 0.5;
        break;

      case 'splitByRanges':
        outputPath = await this.executeSplitByRanges(
          pdfDoc,
          options.ranges,
          context
        );
        costUnits = options.ranges.length * 1.0;
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    const duration = Date.now() - startTime;

    await this.updateProgress(context, 100, 'Complete!');

    return {
      success: true,
      outputPath,
      duration,
      costUnits,
      metadata: {
        originalPages: totalPages,
      },
    };
  }

  private async executeKeepPages(
    pdfDoc: PDFDocument,
    pages: number[],
    context: ExecutionContext
  ): Promise<string> {
    await this.updateProgress(context, 30, `Keeping ${pages.length} pages...`);

    const newPdf = await PDFDocument.create();

    // Convert to 0-indexed and copy pages
    const pageIndices = pages.map(p => p - 1);
    const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);

    copiedPages.forEach(page => newPdf.addPage(page));

    await this.updateProgress(context, 80, 'Saving PDF...');

    const outputPath = path.join(context.workDir, 'output.pdf');
    const newPdfBytes = await newPdf.save();
    await fs.writeFile(outputPath, newPdfBytes);

    return outputPath;
  }

  private async executeSplitByPages(
    pdfDoc: PDFDocument,
    pagesPerFile: number,
    context: ExecutionContext
  ): Promise<string> {
    const totalPages = pdfDoc.getPageCount();
    const zip = new AdmZip();
    let filesCreated = 0;

    await this.updateProgress(context, 30, `Splitting every ${pagesPerFile} pages...`);

    for (let i = 0; i < totalPages; i += pagesPerFile) {
      const newPdf = await PDFDocument.create();
      const endPage = Math.min(i + pagesPerFile, totalPages);

      const pageIndices = Array.from({ length: endPage - i }, (_, j) => i + j);
      const pages = await newPdf.copyPages(pdfDoc, pageIndices);
      pages.forEach(page => newPdf.addPage(page));

      const newPdfBytes = await newPdf.save();
      zip.addFile(`part_${filesCreated + 1}.pdf`, Buffer.from(newPdfBytes));
      filesCreated++;

      const progress = 30 + ((i + pagesPerFile) / totalPages) * 50;
      await this.updateProgress(context, progress, `Created ${filesCreated} files...`);
    }

    await this.updateProgress(context, 85, 'Creating ZIP...');

    const outputPath = path.join(context.workDir, 'output.zip');
    await fs.writeFile(outputPath, zip.toBuffer());

    return outputPath;
  }

  private async executeSplitIndividual(
    pdfDoc: PDFDocument,
    context: ExecutionContext
  ): Promise<string> {
    const totalPages = pdfDoc.getPageCount();
    const zip = new AdmZip();

    await this.updateProgress(context, 30, 'Splitting into individual pages...');

    for (let i = 0; i < totalPages; i++) {
      const newPdf = await PDFDocument.create();
      const [page] = await newPdf.copyPages(pdfDoc, [i]);
      newPdf.addPage(page);

      const newPdfBytes = await newPdf.save();
      zip.addFile(`page_${i + 1}.pdf`, Buffer.from(newPdfBytes));

      const progress = 30 + ((i + 1) / totalPages) * 50;
      await this.updateProgress(context, progress, `Page ${i + 1}/${totalPages}...`);
    }

    await this.updateProgress(context, 85, 'Creating ZIP...');

    const outputPath = path.join(context.workDir, 'output.zip');
    await fs.writeFile(outputPath, zip.toBuffer());

    return outputPath;
  }

  private async executeSplitByRanges(
    pdfDoc: PDFDocument,
    ranges: Array<{ start: number; end: number }>,
    context: ExecutionContext
  ): Promise<string> {
    const zip = new AdmZip();

    await this.updateProgress(context, 30, `Splitting by ${ranges.length} ranges...`);

    for (let i = 0; i < ranges.length; i++) {
      const range = ranges[i];
      const newPdf = await PDFDocument.create();

      // Convert to 0-indexed
      const pageIndices = Array.from(
        { length: range.end - range.start + 1 },
        (_, j) => range.start - 1 + j
      );

      const pages = await newPdf.copyPages(pdfDoc, pageIndices);
      pages.forEach(page => newPdf.addPage(page));

      const newPdfBytes = await newPdf.save();
      zip.addFile(`range_${range.start}-${range.end}.pdf`, Buffer.from(newPdfBytes));

      const progress = 30 + ((i + 1) / ranges.length) * 50;
      await this.updateProgress(context, progress, `Range ${i + 1}/${ranges.length}...`);
    }

    await this.updateProgress(context, 85, 'Creating ZIP...');

    const outputPath = path.join(context.workDir, 'output.zip');
    await fs.writeFile(outputPath, zip.toBuffer());

    return outputPath;
  }

  estimateCost(action: string, options: any, fileMeta: FileMeta): number {
    const pageCount = fileMeta.metadata?.pageCount || 1;

    switch (action) {
      case 'keepPages':
        return (options.pages?.length || 1) * 0.5;
      case 'splitByPages':
      case 'splitIndividual':
        return pageCount * 0.3;
      case 'splitByRanges':
        return (options.ranges?.length || 1) * 1.0;
      default:
        return super.estimateCost(action, options, fileMeta);
    }
  }
}
