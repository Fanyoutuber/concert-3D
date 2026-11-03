/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wine: {
          DEFAULT: '#6B1724',
          dark: '#3F0C15',
          light: '#8E2032',
        },
        cream: '#FAF5F0',
        gold: '#D4AF37',
      },
      fontFamily: {
        heading: ["'Be Vietnam Pro'", '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        body: ["'Plus Jakarta Sans'", '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ["'Space Grotesk'", 'monospace'],
      },
      keyframes: {
        fadeInScale: {
          from: {
            opacity: '0',
            transform: 'scale(0.96) translateY(10px)',
          },
          to: {
            opacity: '1',
            transform: 'scale(1) translateY(0)',
          },
        },
      },
      animation: {
        'modal-enter': 'fadeInScale 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
    },
  },
  plugins: [],
};
