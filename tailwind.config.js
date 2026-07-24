/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './client/public/**/*.html',
    './client/public/*.html',
    './client/assets/js/**/*.js',
    './client/**/*.html'
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
