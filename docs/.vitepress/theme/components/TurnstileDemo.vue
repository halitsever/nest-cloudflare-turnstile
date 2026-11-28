<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

/** Cloudflare's published test keys: they work on any hostname and never see a real visitor. */
const keys = [
  {
    id: 'pass',
    label: 'Always passes',
    sitekey: '1x00000000000000000000AA',
    secret: '1x0000000000000000000000000000000AA',
  },
  {
    id: 'fail',
    label: 'Always fails',
    sitekey: '2x00000000000000000000AB',
    secret: '1x0000000000000000000000000000000AA',
  },
  {
    id: 'interactive',
    label: 'Forces a challenge',
    sitekey: '3x00000000000000000000FF',
    secret: '1x0000000000000000000000000000000AA',
  },
] as const;

type Status =
  'loading' | 'waiting' | 'passed' | 'failed' | 'expired' | 'blocked';

const keyId = ref<(typeof keys)[number]['id']>('pass');
const theme = ref<'auto' | 'light' | 'dark'>('auto');
const size = ref<'normal' | 'flexible' | 'compact'>('normal');
const status = ref<Status>('loading');
const token = ref('');
const errorCode = ref('');
const container = ref<HTMLElement | null>(null);

const key = computed(() => keys.find((k) => k.id === keyId.value)!);

let widgetId: string | undefined;
let api: any;

const SCRIPT =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

function loadApi(): Promise<any> {
  const w = window as any;
  if (w.turnstile) return Promise.resolve(w.turnstile);
  return new Promise((resolve, reject) => {
    let script = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT}"]`,
    );
    if (!script) {
      script = document.createElement('script');
      script.src = SCRIPT;
      script.async = true;
      document.head.appendChild(script);
    }
    script.addEventListener('load', () => resolve(w.turnstile));
    script.addEventListener('error', () => reject(new Error('blocked')));
  });
}

function render() {
  if (!api || !container.value) return;
  if (widgetId !== undefined) api.remove(widgetId);
  token.value = '';
  errorCode.value = '';
  status.value = 'waiting';
  widgetId = api.render(container.value, {
    sitekey: key.value.sitekey,
    theme: theme.value,
    size: size.value,
    action: 'login',
    /** one clear failure instead of a retry every 8 seconds */
    retry: 'never',
    callback: (t: string) => {
      token.value = t;
      status.value = 'passed';
    },
    'error-callback': (code: string) => {
      errorCode.value = String(code);
      status.value = 'failed';
      /** true tells Turnstile the error is handled, so it does not throw */
      return true;
    },
    'expired-callback': () => {
      token.value = '';
      status.value = 'expired';
    },
  });
}

function reset() {
  if (api && widgetId !== undefined) {
    api.reset(widgetId);
    token.value = '';
    errorCode.value = '';
    status.value = 'waiting';
  }
}

onMounted(async () => {
  try {
    api = await loadApi();
    render();
  } catch {
    status.value = 'blocked';
  }
});

watch([keyId, theme, size], render);

onBeforeUnmount(() => {
  if (api && widgetId !== undefined) api.remove(widgetId);
});

const verdict = computed(() => {
  switch (status.value) {
    case 'passed':
      return {
        tone: 'ok',
        title: 'The guard lets the request through',
        text: `Siteverify accepts the dummy token for the test secret ${key.value.secret}. The guard skips the hostname and action checks because the result comes from a test key, and the handler runs.`,
      };
    case 'failed':
      return {
        tone: 'bad',
        title: '400 Missing turnstile verification code.',
        text: 'The widget produced no token, so the form would send an empty cf-turnstile-response field. The guard refuses it before calling Cloudflare.',
      };
    case 'expired':
      return {
        tone: 'bad',
        title: 'Token expired',
        text: 'Tokens live for 300 seconds. Reset the widget to get a fresh one.',
      };
    default:
      return null;
  }
});
</script>

