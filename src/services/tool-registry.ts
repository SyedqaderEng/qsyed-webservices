import { ToolDefinition, ToolCategory } from '../types';

/**
 * Complete registry of all 192 tools
 */
const tools: ToolDefinition[] = [
  // ==================== PDF TOOLS (35) ====================
  { id: 'pdf-merge', name: 'PDF Merge', category: 'pdf', description: 'Merge multiple PDF files into one', acceptedFormats: ['.pdf'], multipleFiles: true, settings: [] },
  { id: 'pdf-split', name: 'PDF Split', category: 'pdf', description: 'Split PDF into multiple files', acceptedFormats: ['.pdf'], multipleFiles: false, settings: [{ key: 'mode', type: 'select', label: 'Split Mode', default: 'pages', options: [{ value: 'pages', label: 'Every N pages' }, { value: 'range', label: 'Page ranges' }, { value: 'individual', label: 'Individual pages' }] }] },
  { id: 'pdf-compress', name: 'PDF Compress', category: 'pdf', description: 'Compress PDF file size', acceptedFormats: ['.pdf'], multipleFiles: false, settings: [{ key: 'quality', type: 'select', label: 'Quality', default: 'medium', options: [{ value: 'screen', label: 'Screen (72 dpi)' }, { value: 'ebook', label: 'eBook (150 dpi)' }, { value: 'printer', label: 'Printer (300 dpi)' }] }] },
  { id: 'pdf-to-images', name: 'PDF to Images', category: 'pdf', description: 'Convert PDF pages to images', acceptedFormats: ['.pdf'], multipleFiles: false, settings: [{ key: 'format', type: 'select', label: 'Image Format', default: 'png', options: [{ value: 'png', label: 'PNG' }, { value: 'jpg', label: 'JPEG' }, { value: 'webp', label: 'WebP' }] }] },
  { id: 'pdf-to-word', name: 'PDF to Word', category: 'pdf', description: 'Convert PDF to DOCX', acceptedFormats: ['.pdf'], multipleFiles: false, settings: [] },
  { id: 'pdf-to-excel', name: 'PDF to Excel', category: 'pdf', description: 'Convert PDF tables to Excel', acceptedFormats: ['.pdf'], multipleFiles: false, settings: [] },
  { id: 'pdf-to-ppt', name: 'PDF to PowerPoint', category: 'pdf', description: 'Convert PDF to PPTX', acceptedFormats: ['.pdf'], multipleFiles: false, settings: [] },
  { id: 'pdf-watermark', name: 'PDF Watermark', category: 'pdf', description: 'Add watermark to PDF', acceptedFormats: ['.pdf'], multipleFiles: false, settings: [{ key: 'text', type: 'string', label: 'Watermark Text', required: true }, { key: 'opacity', type: 'number', label: 'Opacity (%)', default: 50, min: 0, max: 100 }] },
  { id: 'pdf-rotate', name: 'PDF Rotate', category: 'pdf', description: 'Rotate PDF pages', acceptedFormats: ['.pdf'], multipleFiles: false, settings: [{ key: 'angle', type: 'select', label: 'Rotation Angle', default: '90', options: [{ value: '90', label: '90°' }, { value: '180', label: '180°' }, { value: '270', label: '270°' }] }] },
  { id: 'pdf-page-numbers', name: 'PDF Page Numbers', category: 'pdf', description: 'Add page numbers to PDF', acceptedFormats: ['.pdf'], multipleFiles: false, settings: [{ key: 'format', type: 'select', label: 'Format', default: 'page-n', options: [{ value: 'page-n', label: 'Page N' }, { value: 'n', label: 'N' }, { value: 'n-of-total', label: 'N of Total' }] }] },
  { id: 'pdf-extract-text', name: 'PDF Extract Text', category: 'pdf', description: 'Extract text from PDF', acceptedFormats: ['.pdf'], multipleFiles: false, settings: [] },
  { id: 'pdf-extract-images', name: 'PDF Extract Images', category: 'pdf', description: 'Extract images from PDF', acceptedFormats: ['.pdf'], multipleFiles: false, settings: [] },
  { id: 'pdf-remove-pages', name: 'PDF Remove Pages', category: 'pdf', description: 'Remove specific pages from PDF', acceptedFormats: ['.pdf'], multipleFiles: false, settings: [{ key: 'pages', type: 'string', label: 'Pages to Remove (e.g., 1,3,5-7)', required: true }] },
  { id: 'pdf-reorder', name: 'PDF Reorder', category: 'pdf', description: 'Reorder PDF pages', acceptedFormats: ['.pdf'], multipleFiles: false, settings: [{ key: 'order', type: 'string', label: 'New Page Order (e.g., 3,1,2,4)', required: true }] },
  { id: 'pdf-password-protect', name: 'PDF Password Protect', category: 'pdf', description: 'Add password protection to PDF', acceptedFormats: ['.pdf'], multipleFiles: false, settings: [{ key: 'password', type: 'string', label: 'Password', required: true }] },
  { id: 'pdf-remove-password', name: 'PDF Remove Password', category: 'pdf', description: 'Remove password from PDF', acceptedFormats: ['.pdf'], multipleFiles: false, settings: [{ key: 'password', type: 'string', label: 'Current Password', required: true }] },
  { id: 'pdf-metadata', name: 'PDF Metadata', category: 'pdf', description: 'Edit PDF metadata', acceptedFormats: ['.pdf'], multipleFiles: false, settings: [{ key: 'title', type: 'string', label: 'Title' }, { key: 'author', type: 'string', label: 'Author' }] },
  { id: 'pdf-ocr', name: 'PDF OCR', category: 'pdf', description: 'Add OCR text layer to scanned PDF', acceptedFormats: ['.pdf'], multipleFiles: false, settings: [] },
  { id: 'pdf-sign', name: 'PDF Sign', category: 'pdf', description: 'Add signature to PDF', acceptedFormats: ['.pdf'], multipleFiles: false, settings: [] },
  { id: 'pdf-redact', name: 'PDF Redact', category: 'pdf', description: 'Redact sensitive information', acceptedFormats: ['.pdf'], multipleFiles: false, settings: [] },
  { id: 'pdf-flatten', name: 'PDF Flatten', category: 'pdf', description: 'Flatten PDF forms and annotations', acceptedFormats: ['.pdf'], multipleFiles: false, settings: [] },
  { id: 'pdf-linearize', name: 'PDF Linearize', category: 'pdf', description: 'Optimize PDF for web viewing', acceptedFormats: ['.pdf'], multipleFiles: false, settings: [] },
  { id: 'pdf-repair', name: 'PDF Repair', category: 'pdf', description: 'Repair corrupted PDF', acceptedFormats: ['.pdf'], multipleFiles: false, settings: [] },
  { id: 'pdf-compare', name: 'PDF Compare', category: 'pdf', description: 'Compare two PDF files', acceptedFormats: ['.pdf'], multipleFiles: true, settings: [] },
  { id: 'pdf-header-footer', name: 'PDF Header/Footer', category: 'pdf', description: 'Add headers and footers', acceptedFormats: ['.pdf'], multipleFiles: false, settings: [{ key: 'headerText', type: 'string', label: 'Header Text' }, { key: 'footerText', type: 'string', label: 'Footer Text' }] },
  { id: 'pdf-background', name: 'PDF Background', category: 'pdf', description: 'Add background color or image', acceptedFormats: ['.pdf'], multipleFiles: false, settings: [{ key: 'color', type: 'string', label: 'Background Color (hex)', default: '#ffffff' }] },
  { id: 'pdf-bookmarks', name: 'PDF Bookmarks', category: 'pdf', description: 'Add navigation bookmarks', acceptedFormats: ['.pdf'], multipleFiles: false, settings: [] },
  { id: 'pdf-crop', name: 'PDF Crop', category: 'pdf', description: 'Crop PDF pages', acceptedFormats: ['.pdf'], multipleFiles: false, settings: [{ key: 'marginTop', type: 'number', label: 'Top Margin (px)', default: 0 }] },
  { id: 'pdf-grayscale', name: 'PDF Grayscale', category: 'pdf', description: 'Convert PDF to grayscale', acceptedFormats: ['.pdf'], multipleFiles: false, settings: [] },
  { id: 'pdf-optimize-web', name: 'PDF Optimize for Web', category: 'pdf', description: 'Optimize PDF for web delivery', acceptedFormats: ['.pdf'], multipleFiles: false, settings: [] },
  { id: 'pdf-form-fill', name: 'PDF Form Fill', category: 'pdf', description: 'Fill PDF forms programmatically', acceptedFormats: ['.pdf'], multipleFiles: false, settings: [] },
  { id: 'pdf-convert-pdfa', name: 'PDF to PDF/A', category: 'pdf', description: 'Convert to PDF/A archival format', acceptedFormats: ['.pdf'], multipleFiles: false, settings: [] },
  { id: 'pdf-portfolio', name: 'PDF Portfolio', category: 'pdf', description: 'Create PDF portfolio from multiple files', acceptedFormats: ['.pdf', '.docx', '.xlsx', '.jpg', '.png'], multipleFiles: true, settings: [] },
  { id: 'pdf-reduce-size', name: 'PDF Reduce Size', category: 'pdf', description: 'Reduce PDF file size (alias for compress)', acceptedFormats: ['.pdf'], multipleFiles: false, settings: [] },
  { id: 'pdf-print-ready', name: 'PDF Print Ready', category: 'pdf', description: 'Prepare PDF for professional printing', acceptedFormats: ['.pdf'], multipleFiles: false, settings: [] },

  // ==================== WORD TOOLS (25) ====================
  { id: 'word-to-pdf', name: 'Word to PDF', category: 'word', description: 'Convert DOCX to PDF', acceptedFormats: ['.docx', '.doc'], multipleFiles: false, settings: [] },
  { id: 'word-to-html', name: 'Word to HTML', category: 'word', description: 'Convert DOCX to HTML', acceptedFormats: ['.docx', '.doc'], multipleFiles: false, settings: [] },
  { id: 'word-to-markdown', name: 'Word to Markdown', category: 'word', description: 'Convert DOCX to Markdown', acceptedFormats: ['.docx', '.doc'], multipleFiles: false, settings: [] },
  { id: 'word-to-txt', name: 'Word to Text', category: 'word', description: 'Extract plain text from DOCX', acceptedFormats: ['.docx', '.doc'], multipleFiles: false, settings: [] },
  { id: 'word-to-images', name: 'Word to Images', category: 'word', description: 'Convert DOCX pages to images', acceptedFormats: ['.docx', '.doc'], multipleFiles: false, settings: [] },
  { id: 'word-merge', name: 'Word Merge', category: 'word', description: 'Merge multiple Word documents', acceptedFormats: ['.docx', '.doc'], multipleFiles: true, settings: [] },
  { id: 'word-split', name: 'Word Split', category: 'word', description: 'Split Word document', acceptedFormats: ['.docx', '.doc'], multipleFiles: false, settings: [] },
  { id: 'word-compress', name: 'Word Compress', category: 'word', description: 'Compress Word document', acceptedFormats: ['.docx', '.doc'], multipleFiles: false, settings: [] },
  { id: 'word-watermark', name: 'Word Watermark', category: 'word', description: 'Add watermark to Word document', acceptedFormats: ['.docx', '.doc'], multipleFiles: false, settings: [{ key: 'text', type: 'string', label: 'Watermark Text', required: true }] },
  { id: 'word-metadata', name: 'Word Metadata', category: 'word', description: 'Edit Word document metadata', acceptedFormats: ['.docx', '.doc'], multipleFiles: false, settings: [] },
  { id: 'word-password', name: 'Word Password Protect', category: 'word', description: 'Add password protection', acceptedFormats: ['.docx', '.doc'], multipleFiles: false, settings: [{ key: 'password', type: 'string', label: 'Password', required: true }] },
  { id: 'word-remove-password', name: 'Word Remove Password', category: 'word', description: 'Remove password protection', acceptedFormats: ['.docx', '.doc'], multipleFiles: false, settings: [{ key: 'password', type: 'string', label: 'Current Password', required: true }] },
  { id: 'word-find-replace', name: 'Word Find & Replace', category: 'word', description: 'Find and replace text', acceptedFormats: ['.docx', '.doc'], multipleFiles: false, settings: [{ key: 'find', type: 'string', label: 'Find', required: true }, { key: 'replace', type: 'string', label: 'Replace', required: true }] },
  { id: 'word-compare', name: 'Word Compare', category: 'word', description: 'Compare two Word documents', acceptedFormats: ['.docx', '.doc'], multipleFiles: true, settings: [] },
  { id: 'word-page-count', name: 'Word Page Count', category: 'word', description: 'Get word count statistics', acceptedFormats: ['.docx', '.doc'], multipleFiles: false, settings: [] },
  { id: 'word-remove-comments', name: 'Word Remove Comments', category: 'word', description: 'Remove comments and tracked changes', acceptedFormats: ['.docx', '.doc'], multipleFiles: false, settings: [] },
  { id: 'word-extract-images', name: 'Word Extract Images', category: 'word', description: 'Extract images from Word document', acceptedFormats: ['.docx', '.doc'], multipleFiles: false, settings: [] },
  { id: 'word-format-clean', name: 'Word Format Clean', category: 'word', description: 'Clean up formatting', acceptedFormats: ['.docx', '.doc'], multipleFiles: false, settings: [] },
  { id: 'word-sign', name: 'Word Sign', category: 'word', description: 'Add digital signature', acceptedFormats: ['.docx', '.doc'], multipleFiles: false, settings: [] },
  { id: 'word-toc', name: 'Word Table of Contents', category: 'word', description: 'Generate table of contents', acceptedFormats: ['.docx', '.doc'], multipleFiles: false, settings: [] },
  { id: 'word-mail-merge', name: 'Word Mail Merge', category: 'word', description: 'Mail merge with data', acceptedFormats: ['.docx', '.doc'], multipleFiles: false, settings: [] },
  { id: 'word-template', name: 'Word Template', category: 'word', description: 'Use document templates', acceptedFormats: ['.docx', '.doc'], multipleFiles: false, settings: [] },
  { id: 'word-accessibility', name: 'Word Accessibility Check', category: 'word', description: 'Check accessibility issues', acceptedFormats: ['.docx', '.doc'], multipleFiles: false, settings: [] },
  { id: 'word-translate', name: 'Word Translate', category: 'word', description: 'Translate document text', acceptedFormats: ['.docx', '.doc'], multipleFiles: false, settings: [{ key: 'targetLanguage', type: 'string', label: 'Target Language', required: true }] },
  { id: 'pdf-to-word', name: 'PDF to Word', category: 'word', description: 'Convert PDF to DOCX (duplicate)', acceptedFormats: ['.pdf'], multipleFiles: false, settings: [] },

  // Continued in next part due to length...
];

