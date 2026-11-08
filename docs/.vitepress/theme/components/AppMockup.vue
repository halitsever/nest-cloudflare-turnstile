<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { highlight } from '../highlight';

type Kind = 'valid' | 'reused' | 'none';
type Widget = 'idle' | 'verifying' | 'success' | 'absent';

interface LogLine {
  level: 'LOG' | 'DEBUG';
  context: string;
  text: string;
}

interface Response {
  ok: boolean;
  status: string;
  body: string;
}

const TABS: { kind: Kind; label: string }[] = [
  { kind: 'valid', label: 'Valid token' },
  { kind: 'reused', label: 'Reused token' },
  { kind: 'none', label: 'No token' },
];

const CODE = `import { Controller, Post } from '@nestjs/common';
import { TurnstileCaptcha } from 'nest-cloudflare-turnstile';

@Controller('auth')
export class AuthController {
  @Post('login')
  @TurnstileCaptcha()
  login() {
    // Runs only after Cloudflare accepted the token.
  }
}`;

const lines = CODE.split('\n').map(highlight);
const GUARD_LINE = 7;

const STARTED: LogLine = {
  level: 'LOG',
  context: 'NestApplication',
  text: 'Nest application successfully started',
};

const active = ref<Kind>('valid');
const widget = ref<Widget>('idle');
const pressing = ref(false);
const logs = ref<LogLine[]>([STARTED]);
const guard = ref<'idle' | 'checking' | 'pass' | 'fail'>('idle');
const response = ref<Response | null>(null);
let timers: ReturnType<typeof setTimeout>[] = [];

function badRequest(message: string): Response {
  return {
    ok: false,
    status: '400 Bad Request',
    body: JSON.stringify({ message, error: 'Bad Request', statusCode: 400 }),
  };
}

function plan(kind: Kind): [number, () => void][] {
  const debug = (text: string) => () =>
    logs.value.push({ level: 'DEBUG', context: 'TurnstileModule', text });
  const press = (at: number): [number, () => void][] => [
    [at, () => (pressing.value = true)],
    [at + 220, () => ((pressing.value = false), (guard.value = 'checking'))],
  ];

  if (kind === 'valid') {
    return [
      [200, () => (widget.value = 'verifying')],
      [1300, () => (widget.value = 'success')],
      ...press(1750),
      [2350, debug('siteverify success: 1 attempt, 92 ms')],
      [2400, () => (guard.value = 'pass')],
      [
        2650,
        () => (response.value = { ok: true, status: '201 Created', body: '' }),
      ],
    ];
  }
  if (kind === 'reused') {
    return [
      [0, () => (widget.value = 'success')],
      ...press(450),
      [
        1000,
        debug('siteverify rejected [timeout-or-duplicate]: 1 attempt, 84 ms'),
      ],
      [1050, () => (guard.value = 'fail')],
      [
        1300,
        () =>
          (response.value = badRequest('Invalid turnstile verification code.')),
      ],
    ];
  }
  return [
    [0, () => (widget.value = 'absent')],
    ...press(450),
    [950, () => (guard.value = 'fail')],
    [
      1200,
      () =>
        (response.value = badRequest('Missing turnstile verification code.')),
    ],
  ];
}

function run(kind: Kind) {
  timers.forEach(clearTimeout);
  timers = [];
  active.value = kind;
  widget.value = 'idle';
  pressing.value = false;
  guard.value = 'idle';
  response.value = null;
  logs.value = [STARTED];

  const steps = plan(kind);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    steps.forEach(([, step]) => step());
    pressing.value = false;
    return;
  }
  for (const [at, step] of steps) timers.push(setTimeout(step, at));
}

onMounted(() => timers.push(setTimeout(() => run('valid'), 400)));
onBeforeUnmount(() => timers.forEach(clearTimeout));
</script>

