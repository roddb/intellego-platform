/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Mac-inspired color palette
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#007AFF',
          600: '#0056b3',
          700: '#5AC8FA',
        },
        secondary: {
          50: '#F2F2F7',
          100: '#E5E5EA',
          500: '#8E8E93',
          600: '#636366',
          700: '#48484A',
        },
        accent: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#34C759',
          600: '#30D158',
          700: '#22c55e',
        },
        background: {
          primary: '#FFFFFF',
          secondary: '#F2F2F7',
          tertiary: '#FAFAFA',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'San Francisco', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'mac': '0 4px 16px rgba(0, 0, 0, 0.1)',
        'mac-lg': '0 8px 32px rgba(0, 0, 0, 0.12)',
      }
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        intellego: {
          "primary": "#14b8a6",
          "secondary": "#0891b2",
          "accent": "#06b6d4",
          "neutral": "#374151",
          "base-100": "#ffffff",
          "base-200": "#f8fafc",
          "base-300": "#e2e8f0",
          "info": "#0ea5e9",
          "success": "#10b981",
          "warning": "#f59e0b",
          "error": "#ef4444",
        },
      },
      "dark",
    ],
    darkTheme: "dark",
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: false,
    themeRoot: ":root",
  },
}