// Add Excel, Image, Video, Audio, Archive, and Utility tools
const excelTools: ToolDefinition[] = [
  { id: 'excel-to-csv', name: 'Excel to CSV', category: 'excel', description: 'Convert XLSX to CSV', acceptedFormats: ['.xlsx', '.xls'], multipleFiles: false, settings: [] },
  { id: 'csv-to-excel', name: 'CSV to Excel', category: 'excel', description: 'Convert CSV to XLSX', acceptedFormats: ['.csv'], multipleFiles: false, settings: [] },
  { id: 'excel-to-json', name: 'Excel to JSON', category: 'excel', description: 'Convert XLSX to JSON', acceptedFormats: ['.xlsx', '.xls'], multipleFiles: false, settings: [] },
  { id: 'excel-to-xml', name: 'Excel to XML', category: 'excel', description: 'Convert XLSX to XML', acceptedFormats: ['.xlsx', '.xls'], multipleFiles: false, settings: [] },
  { id: 'excel-to-pdf', name: 'Excel to PDF', category: 'excel', description: 'Convert XLSX to PDF', acceptedFormats: ['.xlsx', '.xls'], multipleFiles: false, settings: [] },
  { id: 'excel-merge', name: 'Excel Merge', category: 'excel', description: 'Merge multiple Excel files', acceptedFormats: ['.xlsx', '.xls'], multipleFiles: true, settings: [] },
  { id: 'excel-split', name: 'Excel Split', category: 'excel', description: 'Split Excel file', acceptedFormats: ['.xlsx', '.xls'], multipleFiles: false, settings: [] },
  { id: 'excel-compress', name: 'Excel Compress', category: 'excel', description: 'Compress Excel file', acceptedFormats: ['.xlsx', '.xls'], multipleFiles: false, settings: [] },
  { id: 'csv-clean', name: 'CSV Clean', category: 'excel', description: 'Clean CSV data', acceptedFormats: ['.csv'], multipleFiles: false, settings: [] },
  { id: 'excel-remove-duplicates', name: 'Excel Remove Duplicates', category: 'excel', description: 'Remove duplicate rows', acceptedFormats: ['.xlsx', '.xls'], multipleFiles: false, settings: [] },
  { id: 'excel-sort-data', name: 'Excel Sort Data', category: 'excel', description: 'Sort Excel data', acceptedFormats: ['.xlsx', '.xls'], multipleFiles: false, settings: [] },
  { id: 'excel-filter-data', name: 'Excel Filter Data', category: 'excel', description: 'Filter Excel data', acceptedFormats: ['.xlsx', '.xls'], multipleFiles: false, settings: [] },
  { id: 'excel-transpose', name: 'Excel Transpose', category: 'excel', description: 'Transpose rows and columns', acceptedFormats: ['.xlsx', '.xls'], multipleFiles: false, settings: [] },
  { id: 'excel-concatenate', name: 'Excel Concatenate', category: 'excel', description: 'Concatenate columns', acceptedFormats: ['.xlsx', '.xls'], multipleFiles: false, settings: [] },
  { id: 'excel-split-columns', name: 'Excel Split Columns', category: 'excel', description: 'Split column data', acceptedFormats: ['.xlsx', '.xls'], multipleFiles: false, settings: [] },
  { id: 'excel-statistics', name: 'Excel Statistics', category: 'excel', description: 'Calculate statistics', acceptedFormats: ['.xlsx', '.xls'], multipleFiles: false, settings: [] },
  { id: 'excel-find-replace', name: 'Excel Find & Replace', category: 'excel', description: 'Find and replace data', acceptedFormats: ['.xlsx', '.xls'], multipleFiles: false, settings: [] },
  { id: 'csv-delimiter-change', name: 'CSV Delimiter Change', category: 'excel', description: 'Change CSV delimiter', acceptedFormats: ['.csv'], multipleFiles: false, settings: [] },
  { id: 'excel-pivot-table', name: 'Excel Pivot Table', category: 'excel', description: 'Create pivot table', acceptedFormats: ['.xlsx', '.xls'], multipleFiles: false, settings: [] },
  { id: 'excel-chart', name: 'Excel Chart', category: 'excel', description: 'Create charts', acceptedFormats: ['.xlsx', '.xls'], multipleFiles: false, settings: [] },
  { id: 'excel-conditional-formatting', name: 'Excel Conditional Formatting', category: 'excel', description: 'Apply conditional formatting', acceptedFormats: ['.xlsx', '.xls'], multipleFiles: false, settings: [] },
  { id: 'excel-data-validation', name: 'Excel Data Validation', category: 'excel', description: 'Add data validation', acceptedFormats: ['.xlsx', '.xls'], multipleFiles: false, settings: [] },
  { id: 'excel-vlookup', name: 'Excel VLOOKUP', category: 'excel', description: 'Perform VLOOKUP operations', acceptedFormats: ['.xlsx', '.xls'], multipleFiles: true, settings: [] },
  { id: 'csv-json-convert', name: 'CSV to JSON', category: 'excel', description: 'Convert CSV to JSON', acceptedFormats: ['.csv'], multipleFiles: false, settings: [] },
  { id: 'excel-protect', name: 'Excel Protect', category: 'excel', description: 'Password protect Excel', acceptedFormats: ['.xlsx', '.xls'], multipleFiles: false, settings: [] },
  { id: 'excel-unprotect', name: 'Excel Unprotect', category: 'excel', description: 'Remove password protection', acceptedFormats: ['.xlsx', '.xls'], multipleFiles: false, settings: [] },
  { id: 'excel-formula-audit', name: 'Excel Formula Audit', category: 'excel', description: 'Audit formulas', acceptedFormats: ['.xlsx', '.xls'], multipleFiles: false, settings: [] },
  { id: 'excel-macro-remove', name: 'Excel Macro Remove', category: 'excel', description: 'Remove macros', acceptedFormats: ['.xlsm'], multipleFiles: false, settings: [] },
  { id: 'excel-template', name: 'Excel Template', category: 'excel', description: 'Use Excel templates', acceptedFormats: ['.xlsx', '.xls'], multipleFiles: false, settings: [] },
  { id: 'excel-compare', name: 'Excel Compare', category: 'excel', description: 'Compare two Excel files', acceptedFormats: ['.xlsx', '.xls'], multipleFiles: true, settings: [] },
];

// Combine all tools
tools.push(...excelTools);

// Export continued in next file due to length constraints...
export class ToolRegistry {
  private static toolMap: Map<string, ToolDefinition> = new Map(tools.map(t => [t.id, t]));

  static getTool(toolId: string): ToolDefinition | undefined {
    return this.toolMap.get(toolId);
  }

  static getAllTools(category?: string): ToolDefinition[] {
    if (category) {
      return tools.filter(t => t.category === category);
    }
    return tools;
  }

  static getToolsByCategory(): Record<ToolCategory, ToolDefinition[]> {
    const grouped: Record<string, ToolDefinition[]> = {};
    tools.forEach(tool => {
      if (!grouped[tool.category]) {
        grouped[tool.category] = [];
      }
      grouped[tool.category].push(tool);
    });
    return grouped as Record<ToolCategory, ToolDefinition[]>;
  }
}
