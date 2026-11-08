<script setup lang="ts">
import { ref } from 'vue';
import { useData, withBase } from 'vitepress';
import AppMockup from './AppMockup.vue';
import Icon from './Icon.vue';
import { highlight } from '../highlight';

const { theme } = useData();
const repo: string = theme.value.repo;
const version: string = theme.value.version;

const command = 'npm i nest-cloudflare-turnstile';
const copied = ref(false);
let reset: ReturnType<typeof setTimeout> | undefined;

async function copy() {
  try {
    await navigator.clipboard.writeText(command);
    copied.value = true;
    clearTimeout(reset);
    reset = setTimeout(() => (copied.value = false), 1600);
  } catch {
    copied.value = false;
  }
}

const page = (path: string) => withBase(path);

const features = [
  {
    icon: 'at',
    title: 'One Decorator',
    text: 'Put @TurnstileCaptcha() on a route or a controller. Or guard every route and mark the exceptions with @SkipTurnstile().',
  },
  {
    icon: 'layers',
    title: 'Fits Your Stack',
    text: 'Express and Fastify, GraphQL resolvers on Apollo or Mercurius, and WebSocket gateways, on NestJS 10, 11 and 12.',
  },
  {
    icon: 'shield',
    title: 'Checks Done Right',
    text: 'Verifies the hostname and action, retries a failed call once with an idempotency key, and keeps the secret key out of every error.',
  },
] as const;

const steps = [
  {
    title: 'Add the widget',
    text: 'Turnstile runs in the browser and puts a token into your form.',
    file: 'login.html',
    code: `<div class="cf-turnstile"
     data-sitekey="YOUR_SITE_KEY"></div>`,
  },
  {
    title: 'Register the module',
    text: 'Import it once with the secret key from the Cloudflare dashboard.',
    file: 'app.module.ts',
    code: `TurnstileModule.forRoot({
  secretKey: process.env.TURNSTILE_SECRET_KEY,
})`,
  },
  {
    title: 'Protect the route',
    text: 'Requests without a valid token get a 400 and never reach the handler.',
    file: 'auth.controller.ts',
    code: `@Post('login')
@TurnstileCaptcha()
login() {}`,
  },
].map((step) => ({ ...step, html: highlight(step.code) }));

const cards = [
  {
    title: 'Several Widgets, One App',
    text: 'Give a form its own widget and secret key, then name it on the routes that accept its tokens.',
    link: '/advanced.html#several-widgets',
    kind: 'code',
    body: highlight(`@Controller('newsletter')
@TurnstileCaptcha({ widget: 'newsletter' })
export class NewsletterController {}`),
  },
  {
    title: 'Metrics and Debug Logs',
    text: 'onVerify reports every check with its outcome and duration. Debug logs never contain tokens or secrets.',
    link: '/turnstile-options.html#onverify',
    kind: 'log',
    body: [
      'siteverify success: 1 attempt, 92 ms',
      'siteverify rejected [timeout-or-duplicate]: 1 attempt, 84 ms',
      'siteverify success for widget "newsletter": 2 attempts, 311 ms',
    ],
  },
  {
    title: 'A Wrong Key Fails the Deploy',
    text: 'With verifySecretOnStartup, the app checks each secret key with Cloudflare before it accepts requests.',
    link: '/turnstile-options.html#verifysecretonstartup',
    kind: 'error',
    body: [
      'Cloudflare refused the TurnstileModule secretKey [invalid-input-secret]. Check the key in the Cloudflare dashboard.',
    ],
  },
  {
    title: 'Easy to Test',
    text: 'Turn the guard off in tests, or swap in a stub that passes, rejects or spends every token without a network call.',
    link: '/testing.html',
    kind: 'code',
    body: highlight(`Test.createTestingModule({ imports: [AppModule] })
  .overrideProvider(TurnstileService)
  .useValue(createTurnstileServiceStub('fail'))`),
  },
] as const;