<template>
  <div class="mock">
    <div class="mock-tabs" role="group" aria-label="Request to send">
      <button
        v-for="tab in TABS"
        :key="tab.kind"
        type="button"
        class="mock-tab"
        :class="{ on: active === tab.kind }"
        :aria-pressed="active === tab.kind"
        @click="run(tab.kind)"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="win">
      <div class="win-bar">
        <span class="win-dots" aria-hidden="true"><i /><i /><i /></span>
        <span class="win-url">localhost:3000/login</span>
      </div>

      <div class="win-body">
        <div class="pane-browser">
          <div class="login">
            <p class="login-title">Sign in</p>
            <div class="field">
              <span>Email</span>
              <span class="input">ada@example.com</span>
            </div>
            <div class="field">
              <span>Password</span>
              <span class="input">••••••••••</span>
            </div>

            <div class="widget" :class="`is-${widget}`">
              <template v-if="widget === 'absent'">
                No Turnstile widget on this form
              </template>
              <template v-else>
                <span class="widget-box" aria-hidden="true">
                  <svg v-if="widget === 'success'" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="11" />
                    <path d="m7 12.5 3.2 3.2L17 9" />
                  </svg>
                </span>
                <span class="widget-text">{{
                  widget === 'success'
                    ? 'Success!'
                    : widget === 'verifying'
                      ? 'Verifying…'
                      : 'Verify you are human'
                }}</span>
                <span class="widget-tag">Turnstile</span>
              </template>
            </div>

            <span class="login-btn" :class="{ pressed: pressing }"
              >Sign in</span
            >

            <div
              class="toast"
              :class="{ show: response, ok: response?.ok }"
              aria-live="polite"
            >
              <template v-if="response">
                <span class="toast-status">{{ response.status }}</span>
                <span class="toast-body">{{
                  response.ok
                    ? 'login() ran. The visitor is signed in.'
                    : response.body
                }}</span>
              </template>
            </div>
          </div>
        </div>

        <div class="pane-side">
          <div class="editor">
            <div class="editor-tabs">
              <span class="editor-tab on">auth.controller.ts</span>
              <span class="editor-tab">app.module.ts</span>
            </div>
            <pre class="editor-code"><code><span
              v-for="(line, i) in lines"
              :key="i"
              class="ln"
              :class="{ [`guard-${guard}`]: i + 1 === GUARD_LINE }"
            ><span class="ln-no">{{ i + 1 }}</span><span v-html="line || ' '" /></span></code></pre>
          </div>

          <div class="term">
            <div class="term-head">Terminal</div>
            <div class="term-body">
              <p v-for="(log, i) in logs" :key="i" class="term-line">
                <span :class="log.level === 'LOG' ? 'term-log' : 'term-debug'"
                  >[Nest] 4821 - {{ log.level.padStart(5) }}</span
                >{{ ' ' }}
                <span class="term-ctx">[{{ log.context }}]</span>
                {{ log.text }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mock {
  --m-bg: #ffffff;
  --m-panel: #fafafa;
  --m-line: #e5e5e5;
  --m-text: #171717;
  --m-muted: #737373;
  --m-code-bg: #fcfcfc;
  --m-term-bg: #171717;
  --m-pass: #16a34a;
  --m-fail: #dc2626;
}

.dark .mock {
  --m-bg: #141414;
  --m-panel: #1a1a1a;
  --m-line: #2a2a2a;
  --m-text: #f5f5f5;
  --m-muted: #a3a3a3;
  --m-code-bg: #121212;
  --m-term-bg: #0b0b0b;
  --m-pass: #4ade80;
  --m-fail: #f87171;
}

.mock-tabs {
  display: flex;
  justify-content: center;
  gap: 4px;
  width: fit-content;
  margin: 0 auto 20px;
  padding: 4px;
  border: 1px solid var(--m-line);
  border-radius: 999px;
  background: var(--m-bg);
}

.mock-tab {
  padding: 7px 16px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 500;
  color: var(--m-muted);
  transition:
    background-color 0.2s,
    color 0.2s;
}

.mock-tab:hover {
  color: var(--m-text);
}

.mock-tab.on {
  background: var(--m-text);
  color: var(--m-bg);
}

.mock-tab:focus-visible {
  outline: 2px solid var(--cf-orange);
  outline-offset: 2px;
}

.win {
  overflow: hidden;
  border: 1px solid var(--m-line);
  border-radius: 14px;
  background: var(--m-bg);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 24px 48px -24px rgba(0, 0, 0, 0.18);
  text-align: left;
}

.win-bar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 42px;
  border-bottom: 1px solid var(--m-line);
  background: var(--m-panel);
}

