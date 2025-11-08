import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        white: "#ffffff",
        black: "#000000",
        accent: "#ff2f00",
        secondary: "#cfe9ff",
      },
      fontSize: {
        body: ["20px", { lineHeight: "120%" }],
        chat: ["16px", { lineHeight: "120%" }],
        h1: ["32px", { lineHeight: "120%" }],
        supertitle: ["60px", { lineHeight: "110%" }],
      },
      borderRadius: {
        card: "20px",
        button: "60px",
      },
      spacing: {
        base: "10px",
      },
    },
  },
  plugins: [],
};

export default config;

