import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Cloudflare Turnstile NestJS",
  description: "🔥 Cloudflare Turnstile integration for Nest JS",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Get Started', link: '/get-started' }]
      }
    ],

    logo: 'https://i.ibb.co/HT1M4Kb/image.png',

    socialLinks: [
      { icon: 'github', link: 'https://github.com/halitsever/nest-cloudflare-turnstile' }
    ]
  }
})