const stack = [
  {
    title: 'Server',
    items: [
      {
        icon: 'server',
        name: 'Express',
        note: 'The default HTTP adapter',
        link: '/get-started.html',
      },
      {
        icon: 'zap',
        name: 'Fastify',
        note: 'Same guard, nothing to change',
        link: '/advanced.html#fastify',
      },
      {
        icon: 'graph',
        name: 'GraphQL',
        note: 'Apollo or Mercurius resolvers',
        link: '/advanced.html#graphql',
      },
      {
        icon: 'radio',
        name: 'WebSockets',
        note: 'Gateways and their messages',
        link: '/advanced.html#websocket-gateways',
      },
    ],
  },
  {
    title: 'Browser',
    items: [
      {
        icon: 'code',
        name: 'React',
        note: 'With @marsidev/react-turnstile',
        link: '/frontend.html#react',
      },
      {
        icon: 'code',
        name: 'Next.js',
        note: 'Client forms and Server Actions',
        link: '/frontend.html#next-js',
      },
      {
        icon: 'code',
        name: 'Vue',
        note: 'With vue-turnstile',
        link: '/frontend.html#vue',
      },
      {
        icon: 'code',
        name: 'Angular',
        note: 'With ngx-turnstile',
        link: '/frontend.html#angular',
      },
    ],
  },
  {
    title: 'Project',
    items: [
      {
        icon: 'node',
        name: 'NestJS 10, 11 and 12',
        note: 'On Node.js 20 or later',
        link: '/get-started.html#install',
      },
      {
        icon: 'ts',
        name: 'TypeScript',
        note: 'Types ship with the package',
        link: '/turnstile-options.html',
      },
      {
        icon: 'package',
        name: 'No runtime dependencies',
        note: 'Only the Nest packages you have',
        link: '/get-started.html#install',
      },
      {
        icon: 'scale',
        name: 'MIT License',
        note: 'Free for any project',
        link: `${repo}/blob/main/LICENSE`,
      },
    ],
  },
] as const;

const footer = [
  {
    title: 'Guide',
    links: [
      ['Get started', '/get-started.html'],
      ['Frontend frameworks', '/frontend.html'],
      ['Options', '/turnstile-options.html'],
      ['Error handling', '/error-handling.html'],
      ['Testing', '/testing.html'],
      ['Advanced usage', '/advanced.html'],
    ],
  },
  {
    title: 'Migrating',
    links: [
      ['From 0.0.x to 1.0', '/migration.html'],
      ['From @nestlab/google-recaptcha', '/from-google-recaptcha.html'],
    ],
  },
  {
    title: 'Project',
    links: [
      ['GitHub', repo],
      ['npm', 'https://www.npmjs.com/package/nest-cloudflare-turnstile'],
      ['Changelog', `${repo}/blob/main/CHANGELOG.md`],
      ['Report an issue', `${repo}/issues`],
      ['Security policy', `${repo}/security/policy`],
    ],
  },
];

const href = (link: string) => (link.startsWith('http') ? link : page(link));
</script>

