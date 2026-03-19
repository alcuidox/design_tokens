/**
 * Button
 *
 * Uses component tokens from component-tokens.css exclusively.
 * Component tokens reference semantic tokens, which reference primitives —
 * so the full token chain is maintained while keeping the component clean.
 *
 * To customise the button for a specific context, override component tokens:
 *   .my-context { --btn-primary-bg: var(--brand-default); }
 */

import React from 'react';

// ---------------------------------------------------------------------------
// Variant maps — set the active component token vars for this variant
// ---------------------------------------------------------------------------
const VARIANT_CLASSES = {
  primary: [
    '[--btn-bg:var(--btn-primary-bg)]',
    '[--btn-bg-hover:var(--btn-primary-bg-hover)]',
    '[--btn-bg-active:var(--btn-primary-bg-active)]',
    '[--btn-bg-disabled:var(--btn-primary-bg-disabled)]',
    '[--btn-text:var(--btn-primary-text)]',
    '[--btn-border:var(--btn-primary-border)]',
  ].join(' '),

  secondary: [
    '[--btn-bg:var(--btn-secondary-bg)]',
    '[--btn-bg-hover:var(--btn-secondary-bg-hover)]',
    '[--btn-bg-active:var(--btn-secondary-bg-active)]',
    '[--btn-bg-disabled:var(--btn-secondary-bg-disabled)]',
    '[--btn-text:var(--btn-secondary-text)]',
    '[--btn-border:var(--btn-secondary-border)]',
  ].join(' '),

  danger: [
    '[--btn-bg:var(--btn-danger-bg)]',
    '[--btn-bg-hover:var(--btn-danger-bg-hover)]',
    '[--btn-bg-active:var(--btn-danger-bg-active)]',
    '[--btn-bg-disabled:var(--btn-danger-bg-disabled)]',
    '[--btn-text:var(--btn-danger-text)]',
    '[--btn-border:var(--btn-danger-border)]',
  ].join(' '),

  ghost: [
    '[--btn-bg:var(--btn-ghost-bg)]',
    '[--btn-bg-hover:var(--btn-ghost-bg-hover)]',
    '[--btn-bg-active:var(--btn-ghost-bg-active)]',
    '[--btn-bg-disabled:var(--btn-ghost-bg-disabled)]',
    '[--btn-text:var(--btn-ghost-text)]',
    '[--btn-border:var(--btn-ghost-border)]',
  ].join(' '),
};

// ---------------------------------------------------------------------------
// Size maps — reference size-specific component tokens
// ---------------------------------------------------------------------------
const SIZE_CLASSES = {
  sm: [
    'px-[var(--btn-sm-padding-x)]',
    'py-[var(--btn-sm-padding-y)]',
    'text-[length:var(--btn-sm-font-size)]',
    'h-[var(--btn-sm-height)]',
  ].join(' '),

  md: [
    'px-[var(--btn-md-padding-x)]',
    'py-[var(--btn-md-padding-y)]',
    'text-[length:var(--btn-md-font-size)]',
    'h-[var(--btn-md-height)]',
  ].join(' '),

  lg: [
    'px-[var(--btn-lg-padding-x)]',
    'py-[var(--btn-lg-padding-y)]',
    'text-[length:var(--btn-lg-font-size)]',
    'h-[var(--btn-lg-height)]',
  ].join(' '),
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  onClick,
  type = 'button',
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={[
        // 1. Variant token assignments
        VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.primary,

        // 2. Layout
        'inline-flex items-center justify-center',
        'gap-[var(--spacing-xs)]',

        // 3. Shape
        'rounded-[var(--btn-border-radius)]',
        'border border-[var(--btn-border)]',

        // 4. Typography
        'font-[family-name:var(--btn-font-family)]',
        'font-[var(--btn-font-weight)]',
        'tracking-[var(--btn-letter-spacing)]',
        'leading-[var(--btn-line-height)]',

        // 5. Colour
        'bg-[var(--btn-bg)]',
        'text-[var(--btn-text)]',

        // 6. Size
        SIZE_CLASSES[size] ?? SIZE_CLASSES.md,

        // 7. Transition
        'transition-colors duration-150 ease-in-out',

        // 8. Interactive states
        !isDisabled && [
          'hover:bg-[var(--btn-bg-hover)]',
          'active:bg-[var(--btn-bg-active)]',
          'focus-visible:outline-2',
          'focus-visible:outline-offset-2',
          'focus-visible:outline-[var(--btn-focus-ring)]',
          'cursor-pointer',
        ].join(' '),

        // 9. Disabled state
        isDisabled && [
          'bg-[var(--btn-bg-disabled)]',
          'text-[var(--btn-disabled-text)]',
          'opacity-[var(--btn-disabled-opacity)]',
          'cursor-not-allowed',
        ].join(' '),

      ].filter(Boolean).join(' ')}
      {...props}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
        />
      )}
      {children}
    </button>
  );
}

export default Button;
