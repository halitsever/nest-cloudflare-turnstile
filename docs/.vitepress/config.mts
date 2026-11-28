import { defineConfig } from 'vitepress';
import pkg from '../../package.json' with { type: 'json' };
import { codeThemeDark, codeThemeLight } from './code-theme';

const base = '/nest-cloudflare-turnstile/';
const siteUrl = 'https://projects.halit.org/nest-cloudflare-turnstile/';
const repo = 'https://github.com/halitsever/nest-cloudflare-turnstile';
const description =
  'A NestJS guard that verifies Cloudflare Turnstile captcha tokens before your handlers run, on Express, Fastify, GraphQL and WebSockets. Includes a guide for moving from reCAPTCHA.';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareSourceCode',
  name: pkg.name,
  description,
  url: siteUrl,
  codeRepository: repo,
  programmingLanguage: 'TypeScript',
  runtimePlatform: 'Node.js',
  license: 'https://opensource.org/licenses/MIT',
  author: { '@type': 'Person', name: 'Halit Sever', url: 'https://halit.org' },
};

const author = {
  '@type': 'Person',
  name: 'Halit Sever',
  url: 'https://halit.org',
};

type Faq = { q: string; a: string };

/** FAQPage data, only for pages that show the same questions on the page. */
function faqJsonLd(faq: Faq[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a.replace(/<[^>]+>|`/g, ''),
      },
    })),
  };
}

/** BlogPosting and breadcrumbs for a blog post. */
function postJsonLd(fm: Record<string, any>, url: string) {
  const headline = fm.headline ?? fm.title;
  return [
    {
      '@type': 'BlogPosting',
      headline,
      description: fm.description,
      url,
      mainEntityOfPage: url,
      datePublished: fm.date,
      dateModified: fm.date,
      inLanguage: 'en',
      image: `${siteUrl}og.png`,
      keywords: fm.keyword,
      author,
      publisher: author,
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'NestJS Turnstile',
          item: siteUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Blog',
          item: `${siteUrl}blog/`,
        },
        { '@type': 'ListItem', position: 3, name: headline, item: url },
      ],
    },
  ];
}

// https://vitepress.dev/reference/site-config
export default defineConfig({
  /** keeps the page hash map out of every page's HTML, which Semrush reads as a low text-to-HTML ratio */
  metaChunk: true,
  lang: 'en-US',
  title: 'Cloudflare Turnstile for NestJS',
  /** the full site name pushed page titles past 60 characters */
  titleTemplate: ':title | NestJS Turnstile',
  description,
  base,

  sitemap: { hostname: siteUrl },

  head: [
    /** Cloudflare Web Analytics, one token for every page on projects.halit.org. */
    [
      'script',
      {
        defer: '',
        src: 'https://static.cloudflareinsights.com/beacon.min.js',
        'data-cf-beacon': '{"token": "dd7e54d3f48841c187d72d9dbb92a6b6"}',
      },
    ],
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
    ['meta', { property: 'og:image', content: `${siteUrl}og.png` }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['script', { type: 'application/ld+json' }, JSON.stringify(jsonLd)],
  ],

  transformPageData(pageData) {
    if (pageData.isNotFound) return;
    const path = pageData.relativePath
      .replace(/(^|\/)index\.md$/, '$1')
      .replace(/\.md$/, '.html');
    const url = `${siteUrl}${path}`;
    const fm = pageData.frontmatter;
    const title =
      fm.titleTemplate === false
        ? fm.title
        : `${pageData.title} | NestJS Turnstile`;
    fm.head ??= [];
    fm.head.push(
      ['link', { rel: 'canonical', href: url }],
      ['meta', { property: 'og:url', content: url }],
      [
        'meta',
        { property: 'og:type', content: fm.date ? 'article' : 'website' },
      ],
      ['meta', { property: 'og:title', content: title }],
      [
        'meta',
        { property: 'og:description', content: fm.description ?? description },
      ],
    );
    const graph = [
      ...(fm.date ? postJsonLd(fm, url) : []),
      ...(fm.faq?.length ? [faqJsonLd(fm.faq)] : []),
    ];
    if (graph.length) {
      fm.head.push([
        'script',
        { type: 'application/ld+json' },
        JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }),
      ]);
    }
  },

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
        activeMatch: '^/(?!turnstile-options|demo|blog)[a-z]',
      },
      { text: 'Options', link: '/turnstile-options' },
      { text: 'Demo', link: '/demo/' },
      { text: 'Blog', link: '/blog/', activeMatch: '^/blog/' },
      { text: 'Changelog', link: `${repo}/blob/main/CHANGELOG.md` },
    ],

    sidebar: {
      '/blog/': [
        {
          text: 'Blog',
          items: [
            { text: 'All posts', link: '/blog/' },
            {
              text: 'hCaptcha vs reCAPTCHA vs Turnstile',
              link: '/blog/hcaptcha-vs-recaptcha-vs-turnstile',
            },
            {
              text: 'reCAPTCHA alternatives',
              link: '/blog/recaptcha-alternatives',
            },
            {
              text: 'What is Cloudflare Turnstile?',
              link: '/blog/what-is-cloudflare-turnstile',
            },
            {
              text: 'Turnstile error codes',
              link: '/blog/turnstile-error-codes',
            },
            {
              text: 'Turnstile vs reCAPTCHA',
              link: '/blog/cloudflare-turnstile-vs-recaptcha',
            },
            { text: 'Widget options', link: '/blog/turnstile-widget-options' },
            {
              text: 'Testing with test keys',
              link: '/blog/turnstile-test-keys',
            },
            {
              text: 'Verify captchas on the server',
              link: '/blog/verify-captcha-server-side',
            },
            {
              text: 'Unblock challenges.cloudflare.com',
              link: '/blog/unblock-challenges-cloudflare-com',
            },
            {
              text: 'Verifying you are human',
              link: '/blog/verifying-you-are-human',
            },
            { text: 'The __cf_bm cookie', link: '/blog/cf-bm-cookie' },
            {
              text: 'Turnstile pricing',
              link: '/blog/cloudflare-turnstile-pricing',
            },
            { text: 'Bot Fight Mode', link: '/blog/cloudflare-bot-fight-mode' },
            {
              text: 'Cloudflare bot score',
              link: '/blog/cloudflare-bot-score',
            },
          ],
        },
        {
          text: 'Docs',
          items: [
            { text: 'Get started', link: '/get-started' },
            { text: 'Live demo', link: '/demo/' },
          ],
        },
      ],
      '/': [
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
              text: 'From reCAPTCHA',
              link: '/from-google-recaptcha',
            },
          ],
        },
        {
          text: 'More',
          items: [
            { text: 'Live demo', link: '/demo/' },
            { text: 'Blog', link: '/blog/' },
          ],
        },
      ],
    },

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
