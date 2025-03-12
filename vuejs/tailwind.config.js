export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        color1: '#5e6a5b',
        color2: '#f4f5e0',
        color3: '#f5ebc9',
        color4: '#acbc88',
        color5: '#0a0b0f',
      },
      fontFamily: {
        content: ['"Cabin"', 'sans-serif'],
        heading: ['"Sniglet"', 'cursive'],
        subheading: ['"Josefin Sans"', 'cursive'],
      },
    },
  },
  plugins: [],
}
