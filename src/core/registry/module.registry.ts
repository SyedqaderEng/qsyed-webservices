/**
 * Module Registry
 * Central registry for all processing modules
 */

import { ProcessingModule, FileMeta, ValidationResult } from '../interfaces/module.interface';
import { PipelineStep } from '../interfaces/pipeline.interface';

interface ModuleInfo {
  name: string;
  category: string;
  version: string;
  description: string;
  capabilities: any;
}

class ModuleRegistry {
  private modules: Map<string, ProcessingModule> = new Map();

  /**
   * Register a new module
   */
  register(module: ProcessingModule): void {
    if (this.modules.has(module.name)) {
      throw new Error(`Module already registered: ${module.name}`);
    }

    console.log(`[Registry] Registered module: ${module.name} v${module.version}`);
    this.modules.set(module.name, module);
  }

  /**
   * Get a module by name
   */
  get(moduleName: string): ProcessingModule | undefined {
    return this.modules.get(moduleName);
  }

  /**
   * Check if module exists
   */
  has(moduleName: string): boolean {
    return this.modules.has(moduleName);
  }

  /**
   * List all registered modules
   */
  list(): ModuleInfo[] {
    return Array.from(this.modules.values()).map(module => ({
      name: module.name,
      category: module.category,
      version: module.version,
      description: module.description,
      capabilities: module.capabilities(),
    }));
  }

  /**
   * List modules by category
   */
  listByCategory(category: string): ModuleInfo[] {
    return this.list().filter(m => m.category === category);
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    const categories = new Set<string>();
    this.modules.forEach(module => {
      categories.add(module.category);
    });
    return Array.from(categories).sort();
  }

  /**
   * Validate an entire pipeline
   */
  validatePipeline(pipeline: PipelineStep[], fileMeta: FileMeta): ValidationResult {
    if (!pipeline || pipeline.length === 0) {
      return {
        valid: false,
        error: 'Pipeline cannot be empty',
      };
    }

    if (pipeline.length > 10) {
      return {
        valid: false,
        error: 'Pipeline cannot exceed 10 steps',
      };
    }

    for (let i = 0; i < pipeline.length; i++) {
      const step = pipeline[i];

      // Check module exists
      const module = this.get(step.module);
      if (!module) {
        return {
          valid: false,
          error: `Module not found: ${step.module}`,
          details: { step: i + 1 },
        };
      }

      // Check action exists
      const capabilities = module.capabilities();
      if (!capabilities.actions[step.action]) {
        return {
          valid: false,
          error: `Action not found: ${step.action} in module ${step.module}`,
          details: {
            step: i + 1,
            availableActions: Object.keys(capabilities.actions),
          },
        };
      }

      // Validate options
      const validation = module.validate(step.options, fileMeta);
      if (!validation.valid) {
        return {
          valid: false,
          error: validation.error,
          details: {
            step: i + 1,
            module: step.module,
            action: step.action,
            ...validation.details,
          },
        };
      }
    }

    return { valid: true };
  }

  /**
   * Get total estimated cost for pipeline
   */
  estimatePipelineCost(pipeline: PipelineStep[], fileMeta: FileMeta): number {
    let totalCost = 0;

    for (const step of pipeline) {
      const module = this.get(step.module);
      if (module) {
        totalCost += module.estimateCost(step.action, step.options, fileMeta);
      }
    }

    return totalCost;
  }

  /**
   * Get estimated duration for pipeline
   */
  estimatePipelineDuration(pipeline: PipelineStep[]): number {
    let totalDuration = 0;

    for (const step of pipeline) {
      const module = this.get(step.module);
      if (module) {
        const capabilities = module.capabilities();
        const actionDef = capabilities.actions[step.action];
        if (actionDef) {
          totalDuration += actionDef.estimatedDuration;
        }
      }
    }

    return totalDuration;
  }

  /**
   * Check if pipeline can run synchronously
   */
  canRunSync(pipeline: PipelineStep[], estimatedDuration: number): boolean {
    // Only run sync if:
    // 1. Estimated duration < 5 seconds
    // 2. All actions support sync execution
    if (estimatedDuration > 5) {
      return false;
    }

    for (const step of pipeline) {
      const module = this.get(step.module);
      if (module) {
        const capabilities = module.capabilities();
        const actionDef = capabilities.actions[step.action];
        if (actionDef && !actionDef.sync) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Get module count
   */
  count(): number {
    return this.modules.size;
  }

  /**
   * Clear all modules (for testing)
   */
  clear(): void {
    this.modules.clear();
  }
}

// Export singleton instance
export const moduleRegistry = new ModuleRegistry();
