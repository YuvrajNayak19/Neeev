/** @type {import("tailwindcss").Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        soft: "0 18px 60px rgba(15, 23, 42, 0.08)",
      },
      colors: {
        brand: {
          DEFAULT: "#CD8AF9",
          light: "#95EC89",
        },
        accent: {
          blue: "#5BD8E1",
          sky: "#95EC89",
          pink: "#FA8080",
        },
      },
    },
  },
};
