/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./dashboard.html",
    "./sidepanel.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        glass: {
          surface: 'rgba(255, 255, 255, 0.05)',
          border: 'rgba(255, 255, 255, 0.12)',
          highlight: 'rgba(99, 102, 241, 0.25)',
        }
      },
      backdropBlur: {
        xs: '2px',
        md: '12px',
        xl: '20px',
      }
    },
  },
  plugins: [],
}
