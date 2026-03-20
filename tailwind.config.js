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
        // ── Paleta YOU360 — Rose Quartz ────────────────────────
        cream:        '#FDF5FF',   // Branco lavanda — fundo loja / texto claro
        sage:         '#E8B4C8',   // Quartzo rosa — destaque primário
        'sage-light': '#F2CCDA',   // Quartzo rosa claro — hover suave
        'sage-dark':  '#C88FA8',   // Quartzo rosa escuro — hover botão
        blush:        '#C4A8D8',   // Lavanda — acento secundário
        'blush-dark': '#A080B8',   // Lavanda escura
        obsidian:     '#140E16',   // Off-black — fundo principal admin/hero
      },
      fontFamily: {
        display: ['Montserrat', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}