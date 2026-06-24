/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        medical: {
          primary: '#0070C0',
          secondary: '#00A86B',
          danger: '#E53E3E',
          warning: '#F6AD55',
          light: '#F0F7FF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'float-slow': 'floatSlow 7s ease-in-out infinite',
        'fade-up': 'fadeUp 0.7s ease forwards',
      },
      keyframes: {
        floatSlow: {
          '0%, 100%': { transform: 'translate3d(0,0,0)' },
          '50%': { transform: 'translate3d(0,-18px,0)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
