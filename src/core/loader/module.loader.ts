/**
 * Module Loader
 * Loads and registers all processing modules at startup
 */

import { moduleRegistry } from '../registry/module.registry';
import { PdfSplitModule } from '../../modules/pdf/pdf-split.module';
// Import other modules here as they are created

export function loadModules(): void {
  console.log('[Module Loader] Loading processing modules...');

  // Register PDF modules
  moduleRegistry.register(new PdfSplitModule());
  // moduleRegistry.register(new PdfMergeModule());
  // moduleRegistry.register(new PdfCompressModule());
  // ... more modules

  // Register Image modules
  // moduleRegistry.register(new ImageResizeModule());
  // ... more modules

  // Register Video modules
  // moduleRegistry.register(new VideoTrimModule());
  // ... more modules

  const moduleCount = moduleRegistry.count();
  const categories = moduleRegistry.getCategories();

  console.log(`[Module Loader] Loaded ${moduleCount} modules across ${categories.length} categories`);
  console.log(`[Module Loader] Categories: ${categories.join(', ')}`);

  // Log registered modules
  const modules = moduleRegistry.list();
  modules.forEach(module => {
    const actionCount = Object.keys(module.capabilities.actions).length;
    console.log(`  - ${module.name} (${module.category}): ${actionCount} actions`);
  });
}
