/**
 * Button
 *
 * Consumes component tokens from component-tokens.css, which are
 * generated from component.json — the source of truth for all
 * button token decisions. The full chain is:
 *
 *   component.json → semantic tokens → primitive tokens
 *       ↓
 *   dist/component-tokens.css
 *       ↓
 *   Button.jsx (this file)
 *
 * To retheme the button in a specific context, override component tokens:
 *   .my-context { --btn-variant-primary-bg: var(--brand-default); }
 */

import React from 'react';

// ---------------------------------------------------------------------------
// Variant maps — assign the active slot tokens from the variant-specific
// component tokens. The component itself only ever reads --btn-bg,
// --btn-text etc.; the variant determines what those resolve to.
// ---------------------------------------------------------------------------
const VARIANT_CLASSES = {
  primary: [
    '[--btn-bg:var(--btn-variant-primary-bg)]',
    '[--btn-bg-hover:var(--btn-variant-primary-bg-hover)]',
    '[--btn-bg-active:var(--btn-variant-primary-bg-active)]',
    '[--btn-bg-disabled:var(--btn-variant-primary-bg-disabled)]',
    '[--btn-text:var(--btn-variant-primary-text)]',
    '[--btn-border:var(--btn-variant-primary-border)]',
  ].join(' '),

  secondary: [
    '[--btn-bg:var(--btn-variant-secondary-bg)]',
    '[--btn-bg-hover:var(--btn-variant-secondary-bg-hover)]',
    '[--btn-bg-active:var(--btn-variant-secondary-bg-active)]',
    '[--btn-bg-disabled:var(--btn-variant-secondary-bg-disabled)]',
    '[--btn-text:var(--btn-variant-secondary-text)]',
    '[--btn-border:var(--btn-variant-secondary-border)]',
  ].join(' '),

  danger: [
    '[--btn-bg:var(--btn-variant-danger-bg)]',
    '[--btn-bg-hover:var(--btn-variant-danger-bg-hover)]',
    '[--btn-bg-active:var(--btn-variant-danger-bg-active)]',
    '[--btn-bg-disabled:var(--btn-variant-danger-bg-disabled)]',
    '[--btn-text:var(--btn-variant-danger-text)]',
    '[--btn-border:var(--btn-variant-danger-border)]',
  ].join(' '),

  ghost: [
    '[--btn-bg:var(--btn-variant-ghost-bg)]',
    '[--btn-bg-hover:var(--btn-variant-ghost-bg-hover)]',
    '[--btn-bg-active:var(--btn-variant-ghost-bg-active)]',
    '[--btn-bg-disabled:var(--btn-variant-ghost-bg-disabled)]',
    '[--btn-text:var(--btn-variant-ghost-text)]',
    '[--btn-border:var(--btn-variant-ghost-border)]',
  ].join(' '),
};

// ---------------------------------------------------------------------------
// Size maps — reference size-specific component tokens
// ---------------------------------------------------------------------------
const SIZE_CLASSES = {
  sm: [
    'px-[var(--btn-size-sm-padding-x)]',
    'py-[var(--btn-size-sm-padding-y)]',
    'text-[length:var(--btn-size-sm-font-size)]',
    'h-[var(--btn-size-sm-height)]',
  ].join(' '),

  md: [
    'px-[var(--btn-size-md-padding-x)]',
    'py-[var(--btn-size-md-padding-y)]',
    'text-[length:var(--btn-size-md-font-size)]',
    'h-[var(--btn-size-md-height)]',
  ].join(' '),

  lg: [
    'px-[var(--btn-size-lg-padding-x)]',
    'py-[var(--btn-size-lg-padding-y)]',
    'text-[length:var(--btn-size-lg-font-size)]',
    'h-[var(--btn-size-lg-height)]',
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
        // 1. Variant — assigns --btn-bg, --btn-text, --btn-border slot tokens
        VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.primary,

        // 2. Layout
        'inline-flex items-center justify-center',
        'gap-[var(--spacing-xs)]',

        // 3. Shape — shared component tokens
        'rounded-[var(--btn-shared-border-radius)]',
        'border border-[var(--btn-border)]',

        // 4. Typography — shared component tokens
        'font-[family-name:var(--btn-shared-font-family)]',
        'font-[var(--btn-shared-font-weight)]',
        'tracking-[var(--btn-shared-letter-spacing)]',
        'leading-[var(--btn-shared-line-height)]',

        // 5. Colour — active slot tokens (set by variant above)
        'bg-[var(--btn-bg)]',
        'text-[var(--btn-text)]',

        // 6. Size — size-specific component tokens
        SIZE_CLASSES[size] ?? SIZE_CLASSES.md,

        // 7. Transition
        'transition-colors duration-150 ease-in-out',

        // 8. Interactive states
        !isDisabled && [
          'hover:bg-[var(--btn-bg-hover)]',
          'active:bg-[var(--btn-bg-active)]',
          'focus-visible:outline-2',
          'focus-visible:outline-offset-2',
          'focus-visible:outline-[var(--btn-shared-focus-ring)]',
          'cursor-pointer',
        ].join(' '),

        // 9. Disabled state — shared component tokens
        isDisabled && [
          'bg-[var(--btn-bg-disabled)]',
          'text-[var(--btn-shared-disabled-text)]',
          'opacity-[var(--btn-shared-disabled-opacity)]',
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
