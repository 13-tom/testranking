import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Achievements page palette (BR-045 frontend, "Merit Wall"
        // design): marigold, not generic amber — Indian felicitation
        // garlands/tilak, used only for earned-achievement accents.
        marigold: {
          50: "#FDF6E9",
          100: "#FAEACB",
          200: "#F3D48A",
          400: "#E8A33D",
          500: "#D98F24",
          600: "#B8721A",
          900: "#4A2E0D",
        },
      },
    },
  },
  plugins: [],
};

export default config;
