require('reflect-metadata');
const common = require('@nestjs/common');
const core = require('@nestjs/core');
const turnstile = require('nest-cloudflare-turnstile');

import('./probe.mjs').then(({ runProbes }) =>
  runProbes('cjs', { common, core }, turnstile),
);
