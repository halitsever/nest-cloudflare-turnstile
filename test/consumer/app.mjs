import 'reflect-metadata';
import * as common from '@nestjs/common';
import * as core from '@nestjs/core';
import { TurnstileCaptcha, TurnstileModule } from 'nest-cloudflare-turnstile';
import { runProbes } from './probe.mjs';

await runProbes('esm', { common, core }, { TurnstileCaptcha, TurnstileModule });
