import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        midnight: "#08080F",
        panel: "#15151F",
        violetGlow: "#7C3AED",
        cyanGlow: "#06B6D4"
      }
    }
  },
  plugins: []
};

export default config;
