import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        hf: {
          navy: "#0c2d4a",
          blue: "#1a5f8a",
          sky: "#e8f2f8",
          border: "#c5d9e8",
          amber: "#b45309",
          green: "#166534",
        },
      },
      fontFamily: {
        portal: ["var(--font-portal)", "Segoe UI", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
