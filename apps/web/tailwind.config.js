/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0f1419',
        accent: '#b8410e',
        good: '#1f6b3e',
        // Payer-portal palette — used by /portal/healthfirst/* routes
        // to render the HealthFirst provider portal mockup.
        hf: {
          navy: '#0c2d4a',
          blue: '#1a5f8a',
          sky: '#e8f2f8',
          border: '#c5d9e8',
          amber: '#b45309',
          green: '#166534',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', '-apple-system', 'system-ui', 'sans-serif'],
        serif: ['ui-serif', 'Iowan Old Style', 'Georgia', 'serif'],
        portal: ['Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
