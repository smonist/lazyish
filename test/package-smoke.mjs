import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const esm = await import('lazyish');
assert.equal(typeof esm.default, 'function', 'ESM default export must be callable');

const require = createRequire(import.meta.url);
assert.equal(typeof require('lazyish'), 'function', 'CommonJS export must be callable');

const context = {};
vm.runInNewContext(
  readFileSync(new URL('../dist/lazyish.iife.js', import.meta.url), 'utf8'),
  context,
);
assert.equal(typeof context.lazyish, 'function', 'IIFE global must be callable');

assert.ok(
  existsSync(new URL('../dist/types/index.d.ts', import.meta.url)),
  'Type declarations must be generated',
);
