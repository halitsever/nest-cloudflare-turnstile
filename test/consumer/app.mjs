import 'reflect-metadata';
import * as common from '@nestjs/common';
import * as core from '@nestjs/core';
import * as websockets from '@nestjs/websockets';
import {
  TurnstileCaptcha,
  TurnstileModule,
  TurnstileResult,
} from 'nest-cloudflare-turnstile';
import { runProbes } from './probe.mjs';

await runProbes(
  'esm',
  { common, core, websockets },
  { TurnstileCaptcha, TurnstileModule, TurnstileResult },
);
