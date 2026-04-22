/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sipo-orange': '#ea580c', // un poco más oscuro/vibrante
        'sipo-charcoal': '#27272a', // zinc-800
        'sipo-cream': '#fdfbf7', // crema muy suave 
      }
    },
  },
  plugins: [],
}
