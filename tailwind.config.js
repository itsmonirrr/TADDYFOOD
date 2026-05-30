/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#E91E8C",
          hover: "#FF4D97",
          container: "#df0e84",
          fixed: "#ffd9e4",
          dim: "#ffb0cc",
        },
        secondary: {
          DEFAULT: "#665b62",
          container: "#eadce4",
          fixed: "#eddfe6",
          "fixed-dim": "#d0c3ca",
        },
        accent: {
          DEFAULT: "#FFF0F8",
          light: "#FFF9FC",
        },
        surface: {
          DEFAULT: "#fcf9f8",
          dim: "#dcd9d9",
          bright: "#fcf9f8",
          lowest: "#ffffff",
          low: "#f6f3f2",
          container: "#f0eded",
          high: "#eae7e7",
          highest: "#e5e2e1",
        },
        "on-surface": "#1c1b1b",
        "on-surface-variant": "#594048",
        "inverse-surface": "#313030",
        "outline-variant": "#e1bdc8",
        outline: "#8d6f79",
        tertiary: {
          DEFAULT: "#046c00",
          container: "#068800",
        },
        error: {
          DEFAULT: "#ba1a1a",
          container: "#ffdad6",
        }
      },
      borderRadius: {
        DEFAULT: "1rem",
        lg: "2rem",
        xl: "3rem",
        "2xl": "2rem",
        "3xl": "3rem",
        full: "9999px"
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        xxl: "48px",
        gutter: "24px",
        "container-max": "1280px",
        unit: "4px"
      },
      fontFamily: {
        sans: ["Poppins", "Be Vietnam Pro", "sans-serif"],
        display: ["Poppins", "Be Vietnam Pro", "sans-serif"],
      },
      boxShadow: {
        'glass': '0 10px 30px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 15px rgba(233, 30, 140, 0.2)',
        'lift': '0 15px 35px rgba(233, 30, 140, 0.15)',
        'premium': '0 20px 40px rgba(0, 0, 0, 0.06)',
        'admin-glow': '0 0 20px rgba(233, 30, 140, 0.1)'
      }
    },
  },
  plugins: [],
}