.win-dots {
  position: absolute;
  left: 16px;
  display: flex;
  gap: 7px;
}

.win-dots i {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: var(--m-line);
}

.win-url {
  padding: 4px 40px;
  border: 1px solid var(--m-line);
  border-radius: 7px;
  background: var(--m-bg);
  font-size: 12.5px;
  color: var(--m-muted);
}

.win-body {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  min-height: 440px;
}

/* Browser pane */

.pane-browser {
  display: grid;
  place-items: center;
  padding: 32px 28px;
  border-right: 1px solid var(--m-line);
  background-color: var(--m-panel);
  background-image: radial-gradient(var(--m-line) 1px, transparent 1px);
  background-size: 16px 16px;
}

.login {
  width: 100%;
  max-width: 330px;
  padding: 24px;
  border: 1px solid var(--m-line);
  border-radius: 12px;
  background: var(--m-bg);
  box-shadow: 0 8px 24px -16px rgba(0, 0, 0, 0.25);
}

.login-title {
  margin: 0 0 16px;
  font-family: var(--cf-font-display);
  font-size: 20px;
  font-weight: 600;
  color: var(--m-text);
}

.field {
  display: block;
  margin-bottom: 12px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--m-muted);
}

.input {
  display: block;
  margin-top: 5px;
  padding: 8px 11px;
  border: 1px solid var(--m-line);
  border-radius: 7px;
  font-size: 14px;
  font-weight: 400;
  color: var(--m-text);
}

.widget {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 58px;
  margin: 16px 0 14px;
  padding: 0 14px;
  border: 1px solid var(--m-line);
  border-radius: 6px;
  background: var(--m-panel);
  font-size: 14px;
  color: var(--m-text);
}

.widget.is-absent {
  justify-content: center;
  border-style: dashed;
  background: transparent;
  font-size: 13px;
  color: var(--m-muted);
}

.widget-box {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border: 2px solid #b5b5b5;
  border-radius: 4px;
  background: var(--m-bg);
}

