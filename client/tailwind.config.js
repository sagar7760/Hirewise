/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Remove the old darkMode: 'class' setting - not needed in Tailwind v4
  theme: {
    extend: {
      fontFamily: {
        'primary': ['Open Sans', 'sans-serif'],
        'secondary': ['Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
  // Add the new variants configuration for Tailwind v4
  variants: {
    extend: {
      backgroundColor: ['dark'],
      borderColor: ['dark'],
      textColor: ['dark'],
      gradientColorStops: ['dark'],
      boxShadow: ['dark'],
      // Add any other properties styled with dark mode
    },
  },
};
