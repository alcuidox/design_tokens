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
// 1. dist/tokens.css — written after component tokens are collected (see below)
// ---------------------------------------------------------------------------

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

writeFileSync('./tailwind.config.js',
`/**
 * Idox Design System — Tailwind Configuration
 * Auto-generated from primitive.json + semantic.json. Do not edit manually.
 * Regenerate by running: npm run build:tokens
 *
 * For typography utility classes (.type-h1, .type-body etc.)
 * import dist/tokens.css in your global stylesheet.
${skippedComment} */

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './.storybook/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: ${JSON.stringify(theme, null, 2)},
  },
  plugins: [],
};
`, 'utf8');
// Also keep dist/tailwind-tokens.mjs for consumers who want just the theme object
writeFileSync('./dist/tailwind-tokens.mjs', `export default ${JSON.stringify(theme, null, 2)};
`, 'utf8');
console.log('✔︎  tailwind.config.js');
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
//    Read from component.json (DTCG format), resolve all references against
//    the semantic layer, and output CSS custom properties.
//
//    Reference resolution order:
//      component.json refs → semantic tokens → primitive tokens
//
//    Naming convention: --{component}-{path...}
//    e.g. button.variant.primary.bg → --btn-variant-primary-bg
//         button.shared.font-weight → --btn-shared-font-weight
// ---------------------------------------------------------------------------

const component = JSON.parse(readFileSync('./component.json', 'utf8'));
const compFlat  = flatten(component);

// Build a combined lookup for resolving component refs:
// component refs can point to semantic tokens, which can point to primitives
const semResolved = {};
for (const [path, token] of Object.entries(semFlat)) {
  semResolved[path] = resolveToken(token.value);
}

function resolveComponentValue(value) {
  if (typeof value !== 'string') return value;
  if (value.startsWith('{') && value.endsWith('}')) {
    const ref = value.slice(1, -1);
    // Try semantic layer first, then primitive
    if (semResolved[ref] !== undefined) return semResolved[ref];
    if (primFlat[ref]?.value !== undefined) return primFlat[ref].value;
    return value; // unresolved
  }
  return value;
}

// Generate CSS variable name from component token path
// button.variant.primary.bg → --btn-variant-primary-bg
function compCssVarName(path) {
  const parts = path.split('.');
  const component = parts[0]; // e.g. 'button'
  const rest = parts.slice(1); // e.g. ['variant', 'primary', 'bg']

  // Abbreviate known component names
  const abbrev = { button: 'btn' };
  const prefix = abbrev[component] ?? component;

  return `--${prefix}-${rest.join('-')}`;
}

// Build component CSS vars grouped by component
const componentGroups = {};

for (const [path, token] of Object.entries(compFlat)) {
  const resolvedValue = resolveComponentValue(token.value);
  if (resolvedValue === null || typeof resolvedValue === 'object') continue;

  const topLevel = path.split('.')[0]; // 'button'
  if (!componentGroups[topLevel]) componentGroups[topLevel] = [];

  componentGroups[topLevel].push({
    name: compCssVarName(path),
    value: resolvedValue,
    description: token.description,
  });
}

// Render component token CSS
const componentBlockHeader = (name) => {
  const bar = '='.repeat(60);
  const upper = name.toUpperCase();
  return `/* ${bar}\n   ${upper}\n   ${bar} */`;
};

const componentCSS = Object.entries(componentGroups)
  .map(([name, vars]) => {
    const varLines = vars
      .map(({ name: n, value, description }) =>
        `  ${n}: ${value};${description ? ` /* ${description} */` : ''}`
      )
      .join('\n');
    return `${componentBlockHeader(name)}\n\n:root {\n${varLines}\n}`;
  })
  .join('\n\n');

// Build component vars array for bundling into tokens.css
const componentVars = [];
for (const [topLevel, vars] of Object.entries(componentGroups)) {
  for (const { name, value, description } of vars) {
    componentVars.push([name, value, description]);
  }
}

