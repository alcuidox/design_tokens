import { Button } from './Button';

/** @type {import('@storybook/react').Meta<typeof Button>} */
export default {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger', 'ghost'],
      description: 'Visual style of the button',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the button',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the button and prevents interaction',
    },
    loading: {
      control: 'boolean',
      description: 'Shows a loading spinner and disables interaction',
    },
    children: {
      control: 'text',
      description: 'Button label',
    },
  },
  args: {
    children: 'Button',
    variant: 'primary',
    size: 'md',
    disabled: false,
    loading: false,
  },
};

// ---------------------------------------------------------------------------
// Default — interactive story with all controls available
// ---------------------------------------------------------------------------
export const Default = {};

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------
export const Variants = {
  render: () => (
    <div className="flex flex-wrap gap-md items-center">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------
export const Sizes = {
  render: () => (
    <div className="flex flex-wrap gap-md items-center">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------
export const States = {
  render: () => (
    <div className="flex flex-wrap gap-md items-center">
      <Button variant="primary">Default</Button>
      <Button variant="primary" disabled>Disabled</Button>
      <Button variant="primary" loading>Loading</Button>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// All variants × disabled state
// ---------------------------------------------------------------------------
export const DisabledVariants = {
  name: 'Disabled (all variants)',
  render: () => (
    <div className="flex flex-wrap gap-md items-center">
      <Button variant="primary"   disabled>Primary</Button>
      <Button variant="secondary" disabled>Secondary</Button>
      <Button variant="danger"    disabled>Danger</Button>
      <Button variant="ghost"     disabled>Ghost</Button>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// On dark surface
// ---------------------------------------------------------------------------
export const OnDarkSurface = {
  name: 'On dark surface',
  parameters: {
    backgrounds: { default: 'inverse' },
  },
  render: () => (
    <div className="flex flex-wrap gap-md items-center">
      <Button variant="ghost">Ghost</Button>
      <Button variant="secondary">Secondary</Button>
    </div>
  ),
};
