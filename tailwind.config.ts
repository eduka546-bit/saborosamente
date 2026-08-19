import type { Config } from 'tailwindcss'

const config: Config = {
  theme: {
    extend: {
      fontFamily: {
        'mazzard': ['Mazzard Soft L', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'pacifico': ['Pacifico', 'cursive'],
        'halimun': ['Indie Flower', 'cursive'],
      },
    },
  },
  plugins: [],
}

export default config
