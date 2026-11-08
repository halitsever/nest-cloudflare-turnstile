<script setup lang="ts">
import { withBase } from 'vitepress';
</script>

<template>
  <div class="nf">
    <p class="nf-code">404</p>
    <h1 class="nf-title">This page does not exist</h1>
    <p class="nf-text">
      The address may be mistyped, or the page moved. The guide lists every
      page.
    </p>
    <div class="nf-actions">
      <a class="nf-btn primary" :href="withBase('/get-started.html')"
        >Go to the guide</a
      >
      <a class="nf-btn" :href="withBase('/')">Home</a>
    </div>
  </div>
</template>

<style scoped>
.nf {
  max-width: 560px;
  margin: 0 auto;
  padding: 120px 24px 140px;
  text-align: center;
}

.nf-code {
  display: inline-block;
  margin: 0;
  padding: 4px 12px;
  border: 1px dashed var(--cf-orange);
  background: var(--cf-orange-tint);
  color: var(--cf-orange-text);
  font-family: var(--vp-font-family-mono);
  font-size: 14px;
}

.nf-title {
  margin: 28px 0 0;
  font-family: var(--cf-font-display);
  font-size: clamp(2rem, 6vw, 2.75rem);
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: -0.03em;
}

.nf-text {
  margin: 16px 0 0;
  font-size: 17px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

.nf-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 32px;
}

.nf-btn {
  padding: 11px 22px;
  border: 1px solid var(--vp-c-border);
  border-radius: 999px;
  color: var(--vp-c-text-1);
  font-weight: 500;
  text-decoration: none;
}

.nf-btn.primary {
  border-color: var(--cf-orange);
  background: var(--cf-orange);
  color: #fff;
}

.nf-btn:focus-visible {
  outline: 2px solid var(--cf-orange);
  outline-offset: 3px;
}
</style>
