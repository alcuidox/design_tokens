/**
 * generate-tokens.mjs
 * Idox Design System — Token Build Pipeline
 *
 * Reads primitive.json and semantic.json, resolves all references,
 * and outputs:
 *   dist/tokens.css            — CSS custom properties (semantic layer only)
 *   dist/tokens-full.css       — CSS custom properties (primitive + semantic)
 *   dist/tailwind-tokens.mjs   — Tailwind theme.extend object (ESM)
 *   dist/typography.css        — @layer components typography utility classes
 *
 * Tokens whose key AND value already match a Tailwind default are excluded
 * from tailwind-tokens.mjs to avoid duplicating what Tailwind provides.
 *
 * Run with: node generate-tailwind.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const primitive = JSON.parse(readFileSync('./primitive.json', 'utf8'));
const semantic  = JSON.parse(readFileSync('./semantic.json',  'utf8'));

// ---------------------------------------------------------------------------
// Tailwind v3 defaults — tokens matching both key and value are excluded
// from the Tailwind config output.
// ---------------------------------------------------------------------------
const TAILWIND_DEFAULTS = {
  fontWeight: {
    thin: '100', extralight: '200', light: '300', normal: '400',
    medium: '500', semibold: '600', bold: '700', extrabold: '800', black: '900',
  },
  borderRadius: {
    none: '0px', sm: '0.125rem', DEFAULT: '0.25rem', md: '0.375rem',
    lg: '0.5rem', xl: '0.75rem', '2xl': '1rem', '3xl': '1.5rem', full: '9999px',
  },
};

function isRedundant(scale, key, value) {
  return TAILWIND_DEFAULTS[scale]?.[key] === value;
}

// ---------------------------------------------------------------------------
// Flatten both files into dot-path lookup maps
// ---------------------------------------------------------------------------
function flatten(obj, path = '') {
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('$')) continue;
    const current = path ? `${path}.${k}` : k;
    if (v && typeof v === 'object' && '$value' in v) {
      result[current] = {
        value: v['$value'],
        type: v['$type'] ?? '',
        description: v['$description'] ?? '',
      };
    } else if (v && typeof v === 'object') {
      Object.assign(result, flatten(v, current));
    }
  }
  return result;
}

const primFlat = flatten(primitive);
const semFlat  = flatten(semantic);

// ---------------------------------------------------------------------------
// Resolve {primitive.x.y} references to actual values
// ---------------------------------------------------------------------------
function resolve(value) {
  if (typeof value !== 'string') return value;
  if (value.startsWith('{') && value.endsWith('}')) {
    const ref = value.slice(1, -1);
    return primFlat[ref]?.value ?? value;
  }
  return value;
}

function resolveToken(value) {
  if (typeof value === 'string')                    return resolve(value);
  if (Array.isArray(value))                         return value.map(resolveToken);
  if (typeof value === 'object' && value !== null)  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolve(v)]));
  return value;
}

// ---------------------------------------------------------------------------
// Convert structured shadow objects to CSS box-shadow strings
// ---------------------------------------------------------------------------
function shadowToCSS(shadow) {
  if (Array.isArray(shadow)) return shadow.map(shadowToCSS).join(', ');
  const { x = 0, y = 0, blur = 0, spread = 0, color = 'transparent' } = shadow;
  return `${x}px ${y}px ${blur}px ${spread}px ${color}`;
}

// ---------------------------------------------------------------------------
// Build all output structures in one pass over semantic tokens
// ---------------------------------------------------------------------------
const colors        = {};
const spacing       = {};
const borderRadius  = {};
const borderWidth   = {};
const boxShadow     = {};
const fontSize      = {};
const fontWeight    = {};
const fontFamily    = {};
const letterSpacing = {};
const lineHeight    = {};
const opacity       = {};
const typographyStyles = {};
const skipped = [];

// CSS variable name from a dot-path: 'interactive.default' -> '--interactive-default'
function cssVarName(path) {
  return `--${path.replace(/\./g, '-')}`;
}

// Collect semantic CSS vars: [name, value, description]
const semanticVars = [];

for (const [path, token] of Object.entries(semFlat)) {
  const value = resolveToken(token.value);
  const parts = path.split('.');
  const key   = parts[parts.length - 1];

  // CSS var — skip composite typography objects
  if (token.type !== 'typography') {
    const cssValue = token.type === 'boxShadow'
      ? shadowToCSS(value)
      : (typeof value === 'string' ? value : null);
    if (cssValue !== null) {
      semanticVars.push([cssVarName(path), cssValue, token.description]);
    }
  }

  // Tailwind theme sections
  switch (token.type) {
    case 'color': {
      const [group, ...rest] = parts;
      if (!colors[group]) colors[group] = {};
      colors[group][rest.join('-') || 'DEFAULT'] = value;
      break;
    }
    case 'spacing':
      spacing[key] = value;
      break;
    case 'borderRadius':
      if (isRedundant('borderRadius', key, value)) {
        skipped.push(`borderRadius.${key} (${value})`);
      } else {
        borderRadius[key] = value;
      }
      break;
    case 'borderWidth':
      borderWidth[key] = value;
      break;
    case 'boxShadow':
      boxShadow[key] = shadowToCSS(value);
      break;
    case 'fontSize':
      fontSize[key] = value;
      break;
    case 'fontWeight':
      if (isRedundant('fontWeight', key, value)) {
        skipped.push(`fontWeight.${key} (${value})`);
      } else {
        fontWeight[key] = value;
      }
      break;
    case 'fontFamily':
      fontFamily[key] = value;
      break;
    case 'letterSpacing':
      letterSpacing[key] = value;
      break;
    case 'lineHeight':
      lineHeight[key] = value;
      break;
    case 'opacity':
      opacity[key] = value;
      break;
    case 'typography':
      typographyStyles[key] = value;
      break;
  }
}

// Collect primitive CSS vars
const primitiveVars = [];
for (const [path, token] of Object.entries(primFlat)) {
  if (token.type === 'typography' || typeof token.value === 'object') continue;
  primitiveVars.push([cssVarName(path), token.value, token.description]);
}

// ---------------------------------------------------------------------------
// Shared CSS file header
// ---------------------------------------------------------------------------
const CSS_HEADER = (note) => `/**
 * Idox Design System — CSS Custom Properties${note ? ` (${note})` : ''}
 * Auto-generated from primitive.json + semantic.json. Do not edit manually.
 */\n\n`;

function renderCSSVars(vars) {
  return vars
    .map(([name, value, desc]) => `  ${name}: ${value};${desc ? ` /* ${desc} */` : ''}`)
    .join('\n');
}

mkdirSync('./dist', { recursive: true });

// ---------------------------------------------------------------------------
// 1. dist/tokens.css — semantic layer only
// ---------------------------------------------------------------------------
writeFileSync('./dist/tokens.css',
  `${CSS_HEADER('semantic')}:root {\n${renderCSSVars(semanticVars)}\n}\n`,
  'utf8'
);
console.log('✔︎  dist/tokens.css');

// ---------------------------------------------------------------------------
// 2. dist/tokens-full.css — primitive + semantic
// ---------------------------------------------------------------------------
writeFileSync('./dist/tokens-full.css',
  `${CSS_HEADER('full')}:root {\n${renderCSSVars([...primitiveVars, ...semanticVars])}\n}\n`,
  'utf8'
);
console.log('✔︎  dist/tokens-full.css');

// ---------------------------------------------------------------------------
// 3. dist/tailwind-tokens.mjs
// ---------------------------------------------------------------------------
const theme = Object.fromEntries(
  Object.entries({
    colors, spacing, borderRadius, borderWidth, boxShadow,
    fontSize, fontWeight, fontFamily, letterSpacing, lineHeight, opacity,
  }).filter(([, v]) => Object.keys(v).length > 0)
);

const skippedComment = skipped.length > 0
  ? ` *\n * Tokens excluded (already covered by Tailwind defaults):\n${skipped.map(s => ` *   - ${s}`).join('\n')}\n`
  : '';

writeFileSync('./dist/tailwind-tokens.mjs', `/**
 * Idox Design System — Tailwind Theme Extension
 * Auto-generated from primitive.json + semantic.json. Do not edit manually.
 *
 * Usage in tailwind.config.js:
 *   import idoxTokens from './dist/tailwind-tokens.mjs';
 *   export default { theme: { extend: idoxTokens } };
 *
 * For typography utility classes (.type-h1, .type-body etc.)
 * also import dist/typography.css in your global stylesheet.
${skippedComment} */

