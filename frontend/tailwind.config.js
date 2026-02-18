/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#16a34a", // green-600
        secondary: "#f0fdf4", // green-50
      }
    },
  },
  plugins: [],
}