.is-verifying .widget-box {
  border: 2.5px solid var(--m-line);
  border-top-color: var(--cf-orange);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.is-success .widget-box {
  border: none;
  background: none;
}

.widget-box svg {
  width: 26px;
  height: 26px;
  animation: pop 0.3s ease-out;
}

.widget-box circle {
  fill: var(--m-pass);
}

.widget-box path {
  fill: none;
  stroke: #fff;
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.widget-tag {
  margin-left: auto;
  font-size: 11px;
  font-weight: 600;
  color: var(--m-muted);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pop {
  from {
    transform: scale(0.4);
    opacity: 0;
  }
}

.login-btn {
  display: block;
  padding: 10px;
  border-radius: 7px;
  background: var(--m-text);
  color: var(--m-bg);
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  transition: transform 0.12s;
}

.login-btn.pressed {
  transform: scale(0.97);
}

.toast {
  display: grid;
  gap: 4px;
  min-height: 0;
  margin-top: 0;
  padding: 0 12px;
  border-radius: 8px;
  overflow: hidden;
  max-height: 0;
  opacity: 0;
  transition:
    max-height 0.3s,
    opacity 0.3s,
    margin-top 0.3s,
    padding 0.3s;
}

.toast.show {
  max-height: 140px;
  margin-top: 14px;
  padding: 10px 12px;
  opacity: 1;
  background: rgba(220, 38, 38, 0.08);
  box-shadow: inset 0 0 0 1px rgba(220, 38, 38, 0.25);
}

.toast.show.ok {
  background: rgba(22, 163, 74, 0.08);
  box-shadow: inset 0 0 0 1px rgba(22, 163, 74, 0.28);
}

.toast-status {
  font-size: 13px;
  font-weight: 700;
  color: var(--m-fail);
}

.ok .toast-status {
  color: var(--m-pass);
}

.toast-body {
  font-family: var(--vp-font-family-mono);
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--m-text);
  word-break: break-word;
}

.ok .toast-body {
  font-family: var(--vp-font-family-base);
  font-size: 13px;
}

/* Editor and terminal */

.pane-side {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: 1fr auto;
  min-width: 0;
}

.editor {
  min-width: 0;
  background: var(--m-code-bg);
}

.editor-tabs {
  display: flex;
  border-bottom: 1px solid var(--m-line);
}

.editor-tab {
  padding: 9px 16px;
  border-right: 1px solid var(--m-line);
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: var(--m-muted);
}

.editor-tab.on {
  color: var(--m-text);
  background: var(--m-bg);
  box-shadow: inset 0 -2px 0 var(--cf-orange);
}

.editor-code {
  margin: 0;
  padding: 14px 0;
  overflow-x: auto;
  font-family: var(--vp-font-family-mono);
  font-size: 12.5px;
  line-height: 1.75;
  color: var(--m-text);
}

.ln {
  display: block;
  padding: 0 20px 0 0;
  white-space: pre;
  transition: background-color 0.25s;
}

.ln-no {
  display: inline-block;
  width: 44px;
  padding-right: 16px;
  text-align: right;
  color: var(--m-muted);
  opacity: 0.6;
  user-select: none;
}

.ln.guard-checking {
  background: rgba(255, 94, 31, 0.1);
  box-shadow: inset 2px 0 0 var(--cf-orange);
}

.ln.guard-pass {
  background: rgba(22, 163, 74, 0.1);
  box-shadow: inset 2px 0 0 var(--m-pass);
}

.ln.guard-fail {
  background: rgba(220, 38, 38, 0.1);
  box-shadow: inset 2px 0 0 var(--m-fail);
}

.term {
  background: var(--m-term-bg);
  color: #e5e5e5;
}

.term-head {
  padding: 8px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 12px;
  font-weight: 500;
  color: #a3a3a3;
}

.term-body {
  height: 112px;
  padding: 10px 16px;
  overflow: hidden;
  font-family: var(--vp-font-family-mono);
  font-size: 11.5px;
  line-height: 1.7;
}

.term-line {
  margin: 0;
  white-space: pre;
  overflow: hidden;
  text-overflow: ellipsis;
  animation: fade 0.3s ease-out;
}

.term-log {
  color: #4ade80;
}

.term-debug {
  color: #e879f9;
}

.term-ctx {
  color: #facc15;
}

@keyframes fade {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
}

/* Tokens from highlight() */
.editor-code :deep(.tk-k) {
  color: #c2410c;
}
.editor-code :deep(.tk-s) {
  color: #0f7b3f;
}
.editor-code :deep(.tk-d) {
  color: #e8530f;
  font-weight: 600;
}
.editor-code :deep(.tk-y) {
  color: #0e7490;
}
.editor-code :deep(.tk-f) {
  color: #1d4ed8;
}
.editor-code :deep(.tk-c) {
  color: #8a8a8a;
  font-style: italic;
}

.dark .editor-code :deep(.tk-k) {
  color: #fb923c;
}
.dark .editor-code :deep(.tk-s) {
  color: #86d9a6;
}
.dark .editor-code :deep(.tk-d) {
  color: #ff7a3d;
}
.dark .editor-code :deep(.tk-y) {
  color: #67d4e8;
}
.dark .editor-code :deep(.tk-f) {
  color: #93b9fd;
}
.dark .editor-code :deep(.tk-c) {
  color: #7a7a7a;
}

@media (max-width: 860px) {
  .win-body {
    grid-template-columns: minmax(0, 1fr);
  }

  .pane-browser {
    border-right: none;
    border-bottom: 1px solid var(--m-line);
  }
}

@media (max-width: 520px) {
  .mock-tab {
    padding: 7px 11px;
    font-size: 13px;
  }

  .win-url {
    padding: 4px 16px;
  }

  .pane-browser {
    padding: 20px 14px;
  }
}
</style>