<template>
  <div class="ts-demo">
    <div class="ts-controls">
      <fieldset>
        <legend>Test site key</legend>
        <label v-for="k in keys" :key="k.id" class="ts-radio">
          <input v-model="keyId" type="radio" name="ts-key" :value="k.id" />
          <span>
            <strong>{{ k.label }}</strong>
            <code>{{ k.sitekey }}</code>
          </span>
        </label>
      </fieldset>
      <div class="ts-selects">
        <label>
          Theme
          <select v-model="theme">
            <option value="auto">auto</option>
            <option value="light">light</option>
            <option value="dark">dark</option>
          </select>
        </label>
        <label>
          Size
          <select v-model="size">
            <option value="normal">normal</option>
            <option value="flexible">flexible</option>
            <option value="compact">compact</option>
          </select>
        </label>
      </div>
    </div>

    <div class="ts-stage">
      <div ref="container" class="ts-widget" />
      <p v-if="status === 'loading'" class="ts-note">
        Loading the Turnstile script from challenges.cloudflare.com...
      </p>
      <p v-else-if="status === 'blocked'" class="ts-note ts-bad">
        The Turnstile script could not load. An ad blocker or a network filter
        may be blocking challenges.cloudflare.com.
      </p>
      <p v-else-if="status === 'waiting'" class="ts-note">
        {{
          keyId === 'interactive'
            ? 'Click the checkbox to solve the challenge.'
            : 'Running the challenge...'
        }}
      </p>
      <p v-else-if="status === 'failed'" class="ts-note ts-bad">
        The widget reported error <code>{{ errorCode }}</code> through
        <code>error-callback</code>.
      </p>
      <button
        type="button"
        class="ts-reset"
        :disabled="status === 'loading' || status === 'blocked'"
        @click="reset"
      >
        Reset widget
      </button>
    </div>

    <div class="ts-output" aria-live="polite">
      <div class="ts-field">
        <span class="ts-label">cf-turnstile-response</span>
        <code class="ts-token">{{ token || '(empty)' }}</code>
      </div>
      <div v-if="verdict" class="ts-verdict" :class="verdict.tone">
        <strong>{{ verdict.title }}</strong>
        <p>{{ verdict.text }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ts-demo {
  margin: 24px 0;
  padding: 20px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-alt);
}

.ts-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 32px;
}

fieldset {
  margin: 0;
  padding: 0;
  border: 0;
  min-width: 0;
}

legend,
.ts-selects label,
.ts-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-2);
}

.ts-radio {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin-top: 8px;
  cursor: pointer;
}

.ts-radio input {
  margin-top: 6px;
  accent-color: var(--cf-orange);
}

.ts-radio span {
  display: flex;
  flex-direction: column;
  line-height: 1.4;
}

.ts-radio strong {
  font-size: 15px;
}

.ts-radio code {
  font-size: 12.5px;
  color: var(--vp-c-text-2);
  overflow-wrap: anywhere;
}

.ts-selects {
  display: flex;
  gap: 16px;
}

.ts-selects label {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ts-selects select {
  padding: 6px 10px;
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 14px;
}

.ts-stage {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--vp-c-divider);
}

.ts-widget {
  max-width: 100%;
  min-height: 65px;
}

.ts-note {
  margin: 10px 0 0;
  font-size: 14px;
  color: var(--vp-c-text-2);
}

.ts-bad {
  color: var(--vp-c-danger-1);
}

.ts-reset {
  margin-top: 12px;
  padding: 6px 14px;
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  background: var(--vp-c-bg);
  font-size: 14px;
  font-weight: 500;
}

.ts-reset:hover:not(:disabled) {
  border-color: var(--cf-orange);
}

.ts-reset:disabled {
  opacity: 0.5;
}

.ts-output {
  margin-top: 20px;
}

.ts-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ts-token {
  display: block;
  padding: 10px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  font-size: 13px;
  overflow-wrap: anywhere;
}

.ts-verdict {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 8px;
  border-left: 3px solid;
}

.ts-verdict.ok {
  border-color: var(--vp-c-tip-1);
  background: var(--vp-c-tip-soft);
}

.ts-verdict.bad {
  border-color: var(--vp-c-danger-1);
  background: var(--vp-c-danger-soft);
}

.ts-verdict p {
  margin: 4px 0 0;
  font-size: 14px;
  line-height: 1.6;
}
</style>
