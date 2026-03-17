/**
 * generate-tailwind.mjs
 * Idox Design System — Tailwind Config Generator
 *
 * Reads primitive.json and semantic.json, resolves all references,
 * and outputs:
 *   dist/tailwind-tokens.mjs   — Tailwind theme.extend object (ESM)
 *   dist/typography.css        — @layer components typography utility classes
 *
 * Tokens whose key AND value already match a Tailwind default are excluded
 * from the config to avoid duplicating what Tailwind provides out of the box.
 *
 * Run with: node generate-tailwind.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const primitive = JSON.parse(readFileSync('./primitive.json', 'utf8'));
const semantic  = JSON.parse(readFileSync('./semantic.json',  'utf8'));

// ---------------------------------------------------------------------------
// Tailwind v3 defaults — used to detect redundant tokens.
// A token is skipped only if BOTH its key AND resolved value match a default.
// Tokens with semantic names (e.g. 'md', 'body') are always included even
// if the value happens to match a Tailwind default under a different key.
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
  // Add other scales here if Tailwind defaults expand in future
};

// Returns true if this token key+value already exists in Tailwind defaults
function isRedundant(scale, key, value) {
  const defaults = TAILWIND_DEFAULTS[scale];
  if (!defaults) return false;
  return defaults[key] === value;
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
// Resolve {primitive.x.y} references to their actual values
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
  if (typeof value === 'string')  return resolve(value);
  if (Array.isArray(value))       return value.map(item => resolveToken(item));
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolve(v)]));
  }
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
// Build Tailwind theme sections from semantic tokens
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

const skipped = []; // log of redundant tokens excluded from output

for (const [path, token] of Object.entries(semFlat)) {
  const value = resolveToken(token.value);
  const parts = path.split('.');
  const key   = parts[parts.length - 1];

  switch (token.type) {

    case 'color': {
      const [group, ...rest] = parts;
      if (!colors[group]) colors[group] = {};
      colors[group][rest.join('-') || 'DEFAULT'] = value;
      break;
    }

    case 'spacing': {
      spacing[key] = value;
      break;
    }

    case 'borderRadius': {
      if (isRedundant('borderRadius', key, value)) {
        skipped.push(`borderRadius.${key} (${value}) — matches Tailwind default`);
      } else {
        borderRadius[key] = value;
      }
      break;
    }

    case 'borderWidth': {
      borderWidth[key] = value;
      break;
    }

    case 'boxShadow': {
      boxShadow[key] = shadowToCSS(value);
      break;
    }

    case 'fontSize': {
      fontSize[key] = value;
      break;
    }

    case 'fontWeight': {
      if (isRedundant('fontWeight', key, value)) {
        skipped.push(`fontWeight.${key} (${value}) — matches Tailwind default`);
      } else {
        fontWeight[key] = value;
      }
      break;
    }

    case 'fontFamily': {
      fontFamily[key] = value;
      break;
    }

    case 'letterSpacing': {
      letterSpacing[key] = value;
      break;
    }

    case 'lineHeight': {
      lineHeight[key] = value;
      break;
    }

    case 'opacity': {
      opacity[key] = value;
      break;
    }

    case 'typography': {
      typographyStyles[key] = value;
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// Write dist/tailwind-tokens.mjs
// ---------------------------------------------------------------------------
mkdirSync('./dist', { recursive: true });

// Remove empty sections
const theme = Object.fromEntries(
  Object.entries({
    colors, spacing, borderRadius, borderWidth, boxShadow,
    fontSize, fontWeight, fontFamily, letterSpacing, lineHeight, opacity,
  }).filter(([, v]) => Object.keys(v).length > 0)
);

const skippedComment = skipped.length > 0
  ? ` *\n * Tokens excluded (already covered by Tailwind defaults):\n${skipped.map(s => ` *   - ${s}`).join('\n')}\n`
  : '';

const tailwindOutput = `/**
 * Idox Design System — Tailwind Theme Extension
 * Auto-generated from primitive.json + semantic.json. Do not edit manually.
 *
 * Usage in tailwind.config.js:
 *   import idoxTokens from './dist/tailwind-tokens.mjs';
 *   export default {
 *     theme: {
 *       extend: idoxTokens,
 *     },
 *   };
 *
 * For typography utility classes (.type-h1, .type-body etc.)
 * also import dist/typography.css in your global stylesheet.
${skippedComment} */

export default ${JSON.stringify(theme, null, 2)};
`;

writeFileSync('./dist/tailwind-tokens.mjs', tailwindOutput, 'utf8');
console.log('✔︎  dist/tailwind-tokens.mjs');
if (skipped.length > 0) {
  console.log(`    ↳ Skipped ${skipped.length} redundant token(s):`);
  skipped.forEach(s => console.log(`      - ${s}`));
}

// ---------------------------------------------------------------------------
// Write dist/typography.css
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

const typographyOutput = `/**
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
`;

writeFileSync('./dist/typography.css', typographyOutput, 'utf8');
console.log('✔︎  dist/typography.css');
