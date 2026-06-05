/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ["Outfit", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"], // serif hero (Doctronic-style)
      },
      colors: {
        teal: {
          50: "#F0FDFA",
          100: "#E6FAF5",
          200: "#D9F5ED",
          400: "#2DD4BF",
          500: "#14B8A6",
          600: "#0D9488",
          700: "#0F766E",
          800: "#0E4D47",
          900: "#0A332F",
        },
        cream: "#FAFAF2", // landing background (matches screenshot)
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease-in-out",
        spin360: "spin360 1s linear infinite",
        blob: "blob 14s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        spin360: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        blob: {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "33%": { transform: "translate(20px,-30px) scale(1.1)" },
          "66%": { transform: "translate(-20px,20px) scale(0.95)" },
        },
      },
    },
  },
  plugins: [],
};
