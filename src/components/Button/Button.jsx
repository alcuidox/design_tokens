/**
 * Button
 *
 * Component tokens are defined as CSS custom properties on the element,
 * referencing semantic tokens. This means:
 *   - The component is self-contained and portable
 *   - Individual tokens can be overridden per-instance if needed
 *   - Changing a semantic token (e.g. interactive.default) propagates here automatically
 */

import React from 'react';

const VARIANT_CLASSES = {
  primary: [
    '[--btn-bg:var(--interactive-default)]',
    '[--btn-bg-hover:var(--interactive-hovered)]',
    '[--btn-bg-active:var(--interactive-pressed)]',
    '[--btn-bg-disabled:var(--interactive-disabled)]',
    '[--btn-text:var(--interactive-on-interactive)]',
    '[--btn-text-disabled:var(--text-disabled)]',
    '[--btn-border:transparent]',
  ].join(' '),

  secondary: [
    '[--btn-bg:transparent]',
    '[--btn-bg-hover:var(--interactive-subtle-hovered)]',
    '[--btn-bg-active:var(--interactive-subtle)]',
    '[--btn-bg-disabled:transparent]',
    '[--btn-text:var(--interactive-default)]',
    '[--btn-text-disabled:var(--text-disabled)]',
    '[--btn-border:var(--interactive-default)]',
  ].join(' '),

  danger: [
    '[--btn-bg:var(--danger-default)]',
    '[--btn-bg-hover:var(--danger-hovered)]',
    '[--btn-bg-active:var(--danger-pressed)]',
    '[--btn-bg-disabled:var(--danger-disabled)]',
    '[--btn-text:var(--danger-on-danger)]',
    '[--btn-text-disabled:var(--text-disabled)]',
    '[--btn-border:transparent]',
  ].join(' '),

  ghost: [
    '[--btn-bg:transparent]',
    '[--btn-bg-hover:var(--interactive-subtle)]',
    '[--btn-bg-active:var(--interactive-subtle-hovered)]',
    '[--btn-bg-disabled:transparent]',
    '[--btn-text:var(--interactive-default)]',
    '[--btn-text-disabled:var(--text-disabled)]',
    '[--btn-border:transparent]',
  ].join(' '),
};

const SIZE_CLASSES = {
  sm: 'px-sm py-xs text-small',
  md: 'px-md py-xs text-body',
  lg: 'px-lg py-sm text-body',
};

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
        // Component token definitions
        VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.primary,
        // Base styles using component tokens
        'inline-flex items-center justify-center gap-sm',
        'rounded-md border border-[var(--btn-border)]',
        'font-bold tracking-wide',
        'bg-[var(--btn-bg)] text-[var(--btn-text)]',
        'transition-colors duration-150',
        SIZE_CLASSES[size] ?? SIZE_CLASSES.md,
        // State styles
        !isDisabled && 'hover:bg-[var(--btn-bg-hover)] active:bg-[var(--btn-bg-active)] cursor-pointer',
        isDisabled && 'bg-[var(--btn-bg-disabled)] text-[var(--btn-text-disabled)] cursor-not-allowed opacity-disabled',
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {loading && (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}

export default Button;