export default ${JSON.stringify(theme, null, 2)};
`, 'utf8');
console.log('✔︎  dist/tailwind-tokens.mjs');
if (skipped.length > 0) {
  console.log(`    ↳ Skipped ${skipped.length} redundant token(s) already in Tailwind defaults:`);
  skipped.forEach(s => console.log(`      - ${s}`));
}

// ---------------------------------------------------------------------------
// 4. dist/typography.css — @layer components classes
// ---------------------------------------------------------------------------
function styleToCSS(style, indent = '  ') {
  const props = [];
  if (style.fontFamily)    props.push(`${indent}font-family: ${style.fontFamily};`);
  if (style.fontSize)      props.push(`${indent}font-size: ${style.fontSize};`);
  if (style.fontWeight)    props.push(`${indent}font-weight: ${style.fontWeight};`);
  if (style.lineHeight)    props.push(`${indent}line-height: ${style.lineHeight};`);
  if (style.letterSpacing) props.push(`${indent}letter-spacing: ${style.letterSpacing};`);
  return props.join('\n');
}

const typographyClasses = Object.entries(typographyStyles)
  .map(([name, style]) => `.type-${name} {\n${styleToCSS(resolveToken(style))}\n}`)
  .join('\n\n');

writeFileSync('./dist/typography.css', `/**
 * Idox Design System — Typography Utility Classes
 * Auto-generated from primitive.json + semantic.json. Do not edit manually.
 *
 * Import in your global stylesheet:
 *   @import './dist/typography.css';
 *
 * Usage:
 *   <h1 class="type-h1">Heading</h1>
 *   <p class="type-body">Body copy</p>
 *   <span class="type-caption">Caption text</span>
 */

