/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        cream:       '#fafaf8',
        sage:        '#4a7c59',
        'sage-light':'#7aab89',
        'sage-dark': '#2e5238',
        blush:       '#e8c4c4',
        'blush-dark':'#c9908d',
        obsidian:    '#0f0f0f',
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'serif'],
        body:    ['Jost', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