// ---------------------------------------------------------------------------
// 1. dist/tokens.css — semantic + component tokens bundled together
// ---------------------------------------------------------------------------
writeFileSync('./dist/tokens.css', `/**
 * Idox Design System — CSS Custom Properties
 * Auto-generated from primitive.json + semantic.json + component.json. Do not edit manually.
 *
 * Contains:
 *   - Semantic tokens  (colours, spacing, typography, effects)
 *   - Component tokens (button variants, sizes, shared properties)
 */

:root {
${renderCSSVars(semanticVars)}
}

/* Component tokens */
:root {
${renderCSSVars(componentVars)}
}
`, 'utf8');
console.log('✔︎  dist/tokens.css');

// Also keep dist/component-tokens.css as a standalone file for consumers
// who only want component tokens (e.g. UNIFACE, partial adoption)
writeFileSync('./dist/component-tokens.css', `/**
 * Idox Design System — Component Tokens (standalone)
 * Auto-generated from component.json. Do not edit manually.
 * Note: These tokens are already bundled into dist/tokens.css.
 * Only import this file if you need component tokens without semantic tokens.
 */

${componentCSS}
`, 'utf8');
console.log('✔︎  dist/component-tokens.css');

// ---------------------------------------------------------------------------
// 6. dist/usys.ini
//    UNIFACE system initialisation file fragment.
//    Contains [application], [screen] (logical fonts), and a [widgets]
//    skeleton pre-populated with design token values.
//
//    Colour conversion: web RGB hex → UNIFACE BGR hex
//    Font size conversion: rem × 12 = pt (rounded to nearest 0.5)
//
//    IMPORTANT: This is a fragment — merge with your application's
//    existing usys.ini. Widget names in [widgets] are placeholders;
//    replace with your application's actual logical widget names.
// ---------------------------------------------------------------------------

// Convert RGB hex (#RRGGBB) to UNIFACE BGR hex (#BBGGRR)
function rgbToBgr(hex) {
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex; // pass through if not standard hex
  const r = h.slice(0, 2);
  const g = h.slice(2, 4);
  const b = h.slice(4, 6);
  return `0x${b}${g}${r}`.toUpperCase();
}

// Convert rem string to pt (rounded to nearest 0.5)
function remToPt(rem) {
  const value = parseFloat(rem);
  const pt = value * 12;
  return Math.round(pt * 2) / 2; // round to nearest 0.5
}

// Map font weight number to UNIFACE style string
function weightToStyle(weight) {
  const w = parseInt(weight);
  if (w >= 700) return 'Bold';
  if (w >= 600) return 'SemiBold';
  if (w >= 500) return 'Medium';
  return 'Regular';
}

// Get resolved semantic colour as BGR
function semColourBgr(path) {
  const token = semFlat[path];
  if (!token) return null;
  const resolved = resolveToken(token.value);
  if (typeof resolved === 'string' && resolved.startsWith('#')) {
    return rgbToBgr(resolved);
  }
  return null;
}

// Get resolved primitive font value
function primFont(path) {
  const token = primFlat[path];
  return token ? token.value : null;
}

// Extract font family name (first value before comma)
function fontName(fontStack) {
  return fontStack ? fontStack.split(',')[0].trim() : 'DM Sans';
}

// Resolve font sizes
const bodyPt    = remToPt(resolveToken(semFlat['typography.size.body']?.value    ?? '1rem'));
const smallPt   = remToPt(resolveToken(semFlat['typography.size.small']?.value   ?? '0.875rem'));
const captionPt = remToPt(resolveToken(semFlat['typography.size.caption']?.value ?? '0.75rem'));
const h1Pt      = remToPt(resolveToken(semFlat['typography.size.h1']?.value      ?? '2.25rem'));
const h2Pt      = remToPt(resolveToken(semFlat['typography.size.h2']?.value      ?? '1.875rem'));
const h3Pt      = remToPt(resolveToken(semFlat['typography.size.h3']?.value      ?? '1.5rem'));
const h4Pt      = remToPt(resolveToken(semFlat['typography.size.h4']?.value      ?? '1.25rem'));
const h5Pt      = remToPt(resolveToken(semFlat['typography.size.h5']?.value      ?? '1.125rem'));
const h6Pt      = remToPt(resolveToken(semFlat['typography.size.h6']?.value      ?? '1rem'));

const sansFontStack = resolveToken(semFlat['typography.fontFamily.default']?.value ?? 'DM Sans, sans-serif');
const sansFont      = fontName(sansFontStack);

