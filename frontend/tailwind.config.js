module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cinema: '#0f0f1a',
        'cinema-dark': '#050508',
        'velvet-red': '#8B0000',
        'velvet-light': '#B22222',
        'curtain-red': '#DC143C',
        gold: '#ffd700',
        'gold-dark': '#DAA520',
        'rose-gold': '#E0BFB8',
        'pink-light': '#FFB6C1',
        'pink-soft': '#FFC0CB',
        'lavender': '#E6E6FA',
        accent: '#ff2d55',
        'spotlight': '#FFF8DC'
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        body: ['"Montserrat"', 'sans-serif']
      }
    }
  },
  plugins: []
}