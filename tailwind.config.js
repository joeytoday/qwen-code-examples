/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#1a1a2e',
        primary: '#00d4ff',
        secondary: '#ff00aa',
        tertiary: '#9d4edd',
      },
    },
  },
  plugins: [],
};
