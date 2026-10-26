import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Cloudflare Turnstile NestJS',
  description: 'Cloudflare Turnstile integration for NestJS',
  base: '/nest-cloudflare-turnstile/',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: 'https://i.ibb.co/HT1M4Kb/image.png',

    nav: [
      { text: 'Guide', link: '/get-started' },
      {
        text: 'Changelog',
        link: 'https://github.com/halitsever/nest-cloudflare-turnstile/blob/main/CHANGELOG.md',
      },
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Get started', link: '/get-started' },
          { text: 'Options', link: '/turnstile-options' },
          { text: 'Error handling', link: '/error-handling' },
          { text: 'Testing', link: '/testing' },
          { text: 'Advanced usage', link: '/advanced' },
        ],
      },
      {
        text: 'Upgrading',
        items: [{ text: 'From 0.0.x to 1.0', link: '/migration' }],
      },
    ],

    search: { provider: 'local' },

    editLink: {
      pattern:
        'https://github.com/halitsever/nest-cloudflare-turnstile/edit/main/docs/:path',
    },

    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/halitsever/nest-cloudflare-turnstile',
      },
    ],

    footer: {
      message: 'Released under the MIT License.',
    },
  },
});