<template>
  <div class="home">
    <div class="frame">
      <!-- Hero -->
      <section class="hero">
        <a class="badge" :href="`${repo}/blob/main/CHANGELOG.md`">
          <span class="badge-handle l" aria-hidden="true" />
          <Icon name="shield" :size="17" />
          Turnstile for NestJS
          <span class="badge-version">v{{ version }}</span>
          <span class="badge-handle r" aria-hidden="true" />
        </a>

        <h1 class="hero-title">Stop Bots Before Your Handlers Run</h1>
        <p class="hero-text">
          nest-cloudflare-turnstile checks Cloudflare Turnstile tokens in a
          NestJS guard. Add one decorator and requests without a valid token
          never reach your code.
        </p>

        <div class="hero-actions">
          <a class="btn btn-primary" :href="page('/get-started.html')"
            >Get started</a
          >
          <a class="btn btn-outline" :href="repo">
            <Icon name="github" :size="17" />
            View on GitHub
          </a>
        </div>

        <button type="button" class="install" @click="copy">
          <span class="install-prompt" aria-hidden="true">$</span>
          <code>{{ command }}</code>
          <Icon :name="copied ? 'check' : 'copy'" :size="15" />
          <span class="visually-hidden">{{
            copied ? 'Copied' : 'Copy install command'
          }}</span>
        </button>

        <div class="hero-mock">
          <AppMockup />
        </div>
      </section>

      <!-- Features -->
      <section class="sec features">
        <div v-for="f in features" :key="f.title" class="feature">
          <Icon :name="f.icon" :size="22" />
          <h3>{{ f.title }}</h3>
          <p>{{ f.text }}</p>
        </div>
      </section>

      <!-- How it works -->
      <section class="sec">
        <header class="sec-head">
          <h2>Protect a Route in Three Steps</h2>
          <p>
            Turnstile runs a challenge in the browser and hands out a token.
            Your server asks Cloudflare whether that token is valid. This
            package does the server half.
          </p>
        </header>
        <ol class="steps">
          <li v-for="(s, i) in steps" :key="s.title" class="step">
            <div class="step-text">
              <span class="step-no">{{ i + 1 }}</span>
              <h3>{{ s.title }}</h3>
              <p>{{ s.text }}</p>
            </div>
            <div class="snippet">
              <div class="snippet-file">{{ s.file }}</div>
              <pre><code v-html="s.html" /></pre>
            </div>
          </li>
        </ol>
      </section>

      <!-- Production -->
      <section class="sec">
        <header class="sec-head">
          <h2>Built for Production</h2>
          <p>
            Hooks for metrics, logs you can leave on, and checks that catch
            setup mistakes before your users do.
          </p>
        </header>
        <div class="cards">
          <a
            v-for="c in cards"
            :key="c.title"
            class="card"
            :href="page(c.link)"
          >
            <div class="card-art">
              <pre
                v-if="c.kind === 'code'"
                class="art-code"
              ><code v-html="c.body" /></pre>
              <div v-else class="art-term" :class="{ err: c.kind === 'error' }">
                <p v-for="line in c.body" :key="line">
                  <span v-if="c.kind === 'log'" class="art-debug">DEBUG</span>
                  <span v-else class="art-error">ERROR</span>
                  <span class="art-ctx"
                    >[{{
                      c.kind === 'log' ? 'TurnstileModule' : 'ExceptionHandler'
                    }}]</span
                  >
                  {{ line }}
                </p>
              </div>
            </div>
            <div class="card-body">
              <h3>{{ c.title }}</h3>
              <p>{{ c.text }}</p>
              <span class="card-more"
                >Learn more <Icon name="arrow" :size="15"
              /></span>
            </div>
          </a>
        </div>
      </section>

      <!-- Stack -->
      <section class="sec">
        <header class="sec-head">
          <h2>Works With Your Stack</h2>
          <p>
            One guard for every transport Nest supports, and examples for the
            frontend frameworks people use most.
          </p>
        </header>
        <div class="stack">
          <div v-for="col in stack" :key="col.title" class="stack-col">
            <h3>{{ col.title }}</h3>
            <ul>
              <li v-for="item in col.items" :key="item.name">
                <a :href="href(item.link)">
                  <span class="stack-icon"
                    ><Icon :name="item.icon" :size="18"
                  /></span>
                  <span>
                    <span class="stack-name">{{ item.name }}</span>
                    <span class="stack-note">{{ item.note }}</span>
                  </span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- Call to action -->
      <section class="sec cta-wrap">
        <div class="cta">
          <h2>Add Turnstile to Your NestJS App</h2>
          <p>
            Free and open source under the MIT License. The guide goes from
            install to your first protected route.
          </p>
          <div class="cta-actions">
            <a class="btn btn-white" :href="page('/get-started.html')"
              >Read the guide</a
            >
            <a class="btn btn-ghost" :href="repo">View on GitHub</a>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="sec foot">
        <div class="foot-brand">
          <img :src="page('/logo.svg')" alt="" width="26" height="29" />
          <span>nest-cloudflare-turnstile</span>
        </div>
        <nav class="foot-cols" aria-label="Footer">
          <div v-for="col in footer" :key="col.title">
            <h3>{{ col.title }}</h3>
            <ul>
              <li v-for="[label, link] in col.links" :key="label">
                <a :href="href(link)">{{ label }}</a>
              </li>
            </ul>
          </div>
        </nav>
        <div class="foot-legal">
          <p>
            © 2024–{{ new Date().getFullYear() }} Halit Sever. Released under
            the MIT License.
          </p>
          <p>
            Cloudflare and Turnstile are trademarks of Cloudflare, Inc. This is
            a community project, not affiliated with Cloudflare.
          </p>
        </div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.home {
  --h-bg: #ffffff;
  --h-text: #171717;
  --h-muted: #525252;
  --h-soft: #737373;
  --h-line: #e5e5e5;
  --h-line-strong: #d4d4d4;
  --h-dot: #e5e5e5;
  --h-tint: #fbf8f5;
  --h-panel: #fafafa;
  background-color: var(--h-bg);
  background-image: radial-gradient(var(--h-dot) 1px, transparent 1px);
  background-size: 14px 14px;
  color: var(--h-text);
}

