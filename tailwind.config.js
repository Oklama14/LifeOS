/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Importante para o toggle funcionar manual
  theme: {
    extend: {
      colors: {
        amethyst: {
          950: '#10002b', // Fundo principal (Dark Amethyst)
          900: '#240046', // Cards/Modais (Dark Amethyst Lighter)
          800: '#3c096c', // Bordas/Elementos secundários (Indigo Ink)
          700: '#5a189a', // Indigo Velvet
          600: '#7b2cbf', // Cor Primária/Botões (Royal Violet)
          500: '#9d4edd', // Lavender Purple
          400: '#c77dff', // Mauve Magic
          300: '#e0aaff', // Mauve (Texto claro/Detalhes)
          100: '#f3e8ff', // Mantendo um tom claro padrão para mix
        }
      }
    },
  },
  plugins: [],
}