const weightBold     = weightToStyle(resolveToken(semFlat['typography.weight.bold']?.value     ?? '700'));
const weightSemibold = weightToStyle(resolveToken(semFlat['typography.weight.semibold']?.value ?? '600'));
const weightMedium   = weightToStyle(resolveToken(semFlat['typography.weight.medium']?.value   ?? '500'));
const weightRegular  = weightToStyle(resolveToken(semFlat['typography.weight.regular']?.value  ?? '400'));

// Colour values in BGR
const colours = {
  // Surfaces
  surfacePage:     semColourBgr('surface.page'),
  surfaceDefault:  semColourBgr('surface.default'),
  surfaceDisabled: semColourBgr('surface.disabled'),
  surfaceInverse:  semColourBgr('surface.inverse'),

  // Text
  textPrimary:   semColourBgr('text.primary'),
  textSecondary: semColourBgr('text.secondary'),
  textTertiary:  semColourBgr('text.tertiary'),
  textDisabled:  semColourBgr('text.disabled'),
  textInverse:   semColourBgr('text.inverse'),
  textBrand:     semColourBgr('text.brand'),

  // Interactive
  interactiveDefault:  semColourBgr('interactive.default'),
  interactiveHovered:  semColourBgr('interactive.hovered'),
  interactivePressed:  semColourBgr('interactive.pressed'),
  interactiveDisabled: semColourBgr('interactive.disabled'),
  interactiveOnInt:    semColourBgr('interactive.on-interactive'),
  interactiveFocus:    semColourBgr('interactive.border-focus'),
  interactiveSubtle:   semColourBgr('interactive.subtle'),

  // Borders
  borderDefault: semColourBgr('border.default'),
  borderStrong:  semColourBgr('border.strong'),
  borderDisabled: semColourBgr('border.disabled'),

  // Brand
  brandDefault: semColourBgr('brand.default'),

  // Status
  successDefault: semColourBgr('success.default'),
  successText:    semColourBgr('success.text'),
  successSubtle:  semColourBgr('success.subtle'),
  dangerDefault:  semColourBgr('danger.default'),
  dangerText:     semColourBgr('danger.text'),
  dangerSubtle:   semColourBgr('danger.subtle'),
  warningDefault: semColourBgr('warning.default'),
  warningText:    semColourBgr('warning.text'),
  warningSubtle:  semColourBgr('warning.subtle'),
  infoDefault:    semColourBgr('info.default'),
  infoText:       semColourBgr('info.text'),
  infoSubtle:     semColourBgr('info.subtle'),
};

