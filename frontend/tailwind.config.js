/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1d4ed8',
        'primary-foreground': '#ffffff',
        muted: '#f1f5f9',
        'muted-foreground': '#64748b',
        destructive: '#dc2626',
      },
    },
  },
  plugins: [],
};