.dark .home {
  --h-bg: #0a0a0a;
  --h-text: #f5f5f5;
  --h-muted: #b3b3b3;
  --h-soft: #8f8f8f;
  --h-line: #262626;
  --h-line-strong: #3a3a3a;
  --h-dot: #1f1f1f;
  --h-tint: #141210;
  --h-panel: #121212;
}

.frame {
  max-width: 1200px;
  margin: 0 auto;
  background: var(--h-bg);
  border-left: 1px dashed var(--h-line-strong);
  border-right: 1px dashed var(--h-line-strong);
}

/* Each section starts with a rule and small square handles where it meets the frame. */
.sec {
  position: relative;
  border-top: 1px solid var(--h-line);
  padding: 88px 56px;
}

.sec::before,
.sec::after {
  content: '';
  position: absolute;
  top: -4px;
  width: 7px;
  height: 7px;
  border: 1px solid var(--h-line-strong);
  background: var(--h-bg);
}

.sec::before {
  left: -4px;
}

.sec::after {
  right: -4px;
}

h1,
h2,
h3 {
  font-family: var(--cf-font-display);
  color: var(--h-text);
  letter-spacing: -0.025em;
}

h3 {
  letter-spacing: -0.01em;
}

/* Hero */

.hero {
  padding: 72px 56px 72px;
  text-align: center;
}

.badge {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  border: 1px dashed var(--cf-orange);
  background: var(--cf-orange-tint);
  color: var(--cf-orange-text);
  font-size: 15px;
  font-weight: 500;
  text-decoration: none;
}

.badge-version {
  padding-left: 8px;
  border-left: 1px solid rgba(255, 94, 31, 0.35);
  font-size: 13px;
  color: var(--h-muted);
}

.badge-handle {
  position: absolute;
  top: 50%;
  width: 7px;
  height: 7px;
  border: 1px solid var(--cf-orange);
  border-radius: 50%;
  background: var(--h-bg);
  transform: translateY(-50%);
}

.badge-handle.l {
  left: -4px;
}

.badge-handle.r {
  right: -4px;
}

.hero-title {
  max-width: 900px;
  margin: 32px auto 0;
  font-size: clamp(2.4rem, 5.6vw, 4rem);
  font-weight: 500;
  line-height: 1.06;
  letter-spacing: -0.025em;
  text-wrap: balance;
}

.hero-text {
  max-width: 660px;
  margin: 24px auto 0;
  font-size: 19px;
  line-height: 1.55;
  color: var(--h-muted);
  text-wrap: pretty;
}

.hero-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 36px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 999px;
  font-size: 16px;
  font-weight: 500;
  text-decoration: none;
  transition:
    background-color 0.2s,
    border-color 0.2s,
    color 0.2s;
}

.btn-primary {
  background: var(--cf-orange);
  color: #fff;
}

.btn-primary:hover {
  background: var(--cf-orange-hover);
}

.btn-outline {
  border: 1px solid var(--h-line-strong);
  background: var(--h-bg);
  color: var(--h-text);
}

.btn-outline:hover {
  border-color: var(--h-text);
}

.btn:focus-visible,
.install:focus-visible,
.card:focus-visible {
  outline: 2px solid var(--cf-orange);
  outline-offset: 3px;
}

.install {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-top: 22px;
  padding: 8px 14px;
  border-radius: 8px;
  color: var(--h-soft);
  transition: color 0.2s;
}

.install:hover {
  color: var(--h-text);
}

.install code {
  font-family: var(--vp-font-family-mono);
  font-size: 14px;
  color: var(--h-text);
}

.install-prompt {
  font-family: var(--vp-font-family-mono);
  font-size: 14px;
  color: var(--cf-orange);
}

.hero-mock {
  max-width: 1040px;
  margin: 56px auto 0;
}

/* Features */

.features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: 0;
}

.feature {
  position: relative;
  padding: 40px 36px 44px;
  color: var(--h-text);
}

.feature + .feature {
  border-left: 1px solid var(--h-line);
}

.feature + .feature::before {
  content: '';
  position: absolute;
  top: -4px;
  left: -4px;
  width: 7px;
  height: 7px;
  border: 1px solid var(--h-line-strong);
  background: var(--h-bg);
}

.feature h3 {
  margin: 18px 0 8px;
  font-size: 18px;
  font-weight: 500;
}

.feature p {
  margin: 0;
  font-size: 15.5px;
  line-height: 1.6;
  color: var(--h-muted);
}

