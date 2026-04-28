/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        asphalt: 'var(--background)',
        carbon: 'var(--surface)',
        'jdm-purple': 'var(--midnight-purple)',
        'neon-violet': 'var(--neon-violet)',
        'turbo-orange': 'var(--turbo-orange)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'industrial-border': 'var(--border)',
      }
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        midnight_jdm: {
          "primary": "#280137", // midnight-purple
          "secondary": "#A855F7", // neon-violet
          "accent": "#F97316", // turbo-orange
          "neutral": "#0F111A", // surface
          "base-100": "#050508", // background
          "info": "#3ABFF8",
          "success": "#36D399",
          "warning": "#FBBD23",
          "error": "#F87272",
        },
      },
      "luxury",
    ],
  },
}
