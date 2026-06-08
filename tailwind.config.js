/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ["Outfit", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"], // serif hero (Doctronic-style)
        grotesk: ["Space Grotesk", "sans-serif"], // bold display for the consoles
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
        // Console theme (partner + admin): warm cream + fresh grass green.
        grass: {
          50: "#F0FAF3",
          100: "#DCF3E3",
          200: "#B6E7C6",
          300: "#86D6A3",
          400: "#4FBE7C",
          500: "#1C9E5B",
          600: "#178049",
          700: "#136A3D",
          800: "#0F5331",
          900: "#0A3A22",
        },
        sand: {
          50: "#FAF9F2", // warm page background
          100: "#F4F2E8",
          200: "#EAE7D8", // warm borders
        },
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
