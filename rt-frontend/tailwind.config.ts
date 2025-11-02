import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // кастомные цвета удалены, используются стандартные цвета Tailwind
      },
    },
  },
  plugins: [],
} satisfies Config