/* Section heads */

.sec-head {
  max-width: 720px;
  margin: 0 auto 56px;
  text-align: center;
}

.sec-head h2 {
  margin: 0;
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 500;
  line-height: 1.1;
}

.sec-head p {
  margin: 18px auto 0;
  max-width: 600px;
  font-size: 17px;
  line-height: 1.6;
  color: var(--h-muted);
}

/* Steps */

.steps {
  max-width: 960px;
  margin: 0 auto;
  padding: 0;
  list-style: none;
  border: 1px solid var(--h-line);
  border-radius: 12px;
  background: var(--h-bg);
}

.step {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  gap: 40px;
  align-items: center;
  padding: 32px;
}

.step + .step {
  border-top: 1px solid var(--h-line);
}

.step-no {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--cf-orange-tint);
  color: var(--cf-orange-text);
  font-size: 14px;
  font-weight: 600;
}

.step h3 {
  margin: 18px 0 6px;
  font-size: 18px;
  font-weight: 500;
}

.step p {
  margin: 0;
  font-size: 15px;
  line-height: 1.55;
  color: var(--h-muted);
}

.snippet {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--h-line);
  border-radius: 8px;
  background: var(--h-panel);
}

.snippet-file {
  padding: 7px 12px;
  border-bottom: 1px solid var(--h-line);
  font-family: var(--vp-font-family-mono);
  font-size: 11.5px;
  color: var(--h-soft);
}

.snippet pre,
.art-code {
  margin: 0;
  padding: 14px;
  overflow-x: auto;
  font-family: var(--vp-font-family-mono);
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--h-text);
}

/* Cards */

.cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--h-line);
  border-radius: 12px;
  background: var(--h-bg);
  color: inherit;
  text-decoration: none;
  transition: border-color 0.2s;
}

.card:hover {
  border-color: var(--h-line-strong);
}

.card:hover .card-more {
  color: var(--cf-orange-text);
}

.card-art {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-content: center;
  min-height: 190px;
  padding: 28px;
  border-bottom: 1px solid var(--h-line);
  background: var(--h-tint);
}

.art-code {
  padding: 16px 18px;
  border: 1px solid var(--h-line);
  border-radius: 8px;
  background: var(--h-bg);
  box-shadow: 0 10px 24px -18px rgba(0, 0, 0, 0.3);
}

.art-term {
  padding: 16px 18px;
  border-radius: 8px;
  background: #171717;
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  line-height: 1.7;
  color: #e5e5e5;
  box-shadow: 0 10px 24px -18px rgba(0, 0, 0, 0.5);
}

.art-term p {
  margin: 0;
}

.art-debug {
  color: #e879f9;
}

.art-error {
  color: #f87171;
}

.art-ctx {
  color: #facc15;
}

.art-term.err p {
  color: #fca5a5;
}

.card-body {
  padding: 24px 28px 28px;
}

.card-body h3 {
  margin: 0 0 8px;
  font-size: 19px;
  font-weight: 500;
}

.card-body p {
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  color: var(--h-muted);
}

.card-more {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 16px;
  font-size: 14.5px;
  font-weight: 500;
  color: var(--h-text);
  transition: color 0.2s;
}

/* Stack */

.stack {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border: 1px solid var(--h-line);
  border-radius: 12px;
  background: var(--h-bg);
}

.stack-col {
  padding: 28px;
}

.stack-col + .stack-col {
  border-left: 1px solid var(--h-line);
}

.stack-col h3 {
  margin: 0 0 14px;
  font-size: 13.5px;
  font-weight: 500;
  letter-spacing: 0;
  color: var(--h-soft);
}

.stack-col ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.stack-col a {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 10px 8px;
  margin: 0 -8px;
  border-radius: 8px;
  color: inherit;
  text-decoration: none;
  transition: background-color 0.15s;
}

.stack-col a:hover {
  background: var(--h-panel);
}

.stack-icon {
  display: grid;
  place-items: center;
  flex: none;
  width: 34px;
  height: 34px;
  border: 1px solid var(--h-line);
  border-radius: 8px;
  color: var(--h-text);
}

.stack-col a:hover .stack-icon {
  color: var(--cf-orange-text);
}

.stack-name {
  display: block;
  font-size: 15px;
  font-weight: 500;
}

.stack-note {
  display: block;
  font-size: 13.5px;
  color: var(--h-soft);
}

/* Call to action */

