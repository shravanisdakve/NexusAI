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
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
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

