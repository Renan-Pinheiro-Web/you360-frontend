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
        // ── Paleta YOU360 ──────────────────────────────────────
        cream:        '#F7F4F1',   // Off-White (fundo principal)
        sage:         '#D8C7A3',   // Dourado Pastel (cor de destaque primária)
        'sage-light': '#E8DFC8',   // Dourado claro
        'sage-dark':  '#B8A07A',   // Dourado escuro (hover)
        blush:        '#E8E2D8',   // Bege Neutro
        'blush-dark': '#B6B6B2',   // Cinza Médio
        obsidian:     '#4F4F4F',   // Grafite Suave (texto principal)
      },
      fontFamily: {
        display: ['Montserrat', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}