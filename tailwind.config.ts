import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cv: {
          blue: "#004aad",       
          lightblue: "#38b6ff",  
          yellow: "#d4ed31",     
          gray: "#f8fafc",       
        }
      },
      fontFamily: {
        heading: ['var(--font-oswald)'],
        body: ['var(--font-montserrat)'],
      }
    },
  },
  plugins: [],
};
export default config;