/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      keyframes: {
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        'gradient-x': 'gradient-x 6s ease infinite',
      },
      width: {
        11: '1.70rem',
        16: '2rem',
      },
      colors: {
        church: {
          primary: 'rgb(var(--church-primary) / <alpha-value>)',
          dark: '#1f1f1f',
          light: '#f3f3f3',
          accent: '#d3ceb9',
          navy: '#172137',
          slate: '#778899',
        },
        // Existing app variables
        'jkd-bg': 'var(--jkd-bg-col)',
        'jkd-bg-sec': 'var(--jkd-bg-col-sec)',
        'jkd-heading': 'var(--jkd-h-col)',
        'jkd-text': 'var(--jkd-txt-col)',
        'jkd-border': 'var(--jkd-b-col-def)',
        // Prototype token aliases mapped to existing CSS variables
        'light-bg': 'var(--jkd-bg-col)',
        'light-bg-muted': 'var(--jkd-bg-col-sec)',
        'light-heading': 'var(--jkd-h-col)',
        'light-text': 'var(--jkd-txt-col)',
        'light-border': 'var(--jkd-b-col-def)',
        'dark-bg': 'var(--jkd-bg-col)',
        'dark-bg-muted': 'var(--jkd-bg-col-sec)',
        'dark-bg-deep': 'var(--jkd-bg-col-sec)',
        'dark-heading': 'var(--jkd-h-col)',
        'dark-text': 'var(--jkd-txt-col)',
        'dark-border': 'var(--jkd-b-col-def)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
