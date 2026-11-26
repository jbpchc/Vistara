/** Vistara tokens: colours resolve to CSS variables generated from Figma
 *  (src/styles/tokens.css). Opacity modifiers work, e.g. bg-brand/10. */
const v = (name) => `rgb(var(--${name}-rgb) / <alpha-value>)`;
const guardKeys = ['canvas', 'surface', 'surface-2', 'border', 'border-strong', 'text', 'text-2', 'accent', 'on-accent',
  'accent-soft', 'accent-ink', 'ok', 'ok-bg', 'danger', 'danger-bg', 'danger-solid', 'warn', 'warn-bg', 'info', 'info-bg',
  'rail', 'bar-text', 'bar-text-2', 'bar-chip', 'fab', 'on-fab'];

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground))',
        },
        /* Semantic status colours that follow the active theme (admin/resident or guard Night/Day) */
        success: { DEFAULT: 'hsl(var(--success) / <alpha-value>)', bg: 'hsl(var(--success-bg) / <alpha-value>)' },
        warning: { DEFAULT: 'hsl(var(--warning) / <alpha-value>)', bg: 'hsl(var(--warning-bg) / <alpha-value>)' },
        danger: { DEFAULT: 'hsl(var(--danger) / <alpha-value>)', bg: 'hsl(var(--danger-bg) / <alpha-value>)' },
        info: { DEFAULT: 'hsl(var(--info) / <alpha-value>)', bg: 'hsl(var(--info-bg) / <alpha-value>)' },
        /* ── Vistara design system (Figma variables) ── */
        surface: { canvas: v('bg-canvas'), card: v('bg-card'), subtle: v('bg-subtle') },
        line: { DEFAULT: v('border-default'), strong: v('border-strong') },
        brand: { DEFAULT: v('brand-primary'), forest: v('brand-forest'), tint: v('brand-tint'), on: v('brand-on-primary') },
        side: { text: v('side-text'), active: v('side-active'), badge: v('side-badge') },
        ink: { DEFAULT: v('text-primary'), muted: v('text-secondary') },
        status: {
          ok: v('status-ok'), 'ok-bg': v('status-ok-bg'), warn: v('status-warn'), 'warn-bg': v('status-warn-bg'),
          danger: v('status-danger'), 'danger-bg': v('status-danger-bg'),
        },
        chart: { muted: v('chart-muted') },
        home: { DEFAULT: v('home-accent'), canvas: v('home-canvas'), bg: v('home-accent-bg'), ink: v('home-accent-ink') },
        g: Object.fromEntries(guardKeys.map((k) => [k, v(`g-${k}`)])),
        /* Camella Brand (legacy, kept for un-migrated pages) */
        camella: {
          green: '#1a6b2f',
          'green-light': '#4caf50',
          orange: '#e8650a',
          'orange-light': '#ff9800',
          gold: '#f5a623',
        },
      },
      borderRadius: {
        card: '24px',
        'card-home': '28px',
        tile: '16px',
        rail: '18px',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Urbanist', 'system-ui', 'sans-serif'],
        display: ['Urbanist', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 6px 24px -6px rgba(28,41,25,.05)',
        modal: '0 24px 64px -12px rgba(28,41,25,.18)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
        shimmer: 'shimmer 2s infinite linear',
      },
    },
  },
  plugins: [],
}