.cta-wrap {
  padding: 24px;
}

.cta {
  position: relative;
  overflow: hidden;
  padding: 88px 32px;
  border-radius: 16px;
  background:
    radial-gradient(
      60% 90% at 50% 120%,
      #ffb38a 0%,
      rgba(255, 179, 138, 0) 70%
    ),
    linear-gradient(180deg, #ff5e1f 0%, #f45216 100%);
  color: #fff;
  text-align: center;
}

.cta h2 {
  margin: 0;
  font-size: clamp(2rem, 4.4vw, 3.1rem);
  font-weight: 500;
  line-height: 1.08;
  color: #fff;
}

.cta p {
  margin: 18px auto 0;
  max-width: 520px;
  font-size: 17px;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.92);
}

.cta-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 32px;
}

.btn-white {
  background: #fff;
  color: #c2410c;
}

.btn-white:hover {
  background: #fff4ee;
}

.btn-ghost {
  border: 1px solid rgba(255, 255, 255, 0.55);
  color: #fff;
}

.btn-ghost:hover {
  border-color: #fff;
}

.cta .btn:focus-visible {
  outline-color: #fff;
}

/* Footer */

.foot {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 40px;
  padding: 56px;
}

.foot-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  align-self: start;
  font-family: var(--cf-font-display);
  font-size: 16px;
  font-weight: 600;
}

.foot-cols {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}

.foot-cols h3 {
  margin: 0 0 12px;
  font-size: 13.5px;
  font-weight: 500;
  letter-spacing: 0;
  color: var(--h-soft);
}

.foot-cols ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.foot-cols li + li {
  margin-top: 8px;
}

.foot-cols a {
  font-size: 14.5px;
  color: var(--h-text);
  text-decoration: none;
}

.foot-cols a:hover {
  color: var(--cf-orange-text);
}

.foot-legal {
  grid-column: 1 / -1;
  padding-top: 28px;
  border-top: 1px solid var(--h-line);
  font-size: 13px;
  line-height: 1.6;
  color: var(--h-soft);
}

.foot-legal p {
  margin: 0;
}

/* Tokens from highlight() */
.home :deep(.tk-k) {
  color: #c2410c;
}
.home :deep(.tk-s) {
  color: #0f7b3f;
}
.home :deep(.tk-d) {
  color: #e8530f;
  font-weight: 600;
}
.home :deep(.tk-y) {
  color: #0e7490;
}
.home :deep(.tk-f) {
  color: #1d4ed8;
}
.home :deep(.tk-t) {
  color: #c2410c;
}
.home :deep(.tk-a) {
  color: #1d4ed8;
}
.home :deep(.tk-n) {
  color: #a21caf;
}
.home :deep(.tk-c) {
  color: #8a8a8a;
  font-style: italic;
}

.dark .home :deep(.tk-k),
.dark .home :deep(.tk-t) {
  color: #fb923c;
}
.dark .home :deep(.tk-s) {
  color: #86d9a6;
}
.dark .home :deep(.tk-d) {
  color: #ff7a3d;
}
.dark .home :deep(.tk-y) {
  color: #67d4e8;
}
.dark .home :deep(.tk-f),
.dark .home :deep(.tk-a) {
  color: #93b9fd;
}
.dark .home :deep(.tk-n) {
  color: #e3a3f5;
}

@media (max-width: 960px) {
  .features,
  .stack,
  .step {
    grid-template-columns: 1fr;
  }

  .step {
    gap: 20px;
    padding: 24px 20px;
  }

  .feature + .feature,
  .stack-col + .stack-col {
    border-left: none;
    border-top: 1px solid var(--h-line);
  }

  .feature + .feature::before {
    display: none;
  }

  .cards {
    grid-template-columns: 1fr;
  }

  .foot {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .frame {
    border: none;
  }

  .sec,
  .hero {
    padding-left: 16px;
    padding-right: 16px;
  }

  .sec {
    padding-top: 64px;
    padding-bottom: 64px;
  }

  .sec::before,
  .sec::after {
    display: none;
  }

  .hero {
    padding-top: 56px;
  }

  .hero-text {
    font-size: 17px;
  }

  .features {
    padding: 0;
  }

  .feature {
    padding: 32px 16px;
  }

  .cta-wrap {
    padding: 16px;
  }

  .cta {
    padding: 56px 20px;
  }

  .foot {
    padding: 40px 16px;
  }

  .foot-cols {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
