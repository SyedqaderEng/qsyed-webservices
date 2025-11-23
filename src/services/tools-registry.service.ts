/**
 * Tools Registry Service
 * Loads tools from configuration and provides discovery/validation
 */

import fs from 'fs';
import path from 'path';
import { moduleRegistry } from '../core/registry/module.registry';

interface ToolParam {
  type: string;
  required?: boolean;
  default?: any;
  enum?: any[];
  min?: number;
  max?: number;
  description: string;
}

interface ToolDefinition {
  displayName: string;
  category: string;
  engine: string;
  module: string;
  action: string;
  description: string;
  params: { [key: string]: ToolParam };
  inputTypes: string[];
  outputType: string;
  batchSupport: boolean;
  chainable: boolean;
  estimatedDuration: number;
  multipleFiles?: boolean;
}

interface ToolsConfig {
  version: string;
  description: string;
  categories: string[];
  tools: { [toolName: string]: ToolDefinition };
  pipelines?: { [pipelineName: string]: any };
}

class ToolsRegistryService {
  private config: ToolsConfig | null = null;
  private configPath: string;

  constructor() {
    this.configPath = path.join(__dirname, '../config/tools-registry.json');
  }

  /**
   * Load tools configuration from JSON
   */
  loadConfig(): void {
    try {
      const configData = fs.readFileSync(this.configPath, 'utf-8');
      this.config = JSON.parse(configData);
      console.log(`[Tools Registry] Loaded ${Object.keys(this.config!.tools).length} tools from config`);
    } catch (error: any) {
      console.error('[Tools Registry] Failed to load tools config:', error.message);
      throw new Error('Failed to load tools configuration');
    }
  }

  /**
   * Get all available tools
   */
  getAllTools(): { [toolName: string]: ToolDefinition } {
    if (!this.config) {
      this.loadConfig();
    }
    return this.config!.tools;
  }

  /**
   * Get tool by name
   */
  getTool(toolName: string): ToolDefinition | undefined {
    if (!this.config) {
      this.loadConfig();
    }
    return this.config!.tools[toolName];
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category: string): { [toolName: string]: ToolDefinition } {
    if (!this.config) {
      this.loadConfig();
    }

    const tools: { [toolName: string]: ToolDefinition } = {};
    for (const [toolName, tool] of Object.entries(this.config!.tools)) {
      if (tool.category === category) {
        tools[toolName] = tool;
      }
    }
    return tools;
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    if (!this.config) {
      this.loadConfig();
    }
    return this.config!.categories;
  }

  /**
   * Check if tool exists
   */
  hasTool(toolName: string): boolean {
    if (!this.config) {
      this.loadConfig();
    }
    return toolName in this.config!.tools;
  }

  /**
   * Validate tool parameters against schema
   */
  validateParams(toolName: string, params: any): { valid: boolean; error?: string } {
    const tool = this.getTool(toolName);
    if (!tool) {
      return { valid: false, error: `Tool not found: ${toolName}` };
    }

    // Check required params
    for (const [paramName, paramDef] of Object.entries(tool.params)) {
      if (paramDef.required && params[paramName] === undefined) {
        return {
          valid: false,
          error: `Missing required parameter: ${paramName}`,
        };
      }

      // Validate enum values
      if (params[paramName] !== undefined && paramDef.enum) {
        if (!paramDef.enum.includes(params[paramName])) {
          return {
            valid: false,
            error: `Invalid value for ${paramName}. Must be one of: ${paramDef.enum.join(', ')}`,
          };
        }
      }

      // Validate min/max for numbers
      if (params[paramName] !== undefined && paramDef.type === 'number') {
        if (paramDef.min !== undefined && params[paramName] < paramDef.min) {
          return {
            valid: false,
            error: `${paramName} must be >= ${paramDef.min}`,
          };
        }
        if (paramDef.max !== undefined && params[paramName] > paramDef.max) {
          return {
            valid: false,
            error: `${paramName} must be <= ${paramDef.max}`,
          };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Convert tool request to pipeline format
   */
  toolToPipeline(toolName: string, params: any): any {
    const tool = this.getTool(toolName);
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    // Apply default values
    const finalParams: any = {};
    for (const [paramName, paramDef] of Object.entries(tool.params)) {
      if (params[paramName] !== undefined) {
        finalParams[paramName] = params[paramName];
      } else if (paramDef.default !== undefined) {
        finalParams[paramName] = paramDef.default;
      }
    }

    return {
      module: tool.module,
      action: tool.action,
      options: finalParams,
    };
  }

  /**
   * Get predefined pipeline
   */
  getPipeline(pipelineName: string): any {
    if (!this.config) {
      this.loadConfig();
    }
    return this.config!.pipelines?.[pipelineName];
  }

  /**
   * Get tool statistics
   */
  getStats(): {
    totalTools: number;
    byCategory: { [category: string]: number };
    batchSupported: number;
    chainable: number;
  } {
    if (!this.config) {
      this.loadConfig();
    }

    const byCategory: { [category: string]: number } = {};
    let batchSupported = 0;
    let chainable = 0;

    for (const tool of Object.values(this.config!.tools)) {
      byCategory[tool.category] = (byCategory[tool.category] || 0) + 1;
      if (tool.batchSupport) batchSupported++;
      if (tool.chainable) chainable++;
    }

    return {
      totalTools: Object.keys(this.config!.tools).length,
      byCategory,
      batchSupported,
      chainable,
    };
  }

  /**
   * Search tools by keyword
   */
  searchTools(keyword: string): { [toolName: string]: ToolDefinition } {
    if (!this.config) {
      this.loadConfig();
    }

    const results: { [toolName: string]: ToolDefinition } = {};
    const lowerKeyword = keyword.toLowerCase();

    for (const [toolName, tool] of Object.entries(this.config!.tools)) {
      if (
        toolName.toLowerCase().includes(lowerKeyword) ||
        tool.displayName.toLowerCase().includes(lowerKeyword) ||
        tool.description.toLowerCase().includes(lowerKeyword) ||
        tool.category.toLowerCase().includes(lowerKeyword)
      ) {
        results[toolName] = tool;
      }
    }

    return results;
  }

  /**
   * Check if tool supports input MIME type
   */
  supportsInputType(toolName: string, mimeType: string): boolean {
    const tool = this.getTool(toolName);
    if (!tool) return false;

    return (
      tool.inputTypes.includes(mimeType) ||
      tool.inputTypes.includes('*/*')
    );
  }

  /**
   * Get recommended tools for file type
   */
  getToolsForFileType(mimeType: string): { [toolName: string]: ToolDefinition } {
    if (!this.config) {
      this.loadConfig();
    }

    const results: { [toolName: string]: ToolDefinition } = {};

    for (const [toolName, tool] of Object.entries(this.config!.tools)) {
      if (this.supportsInputType(toolName, mimeType)) {
        results[toolName] = tool;
      }
    }

    return results;
  }
}

// Export singleton instance
export const toolsRegistry = new ToolsRegistryService();
