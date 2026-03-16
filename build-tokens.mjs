/**
 * build-tokens.mjs
 * Idox Design System — Style Dictionary build entry point
 *
 * Run with:  node build-tokens.mjs
 * Or via npm: npm run build:tokens
 */

import sd from './style-dictionary.config.mjs';

console.log('🎨 Building Idox design tokens...\n');

try {
  await sd.buildAllPlatforms();
  console.log('\n✅ Token build complete. Output files:');
  console.log('   dist/tokens.css          — CSS custom properties (semantic)');
  console.log('   dist/tokens-full.css     — CSS custom properties (all)');
  console.log('   dist/tailwind-tokens.mjs — Tailwind theme extension');
  console.log('   dist/tokens-flat.json    — Flat resolved JSON');
} catch (err) {
  console.error('\n❌ Token build failed:', err.message);
  process.exit(1);
}
