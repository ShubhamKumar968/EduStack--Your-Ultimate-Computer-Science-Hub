/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  // Since this file is inside the `client` folder, paths should be relative to `client/`
  content: [
    "./public/**/*.html",
    "./assets/js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#ff385c',
          soft: '#ff7e5f',
          light: '#ffb199',
          deep: '#c2255c',
          deeper: '#7c1d3f'
        }
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        }
      },
      animation: {
        float: 'float 5s ease-in-out infinite'
      }
    }
  },
  plugins: [],
}
