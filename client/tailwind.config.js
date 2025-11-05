/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'primary': ['Open Sans', 'sans-serif'],
        'secondary': ['Roboto', 'sans-serif'],
      },
    },
  },
};
