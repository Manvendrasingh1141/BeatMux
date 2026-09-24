/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#070A12',
        panel: '#0F1422',
        primary: '#8b5cf6', // violet
        secondary: '#0ea5e9', // electric blue
      },
    },
  },
  plugins: [],
}
