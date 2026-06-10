/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          primary: '#0F1117',
          secondary: '#161B22',
          tertiary: '#1C2333',
          overlay: '#21262D',
        },
        border: {
          default: '#30363D',
          subtle: '#21262D',
          emphasis: '#6E7681',
        },
        accent: {
          blue: '#2F81F7',
          purple: '#8B5CF6',
          green: '#3FB950',
          yellow: '#D29922',
          orange: '#F0883E',
          red: '#F85149',
          cyan: '#39C5CF',
        },
        text: {
          primary: '#E6EDF3',
          secondary: '#8B949E',
          muted: '#6E7681',
          inverse: '#0D1117',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}