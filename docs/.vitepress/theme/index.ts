import DefaultTheme from 'vitepress/theme-without-fonts';
import { withBase, type Theme } from 'vitepress';
import { h } from 'vue';
import HomePage from './components/HomePage.vue';
import NotFound from './components/NotFound.vue';
import './style.css';

export default {
  extends: DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'nav-bar-title-after': () =>
        h('span', { class: 'nav-title' }, [
          h('span', { class: 'nav-title-main' }, 'Cloudflare Turnstile'),
          h('span', { class: 'nav-title-sub' }, 'for NestJS'),
        ]),
      'nav-bar-content-after': () =>
        h(
          'a',
          { class: 'nav-cta', href: withBase('/get-started.html') },
          'Get started',
        ),
      'not-found': () => h(NotFound),
    }),
  enhanceApp({ app }) {
    app.component('HomePage', HomePage);
  },
} satisfies Theme;
