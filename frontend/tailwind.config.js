/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // TODO: заменить на реальные цвета бренда
        brand: {
          DEFAULT: '#111827',
          accent: '#f59e0b',
        },
        loyalty: {
          // TODO: настроить цвета уровней лояльности
          bronze: '#cd7f32',
          silver: '#c0c0c0',
          gold: '#ffd700',
        }
      },
    },
  },
  plugins: [],
}
