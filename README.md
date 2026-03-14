# lazyish

A lightweight, zero-dependency lazy loading micro-library using native browser APIs (IntersectionObserver, MutationObserver, ResizeObserver).

[![CI](https://github.com/smonist/lazyish/actions/workflows/ci.yml/badge.svg)](https://github.com/smonist/lazyish/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/lazyish.svg)](https://badge.fury.io/js/lazyish)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🚀 **Tiny** – under 2 KB minified + gzipped
- 🔌 **Zero dependencies** – uses native browser APIs only
- 📦 **ESM / CJS / IIFE** – works everywhere
- 🖼️ **Images** – `data-src`, `data-srcset`, `data-sizes="auto"`
- 🎨 **Background images** – `data-bg` on any element
- 📺 **Iframes** – lazy-load `<iframe>` with `data-src`
- ⚡ **SPA-friendly** – auto-discovers new elements via MutationObserver
- 📐 **Responsive** – auto-updates `sizes` via ResizeObserver
- 🎯 **TypeScript** – fully typed

## Installation

```bash
npm install lazyish
```

Or via CDN:

```html
<script src="https://unpkg.com/lazyish/dist/lazyish.iife.js"></script>
```

## Quick Start

```html
<!-- Mark images with class="lazyload" and data-src -->
<img class="lazyload" data-src="image.jpg" alt="My image">

<!-- Responsive images -->
<img class="lazyload"
     data-src="image-800.jpg"
     data-srcset="image-400.jpg 400w, image-800.jpg 800w"
     data-sizes="auto"
     alt="Responsive image">

<!-- Background images -->
<div class="lazyload" data-bg="hero.jpg"></div>

<!-- Iframes -->
<iframe class="lazyload" data-src="https://example.com" title="Lazy iframe"></iframe>
```

```js
import lazyish from 'lazyish';

// Initialize with defaults
lazyish();

// Or with custom options
lazyish({
  selector: '.lazyload',
  rootMargin: '200px',
  classLoaded: 'lazyloaded',
  onLoad: (el) => console.log('Loaded:', el),
});
```

## API

### `lazyish(options?): LazyishInstance`

Initializes lazy loading and returns an instance.

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `selector` | `string` | `'.lazyload'` | CSS selector for lazy elements |
| `classLoading` | `string` | `'lazyloading'` | Class added while loading |
| `classLoaded` | `string` | `'lazyloaded'` | Class added when loaded |
| `classError` | `string` | `'lazyerror'` | Class added on error |
| `rootMargin` | `string` | `'200px'` | IntersectionObserver root margin |
| `threshold` | `number\|number[]` | `0` | IntersectionObserver threshold |
| `observeDOM` | `boolean` | `true` | Auto-discover new elements |
| `autoSizes` | `boolean` | `true` | Auto-compute `sizes` attribute |
| `backgroundImages` | `boolean` | `true` | Support `data-bg` |
| `onLoad` | `(el) => void` | — | Callback on successful load |
| `onError` | `(el) => void` | — | Callback on load error |
| `onBeforeUnveil` | `(el) => void` | — | Callback before unveiling |

### Instance Methods

| Method | Description |
|--------|-------------|
| `observe(el)` | Manually observe an element |
| `triggerLoad(el)` | Force-load an element immediately |
| `update()` | Re-scan DOM for new elements |
| `destroy()` | Tear down all observers |

## Examples

See the [`examples/`](examples/) directory:

- [`basic.html`](examples/basic.html) – Simple image lazy loading
- [`responsive.html`](examples/responsive.html) – Responsive images with `data-sizes="auto"`
- [`background.html`](examples/background.html) – Background images with `data-bg`
- [`iframe.html`](examples/iframe.html) – Lazy-loaded iframes with `data-src`
- [`spa.html`](examples/spa.html) – SPA / dynamic content with MutationObserver

## CSS

Add transitions for smooth loading:

```css
img {
  opacity: 0;
  transition: opacity 0.4s ease;
}
img.lazyloaded {
  opacity: 1;
}
img.lazyerror {
  opacity: 0.3;
}
```

## Browser Support

All modern browsers that support IntersectionObserver (Chrome 51+, Firefox 55+, Safari 12.1+, Edge 15+).

## License

MIT © [smonist](https://github.com/smonist)
