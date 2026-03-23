import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2563eb',
          soft: '#dbeafe',
          dark: '#1d4ed8',
        },
        surface: '#0b1120',
        card: '#020617',
      },
    },
  },
  plugins: [],
};

export default config;

