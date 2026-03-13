# Design Tokens to CSS Variables Generation - Summary

## Overview
Automated conversion process for generating CSS custom properties from the idox-design-system-tokens.json design tokens file.

## Changes Made

### 1. **generate-css-variables.js**
   - **Purpose**: Node.js script that reads design tokens and generates CSS variables
   - **Key Features**:
     - Flattens nested token structures into dash-separated variable names
     - Resolves token references (e.g., `{blue.800}` → `#0A1F8F`)
     - Handles complex types (colors, spacing, typography, shadows, borders, opacity)
     - Generates shadow values from object notation
     - Outputs to `tokens.css` in `:root` selector
   
   - **Functions**:
     - `flattenTokens()`: Converts nested JSON into flat key-value pairs
     - `resolveReferences()`: Replaces token references with actual values
     - `generateCSSVarName()`: Converts token paths to CSS variable names
     - `generateShadowValue()`: Transforms shadow objects to CSS box-shadow syntax

### 2. **package.json Update** (to be added)
   - Added `generate:css` script to automate token generation
   - Can be run with: `npm run generate:css`

### 3. **Automation Integration**
   - Script can be integrated into CI/CD pipeline
   - Can be run pre-commit or as part of build process
   - Generates `tokens.css` in repository root

## Token Structure Supported
- **Primitive Tokens**: Colors, spacing, typography, borders, effects, opacity
- **Semantic Tokens**: Brand colors, interactive states, surface colors, text colors, status colors (success/danger/warning/info), typography styles, effects, border radius/width
- **Reference Resolution**: Automatic resolution of token references within the same set

## Usage

```bash
# Generate CSS variables
node generate-css-variables.js

# Or via npm script (when package.json is updated)
npm run generate:css
```

## Output
- **File**: `tokens.css`
- **Format**: CSS custom properties in `:root` selector
- **Variables**: Dash-separated names (e.g., `--blue-800`, `--interactive-default`)

## Next Steps
1. Add `npm run generate:css` script to package.json
2. Set up CI/CD hook to regenerate tokens on changes
3. Consider adding watch mode for development
4. Add Git hook to auto-generate tokens before commits