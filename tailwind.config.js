/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./contexts/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0F1117',
        surface: '#1A1F2E',
        primary: {
          DEFAULT: '#6366F1',
          hover: '#4F46E5',
        },
        secondary: '#3B82F6',
        success: '#10B981',
        violet: {
          400: '#6366F1',
          500: '#6366F1',
          600: '#4F46E5',
        },
        slate: {
          800: '#1A1F2E',
          900: '#0F1117',
        },
        // ── University Branding Tokens ──────────────────────────────────
        // These classes adapt to the active university theme automatically.
        // Usage: bg-brand-primary, text-brand-primary-light, etc.
        brand: {
          primary:         'var(--brand-primary)',
          'primary-light': 'var(--brand-primary-light)',
          secondary:       'var(--brand-secondary)',
          'secondary-light': 'var(--brand-secondary-light)',
          'surface-base':  'var(--brand-surface-base)',
          'surface-raised':'var(--brand-surface-raised)',
          'surface-sunken':'var(--brand-surface-sunken)',
          border:          'var(--brand-border)',
          'border-focus':  'var(--brand-border-focus)',
          'on-primary':    'var(--brand-on-primary)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: 'var(--text-xs)',
        helper: 'var(--text-helper)',
        sm: 'var(--text-sm)',
        ui: 'var(--text-ui)',
        base: 'var(--text-base)',
        lg: 'var(--text-lg)',
        xl: 'var(--text-xl)',
        '2xl': 'var(--text-2xl)',
        '3xl': 'var(--text-3xl)',
        '4xl': 'var(--text-4xl)',
        '5xl': 'var(--text-5xl)',
      },
      boxShadow: {
        'card': '0 4px 12px rgba(0,0,0,0.25)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.4)',
        'glow': '0 0 20px rgba(99, 102, 241, 0.1)',
      }
    }
  },
  plugins: [],
}