const usysIni = `; =============================================================================
; Idox Design System — UNIFACE usys.ini fragment
; Auto-generated from semantic.json + component.json. Do not edit manually.
;
; USAGE:
;   Merge this file into your application's usys.ini.
;   Replace placeholder widget names (e.g. IDF_BUTTON_PRIMARY) with your
;   application's actual logical widget names.
;
; COLOUR FORMAT: BGR hex (UNIFACE convention, reversed from web RGB)
; FONT SIZES:    Points (pt), converted from rem at 16px base
; =============================================================================

; =============================================================================
; [application]
; Global application window background colour
; =============================================================================
[application]
background=${colours.surfacePage}

; =============================================================================
; [screen]
; Logical font definitions.
; Format: name=Family,Charset,Size,Style
; Charset: Western = standard Latin character set
; =============================================================================
[screen]
; --- Body / UI fonts ---
font.body=${sansFont},Western,${bodyPt},${weightRegular}
font.body.medium=${sansFont},Western,${bodyPt},${weightMedium}
font.body.semibold=${sansFont},Western,${bodyPt},${weightSemibold}
font.body.bold=${sansFont},Western,${bodyPt},${weightBold}

; --- Small / caption fonts ---
font.small=${sansFont},Western,${smallPt},${weightRegular}
font.small.bold=${sansFont},Western,${smallPt},${weightBold}
font.caption=${sansFont},Western,${captionPt},${weightRegular}

; --- Heading fonts ---
font.h1=${sansFont},Western,${h1Pt},${weightBold}
font.h2=${sansFont},Western,${h2Pt},${weightBold}
font.h3=${sansFont},Western,${h3Pt},${weightBold}
font.h4=${sansFont},Western,${h4Pt},${weightBold}
font.h5=${sansFont},Western,${h5Pt},${weightBold}
font.h6=${sansFont},Western,${h6Pt},${weightBold}

; =============================================================================
; [colours]
; Named colour palette for reference in widget definitions below.
; These map directly to semantic design tokens.
; =============================================================================
[colours]
; --- Surfaces ---
colour.surface.page=${colours.surfacePage}
colour.surface.default=${colours.surfaceDefault}
colour.surface.disabled=${colours.surfaceDisabled}
colour.surface.inverse=${colours.surfaceInverse}

; --- Text ---
colour.text.primary=${colours.textPrimary}
colour.text.secondary=${colours.textSecondary}
colour.text.tertiary=${colours.textTertiary}
colour.text.disabled=${colours.textDisabled}
colour.text.inverse=${colours.textInverse}
colour.text.brand=${colours.textBrand}

; --- Interactive ---
colour.interactive.default=${colours.interactiveDefault}
colour.interactive.hovered=${colours.interactiveHovered}
colour.interactive.pressed=${colours.interactivePressed}
colour.interactive.disabled=${colours.interactiveDisabled}
colour.interactive.on-interactive=${colours.interactiveOnInt}
colour.interactive.focus=${colours.interactiveFocus}
colour.interactive.subtle=${colours.interactiveSubtle}

; --- Borders ---
colour.border.default=${colours.borderDefault}
colour.border.strong=${colours.borderStrong}
colour.border.disabled=${colours.borderDisabled}

; --- Brand ---
colour.brand.default=${colours.brandDefault}

; --- Status ---
colour.success.default=${colours.successDefault}
colour.success.text=${colours.successText}
colour.success.subtle=${colours.successSubtle}
colour.danger.default=${colours.dangerDefault}
colour.danger.text=${colours.dangerText}
colour.danger.subtle=${colours.dangerSubtle}
colour.warning.default=${colours.warningDefault}
colour.warning.text=${colours.warningText}
colour.warning.subtle=${colours.warningSubtle}
colour.info.default=${colours.infoDefault}
colour.info.text=${colours.infoText}
colour.info.subtle=${colours.infoSubtle}

; =============================================================================
; [widgets]
; Widget style definitions.
; IMPORTANT: Replace IDF_* placeholder names with your application's actual
; logical widget names. Confirm exact property names with your developer
; as these vary between UNIFACE versions.
; =============================================================================
[widgets]

; --- Default text / label ---
IDF_LABEL
  forecolor=${colours.textPrimary}
  backcolor=${colours.surfacePage}
  font=font.body

; --- Secondary / muted label ---
IDF_LABEL_SECONDARY
  forecolor=${colours.textSecondary}
  backcolor=${colours.surfacePage}
  font=font.body

; --- Disabled label ---
IDF_LABEL_DISABLED
  forecolor=${colours.textDisabled}
  backcolor=${colours.surfacePage}
  font=font.body

; --- Heading styles ---
IDF_HEADING_1
  forecolor=${colours.textPrimary}
  backcolor=${colours.surfacePage}
  font=font.h1

IDF_HEADING_2
  forecolor=${colours.textPrimary}
  backcolor=${colours.surfacePage}
  font=font.h2

IDF_HEADING_3
  forecolor=${colours.textPrimary}
  backcolor=${colours.surfacePage}
  font=font.h3

; --- Input / edit field ---
IDF_INPUT
  forecolor=${colours.textPrimary}
  backcolor=${colours.surfaceDefault}
  bordercolor=${colours.borderStrong}
  font=font.body

IDF_INPUT_DISABLED
  forecolor=${colours.textDisabled}
  backcolor=${colours.surfaceDisabled}
  bordercolor=${colours.borderDisabled}
  font=font.body

IDF_INPUT_FOCUS
  forecolor=${colours.textPrimary}
  backcolor=${colours.surfaceDefault}
  bordercolor=${colours.interactiveFocus}
  font=font.body

; --- Primary button ---
IDF_BUTTON_PRIMARY
  forecolor=${colours.interactiveOnInt}
  backcolor=${colours.interactiveDefault}
  font=font.body.bold

IDF_BUTTON_PRIMARY_HOVER
  forecolor=${colours.interactiveOnInt}
  backcolor=${colours.interactiveHovered}
  font=font.body.bold

IDF_BUTTON_PRIMARY_ACTIVE
  forecolor=${colours.interactiveOnInt}
  backcolor=${colours.interactivePressed}
  font=font.body.bold

IDF_BUTTON_PRIMARY_DISABLED
  forecolor=${colours.textDisabled}
  backcolor=${colours.borderDefault}
  font=font.body.bold

; --- Secondary button ---
IDF_BUTTON_SECONDARY
  forecolor=${colours.textPrimary}
  backcolor=${colours.surfaceDisabled}
  bordercolor=${colours.borderStrong}
  font=font.body

IDF_BUTTON_SECONDARY_HOVER
  forecolor=${colours.textPrimary}
  backcolor=${colours.interactiveSubtle}
  bordercolor=${colours.borderStrong}
  font=font.body

IDF_BUTTON_SECONDARY_DISABLED
  forecolor=${colours.textDisabled}
  backcolor=${colours.surfaceDisabled}
  bordercolor=${colours.borderDisabled}
  font=font.body

; --- Status colours (for badges, alerts, inline text) ---
IDF_STATUS_SUCCESS
  forecolor=${colours.successText}
  backcolor=${colours.successSubtle}
  font=font.body

IDF_STATUS_DANGER
  forecolor=${colours.dangerText}
  backcolor=${colours.dangerSubtle}
  font=font.body

IDF_STATUS_WARNING
  forecolor=${colours.warningText}
  backcolor=${colours.warningSubtle}
  font=font.body

IDF_STATUS_INFO
  forecolor=${colours.infoText}
  backcolor=${colours.infoSubtle}
  font=font.body
`;

