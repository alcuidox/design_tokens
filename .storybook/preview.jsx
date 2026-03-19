import '../src/styles/global.css';

/** @type {import('@storybook/react').Preview} */
const preview = {
  parameters: {
    // Background colours using semantic surface tokens
    backgrounds: {
      default: 'page',
      values: [
        { name: 'page',    value: '#F8FAFC' }, // surface.page
        { name: 'default', value: '#FFFFFF' }, // surface.default
        { name: 'inverse', value: '#0F172A' }, // surface.inverse
      ],
    },

    // Viewport presets
    viewport: {
      viewports: {
        mobile:  { name: 'Mobile',  styles: { width: '375px',  height: '812px' } },
        tablet:  { name: 'Tablet',  styles: { width: '768px',  height: '1024px' } },
        desktop: { name: 'Desktop', styles: { width: '1280px', height: '900px' } },
        wide:    { name: 'Wide',    styles: { width: '1920px', height: '1080px' } },
      },
    },

    // Default layout for stories
    layout: 'centered',

    // Accessibility addon configuration
    a11y: {
      config: {
        rules: [
          // Enforce colour contrast using WCAG AA as the minimum
          { id: 'color-contrast', enabled: true },
        ],
      },
    },

    // Controls — sort props alphabetically in the Controls panel
    controls: {
      matchers: {
        color: /(background|color|fill|stroke)$/i,
        date: /date$/i,
      },
      sort: 'alpha',
    },
  },

  // Global decorators — wrap every story in a consistent container
  decorators: [
    (Story) => (
      <div className="font-sans antialiased">
        <Story />
      </div>
    ),
  ],
};

export default preview;
