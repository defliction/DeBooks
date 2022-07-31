/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      fontFamily: {
        'bely': ['BelyDisplayW00-Regular', 'sans-serif'], 
        'dmserif': ['DMSerifDisplay-Regular', 'sans-serif'], 
        'ros1': ['Roslindale-DisplayNarrowRegular-Testing', 'sans-serif'] ,
        'ros3': ['Roslindale-DisplayNarrowLight-Testing', 'sans-serif'] ,
        'ros4': ['Roslindale-DisplayLight-Testing', 'sans-serif'] ,
        'rosc2': ['Roslindale-DisplayCondensedLight-Testing', 'sans-serif'] ,
        'rosc3': ['Roslindale-DisplayCondensedMedium-Testing', 'sans-serif'] ,


       
      },
    },
  },
  plugins: [require("daisyui"),require('@tailwindcss/typography')],
}
