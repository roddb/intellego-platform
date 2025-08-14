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
        'westar': '#dcdbd0',
        'heavy-metal': '#242c23',
        'silver-tree': '#63b19b',
        'raw-sienna': '#cb8940',
        'granite-green': '#918d7a',
        'bison-hide': '#c4c1aa',
        'potters-clay': '#7d5a33',
        'sea-nymph': '#82aa9c',
        'powder-ash': '#afc4ba',
        'zorba': '#a49c95',
      },
      fontFamily: {
        'san-francisco': ['-apple-system', 'BlinkMacSystemFont', 'San Francisco', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '16px',
        'xl': '24px',
        '2xl': '40px',
        '3xl': '64px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'drift': 'drift 8s ease-in-out infinite',
        'pulse-soft': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmerWave 2s infinite',
        'glow': 'glowPulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}