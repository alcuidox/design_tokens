/** @type {import('@storybook/react-vite').StorybookConfig} */
const config = {
  // Where to find story files
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],

  addons: [
    '@storybook/addon-essentials',   // Controls, Actions, Docs, Viewport, Backgrounds
    '@storybook/addon-a11y',         // Accessibility audit panel
    '@storybook/addon-interactions', // Play function interaction testing
    '@storybook/addon-themes',       // Theme switching (light/dark)
  ],

  framework: {
    name: '@storybook/react-vite',
    options: {},
  },

  // Expose the dist/ folder so Storybook can resolve token CSS imports
  viteFinal: async (config) => {
    return config;
  },

  docs: {
    autodocs: 'tag', // Generate docs page for any story tagged with autodocs
  },
};

export default config;