@layer components {

${typographyClasses}

}
`, 'utf8');
console.log('✔︎  dist/typography.css');

// ---------------------------------------------------------------------------
// 5. dist/component-tokens.css
//    Each component gets its own block of CSS custom properties that
//    reference semantic tokens. These are the component's theming API —
//    consumers can override individual component tokens without touching
//    the semantic layer.
//
//    Naming convention: --{component}-{variant}-{property}-{state}
//    e.g. --btn-primary-bg-hover
// ---------------------------------------------------------------------------

const componentTokens = `/**
 * Idox Design System — Component Tokens
 * Auto-generated from primitive.json + semantic.json. Do not edit manually.
 *
 * Import in your global stylesheet after tokens.css:
 *   @import '@tokens/component-tokens.css';
 */

/* ============================================================
   BUTTON
   ============================================================

   Usage in component:
     background-color: var(--btn-primary-bg);
     color:            var(--btn-primary-text);

   Override example (e.g. in a marketing context):
     .marketing-page {
       --btn-primary-bg: var(--brand-default);
     }
   ============================================================ */

:root {

  /* --- Shared button tokens (size-independent) --- */
  --btn-font-family:      var(--typography-fontFamily-default);
  --btn-font-weight:      var(--typography-weight-bold);
  --btn-letter-spacing:   var(--typography-letterSpacing-caps);
  --btn-line-height:      var(--typography-lineHeight-body);
  --btn-border-radius:    var(--borderRadius-md);
  --btn-border-width:     var(--borderWidth-hairline);
  --btn-focus-ring:       var(--interactive-border-focus);

  /* --- Size: small --- */
  --btn-sm-font-size:     var(--typography-size-small);
  --btn-sm-padding-x:     var(--spacing-sm);
  --btn-sm-padding-y:     var(--spacing-xs);
  --btn-sm-height:        2rem;

  /* --- Size: medium (default) --- */
  --btn-md-font-size:     var(--typography-size-body);
  --btn-md-padding-x:     var(--spacing-md);
  --btn-md-padding-y:     var(--spacing-xs);
  --btn-md-height:        2.5rem;

  /* --- Size: large --- */
  --btn-lg-font-size:     var(--typography-size-body);
  --btn-lg-padding-x:     var(--spacing-lg);
  --btn-lg-padding-y:     var(--spacing-sm);
  --btn-lg-height:        3rem;

  /* --- Variant: primary --- */
  --btn-primary-bg:          var(--interactive-default);
  --btn-primary-bg-hover:    var(--interactive-hovered);
  --btn-primary-bg-active:   var(--interactive-pressed);
  --btn-primary-bg-disabled: var(--interactive-disabled);
  --btn-primary-text:        var(--interactive-on-interactive);
  --btn-primary-border:      transparent;

  /* --- Variant: secondary --- */
  --btn-secondary-bg:          transparent;
  --btn-secondary-bg-hover:    var(--interactive-subtle-hovered);
  --btn-secondary-bg-active:   var(--interactive-subtle);
  --btn-secondary-bg-disabled: transparent;
  --btn-secondary-text:        var(--interactive-default);
  --btn-secondary-border:      var(--interactive-default);

  /* --- Variant: danger --- */
  --btn-danger-bg:          var(--danger-default);
  --btn-danger-bg-hover:    var(--danger-hovered);
  --btn-danger-bg-active:   var(--danger-pressed);
  --btn-danger-bg-disabled: var(--danger-disabled);
  --btn-danger-text:        var(--danger-on-danger);
  --btn-danger-border:      transparent;

  /* --- Variant: ghost --- */
  --btn-ghost-bg:          transparent;
  --btn-ghost-bg-hover:    var(--interactive-subtle);
  --btn-ghost-bg-active:   var(--interactive-subtle-hovered);
  --btn-ghost-bg-disabled: transparent;
  --btn-ghost-text:        var(--interactive-default);
  --btn-ghost-border:      transparent;

  /* --- Disabled state (shared across all variants) --- */
  --btn-disabled-text:     var(--text-disabled);
  --btn-disabled-opacity:  var(--opacity-disabled);

}
`;

writeFileSync('./dist/component-tokens.css', componentTokens, 'utf8');
console.log('✔︎  dist/component-tokens.css');
