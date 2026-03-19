import idoxTokens from './dist/tailwind-tokens.mjs';

/** @type {import('tailwindcss').Config} */
export default {
  // Scan all component and story files for used classes
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './.storybook/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: idoxTokens,
  },
  plugins: [],
};
