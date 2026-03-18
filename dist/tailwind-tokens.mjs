/**
 * Idox Design System — Tailwind Theme Extension
 * Auto-generated from primitive.json + semantic.json. Do not edit manually.
 *
 * Usage in tailwind.config.js:
 *   import idoxTokens from './dist/tailwind-tokens.mjs';
 *   export default { theme: { extend: idoxTokens } };
 *
 * For typography utility classes (.type-h1, .type-body etc.)
 * also import dist/typography.css in your global stylesheet.
 *
 * Tokens excluded (already covered by Tailwind defaults):
 *   - fontWeight.medium (500)
 *   - fontWeight.semibold (600)
 *   - fontWeight.bold (700)
 *   - borderRadius.none (0px)
 *   - borderRadius.sm (0.125rem)
 *   - borderRadius.md (0.375rem)
 *   - borderRadius.lg (0.5rem)
 */

export default {
  "colors": {
    "brand": {
      "default": "#0A1F8F"
    },
    "interactive": {
      "default": "#0A1F8F",
      "hovered": "#1241B2",
      "pressed": "#050F48",
      "focused": "#0A1F8F",
      "disabled": "#F1F5F9",
      "subtle": "#f5f9fe",
      "subtle-hovered": "#ecf3fe",
      "subtle-border": "#9CC2FC",
      "on-interactive": "#FFFFFF",
      "border-focus": "#9CC2FC"
    },
    "surface": {
      "page": "#F8FAFC",
      "default": "#FFFFFF",
      "raised": "#F8FAFC",
      "overlay": "#0F172A",
      "inverse": "#0F172A",
      "disabled": "#F1F5F9"
    },
    "border": {
      "default": "#E2E8F0",
      "strong": "#94A3B8",
      "disabled": "#E2E8F0"
    },
    "text": {
      "primary": "#0F172A",
      "secondary": "#475569",
      "tertiary": "#94A3B8",
      "disabled": "#94A3B8",
      "inverse": "#F8FAFC",
      "brand": "#0A1F8F"
    },
    "success": {
      "default": "#16A34A",
      "hovered": "#15803D",
      "pressed": "#166534",
      "subtle": "#F0FDF4",
      "subtle-hovered": "#DCFCE7",
      "border": "#86EFAC",
      "text": "#15803D",
      "on-success": "#F0FDF4"
    },
    "danger": {
      "default": "#DC2626",
      "hovered": "#B91C1C",
      "pressed": "#991B1B",
      "disabled": "#FECACA",
      "subtle": "#FEF2F2",
      "subtle-hovered": "#FEE2E2",
      "border": "#FCA5A5",
      "text": "#B91C1C",
      "on-danger": "#FEF2F2"
    },
    "warning": {
      "default": "#F59E0B",
      "hovered": "#D97706",
      "pressed": "#B45309",
      "subtle": "#FFFBEB",
      "subtle-hovered": "#FEF3C7",
      "border": "#FCD34D",
      "text": "#92400E",
      "on-warning": "#451A03"
    },
    "info": {
      "default": "#195FD2",
      "hovered": "#1241B2",
      "pressed": "#0A1F8F",
      "subtle": "#f5f9fe",
      "subtle-hovered": "#ecf3fe",
      "border": "#9CC2FC",
      "text": "#1241B2",
      "on-info": "#FFFFFF"
    }
  },
  "spacing": {
    "2xl": "3rem",
    "3xl": "4rem",
    "4xl": "6rem",
    "5xl": "8rem",
    "6xl": "12rem",
    "7xl": "16rem",
    "8xl": "20rem",
    "9xl": "24rem",
    "none": "0px",
    "xs": "0.25rem",
    "sm": "0.5rem",
    "md": "1rem",
    "lg": "1.5rem",
    "xl": "2rem"
  },
  "borderRadius": {
    "pill": "9999px"
  },
  "borderWidth": {
    "hairline": "1px",
    "thin": "2px",
    "thick": "4px"
  },
  "boxShadow": {
    "subtle": "0px 1px 2px 0px rgb(0 0 0 / 0.05)",
    "default": "0px 1px 3px 0px rgb(0 0 0 / 0.1), 0px 1px 2px -1px rgb(0 0 0 / 0.1)",
    "raised": "0px 4px 6px -1px rgb(0 0 0 / 0.1), 0px 2px 4px -2px rgb(0 0 0 / 0.1)",
    "overlay": "0px 10px 15px -3px rgb(0 0 0 / 0.1), 0px 4px 6px -4px rgb(0 0 0 / 0.1)"
  },
  "fontSize": {
    "body": "1rem",
    "small": "0.875rem",
    "caption": "0.75rem",
    "h1": "2.25rem",
    "h2": "1.875rem",
    "h3": "1.5rem",
    "h4": "1.25rem",
    "h5": "1.125rem",
    "h6": "1rem"
  },
  "fontWeight": {
    "regular": "400"
  },
  "fontFamily": {
    "default": "DM Sans, sans-serif",
    "code": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
  },
  "letterSpacing": {
    "body": "0em",
    "caps": "0.025em"
  },
  "lineHeight": {
    "body": "1.5",
    "heading": "1.25",
    "caption": "1.5",
    "code": "1.625"
  },
  "opacity": {
    "overlay": "0.5",
    "disabled": "0.38",
    "subtle": "0.08"
  }
};
