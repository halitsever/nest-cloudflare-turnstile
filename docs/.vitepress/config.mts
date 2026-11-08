import { defineConfig } from 'vitepress';
import pkg from '../../package.json' with { type: 'json' };
import { codeThemeDark, codeThemeLight } from './code-theme';

const base = '/nest-cloudflare-turnstile/';
const siteUrl = 'https://halitsever.github.io/nest-cloudflare-turnstile/';
const repo = 'https://github.com/halitsever/nest-cloudflare-turnstile';
const description =
  'A NestJS guard that verifies Cloudflare Turnstile tokens before your handlers run.';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Cloudflare Turnstile for NestJS',
  description,
  base,

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}logo.svg` }],
    ['meta', { name: 'theme-color', content: '#ff5e1f' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    [
      'link',
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    ],
    [
      'link',
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400..700&family=Inter+Tight:wght@400..700&family=JetBrains+Mono:wght@400..600&display=swap',
      },
    ],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'nest-cloudflare-turnstile' }],
    ['meta', { property: 'og:description', content: description }],
    ['meta', { property: 'og:image', content: `${siteUrl}og.png` }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ],

  markdown: {
    theme: { light: codeThemeLight, dark: codeThemeDark },
  },

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: { src: '/logo.svg', alt: '' },
    siteTitle: false,
    version: pkg.version,
    repo,

    nav: [
      {
        text: 'Guide',
        link: '/get-started',
        activeMatch: '^/(?!turnstile-options)[a-z]',
      },
      { text: 'Options', link: '/turnstile-options' },
      { text: 'Changelog', link: `${repo}/blob/main/CHANGELOG.md` },
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Get started', link: '/get-started' },
          { text: 'Frontend frameworks', link: '/frontend' },
          { text: 'Options', link: '/turnstile-options' },
          { text: 'Error handling', link: '/error-handling' },
          { text: 'Testing', link: '/testing' },
          { text: 'Advanced usage', link: '/advanced' },
        ],
      },
      {
        text: 'Migrating',
        items: [
          { text: 'From 0.0.x to 1.0', link: '/migration' },
          {
            text: 'From @nestlab/google-recaptcha',
            link: '/from-google-recaptcha',
          },
        ],
      },
    ],

    search: { provider: 'local' },

    outline: { label: 'On this page' },

    docFooter: { prev: 'Previous', next: 'Next' },

    editLink: {
      pattern: `${repo}/edit/main/docs/:path`,
      text: 'Edit this page on GitHub',
    },

    socialLinks: [{ icon: 'github', link: repo }],
  },
});
