import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        accent: '#0ea5e9',
      },
    },
  },
  plugins: [],
};

export default config;
