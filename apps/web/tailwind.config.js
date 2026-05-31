/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0f1419',
        accent: '#b8410e',
        good: '#1f6b3e',
      },
      fontFamily: {
        sans: ['ui-sans-serif', '-apple-system', 'system-ui', 'sans-serif'],
        serif: ['ui-serif', 'Iowan Old Style', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
