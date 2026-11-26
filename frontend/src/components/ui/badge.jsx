import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Status badge (Figma: Vistara · Components › Status badge).
 * Always dot + word + colour, so meaning never depends on colour alone (WCAG 1.4.1).
 */
const VARIANTS = {
  default:     { box: 'bg-brand-tint text-brand-forest',     dot: 'bg-brand-forest' },
  success:     { box: 'bg-status-ok-bg text-status-ok',      dot: 'bg-status-ok' },
  destructive: { box: 'bg-status-danger-bg text-status-danger', dot: 'bg-status-danger' },
  warning:     { box: 'bg-status-warn-bg text-status-warn',  dot: 'bg-status-warn' },
  neutral:     { box: 'bg-surface-subtle text-ink-muted',    dot: 'bg-ink-muted' },
  secondary:   { box: 'bg-surface-subtle text-ink-muted',    dot: 'bg-ink-muted' },
  outline:     { box: 'border border-line text-ink',         dot: 'bg-ink-muted' },
};

const Badge = React.forwardRef(({ className, variant = 'default', dot = true, children, ...props }, ref) => {
  const v = VARIANTS[variant] || VARIANTS.default;
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-semibold leading-none whitespace-nowrap',
        v.box,
        className
      )}
      {...props}
    >
      {dot && <span aria-hidden="true" className={cn('h-1.5 w-1.5 rounded-full', v.dot)} />}
      {children}
    </span>
  );
});
Badge.displayName = 'Badge';

export { Badge };