writeFileSync('./dist/usys.ini', usysIni, 'utf8');
console.log('✔︎  dist/usys.ini');

// ---------------------------------------------------------------------------
// 7a. dist/tokens-studio.json
//     Combined token file in Tokens Studio format.
//     Preserves layer structure and unresolved references so the file can
//     be imported directly back into Figma via Tokens Studio.
//     Structure: { primitive: {...}, semantic: {...}, component: {...}, $metadata }
// ---------------------------------------------------------------------------

const tokensStudio = {
  primitive: primitive.primitive ?? primitive,
  semantic:  semantic,
  component: component,
  $metadata: {
    tokenSetOrder: ['primitive', 'semantic', 'component'],
  },
};

writeFileSync('./dist/tokens-studio.json',
  JSON.stringify(tokensStudio, null, 2) + '\n',
  'utf8'
);
console.log('✔︎  dist/tokens-studio.json');

// ---------------------------------------------------------------------------
// 7b. dist/tokens-flat.json
//     Fully resolved flat key:value map.
//     All token references resolved to their final values.
//     Intended for platform consumers (UNIFACE, native apps, etc.)
//     that cannot process references or layered JSON.
//
//     Format:
//     {
//       "interactive-default": { "value": "#195FD2", "type": "color", "description": "..." },
//       "btn-variant-primary-bg": { "value": "#195FD2", "type": "color", "description": "..." }
//     }
// ---------------------------------------------------------------------------

// Combine semantic and component flat maps, resolving all values
const allFlat = {};

// Semantic tokens
for (const [path, token] of Object.entries(semFlat)) {
  const value = resolveToken(token.value);
  if (typeof value === 'object' && !Array.isArray(value)) continue; // skip composite
  const cssKey = path.replace(/\./g, '-');
  allFlat[cssKey] = {
    value: token.type === 'boxShadow' ? shadowToCSS(value) : value,
    type: token.type,
    description: token.description || '',
    layer: 'semantic',
  };
}

// Component tokens
for (const [path, token] of Object.entries(compFlat)) {
  const value = resolveComponentValue(token.value);
  if (typeof value === 'object') continue;
  const cssKey = compCssVarName(path).replace('--', '');
  allFlat[cssKey] = {
    value,
    type: token.type,
    description: token.description || '',
    layer: 'component',
  };
}

writeFileSync('./dist/tokens-flat.json',
  JSON.stringify(allFlat, null, 2) + '\n',
  'utf8'
);
console.log('✔︎  dist/tokens-flat.json');
