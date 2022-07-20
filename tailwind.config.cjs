/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      fontFamily: {
        'bely': ['BelyDisplayW00-Regular', 'sans-serif'] 
      },
    },
  },
  plugins: [require("daisyui"),require('@tailwindcss/typography')],
}
