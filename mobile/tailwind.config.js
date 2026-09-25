/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // The web app's design tokens (src/index.css :root), so both apps match.
      colors: {
        bg: '#0f1115',
        surface: '#171a21',
        'surface-2': '#1f232c',
        border: '#2a2f3a',
        text: '#e8eaed',
        dim: '#9aa3b2',
        accent: '#6aa6ff',
        'accent-ink': '#0b1220',
        danger: '#ff6b6b',
        ok: '#4ade80',
      },
    },
  },
  plugins: [],
}
