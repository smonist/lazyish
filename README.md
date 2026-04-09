# lazyish

A lightweight, zero-dependency lazy loading micro-library using native browser APIs (IntersectionObserver, MutationObserver, ResizeObserver).

[![CI](https://github.com/smonist/lazyish/actions/workflows/ci.yml/badge.svg)](https://github.com/smonist/lazyish/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/lazyish.svg)](https://badge.fury.io/js/lazyish)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🚀 **Tiny** – under 2 KB minified + gzipped
- 🔌 **Zero dependencies** – uses native browser APIs only
- 📦 **ESM / CJS / IIFE** – works everywhere
- 🔀 **Two modes** – passive (`loading="lazy"`) and active pipelines (`data-*`)
- 🖼️ **Images** – `data-src`, `data-srcset`, `data-sizes="auto"`
- 🎨 **Background images** – `data-bg` on any element
- 📺 **Iframes** – lazy-load `<iframe>` with `data-src`
- 🎬 **Videos** – lazy-load `<video>` with `data-src`, `data-poster`, and `<source>` children
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
<!-- Native lazy images & media (also works for <video> and <audio>) -->
<img class="lazyload" src="image.jpg" loading="lazy" alt="passive">
<iframe class="lazyload" src="embed.html" loading="lazy"></iframe>
<video class="lazyload" src="video.mp4" loading="lazy" controls></video>
<audio class="lazyload" src="audio.mp3" loading="lazy" controls></audio>

<!-- Observer-controlled responsive images -->
<img class="lazyload"
     data-src="img-800.jpg"
     data-srcset="img-400.jpg 400w, img-800.jpg 800w"
     data-sizes="auto"
     alt="active">

<!-- Background images -->
<div class="lazyload" data-bg="hero.jpg"></div>

<!-- Iframes -->
<iframe class="lazyload" data-src="https://example.com" title="Lazy iframe"></iframe>

<!-- Videos -->
<video class="lazyload" data-src="video.mp4" data-poster="poster.jpg" controls></video>

<!-- Videos with multiple sources -->
<video class="lazyload" data-poster="poster.jpg" controls>
  <source data-src="video.mp4" type="video/mp4">
  <source data-src="video.webm" type="video/webm">
</video>
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

## Modes: Active vs Passive

lazyish supports two ways to work with lazy loading.

### Passive mode (native `loading="lazy"`)

Use normal media markup with native lazy loading:

```html
<img class="lazyload" src="image.jpg" loading="lazy" alt="...">
```

In passive mode, the browser controls fetching. lazyish handles CSS class lifecycle (`lazyloaded`/`lazyerror`) and callbacks.

- Supported elements: `<img>`, `<iframe>`, `<video>`, `<audio>`
- Requirements: has `src`, has `loading="lazy"`, NO `data-*` attributes.
- Note: browser controls fetch timing; may vary by element/browser (espcially `<video>`/`<audio>`).

### Active mode (IntersectionObserver)

Use `data-*` attributes (`data-src`, `data-bg`, etc) and let lazyish unveil via `IntersectionObserver`.

- Supported elements: `<img>`, `<iframe>`, `<video>`, any `[data-bg]`
- Behavior: custom preload margins, responsive auto-sizing, unveil hooks.

### Default mode by element

- `<img>`, `<audio>`: **Passive mode** by default (`src` + `loading="lazy"`).
- `<iframe>`, `<video>`: **Passive mode** for simple embeds, **Active mode** when using `data-src`/`data-poster` or needing observer tuning.
- Backgrounds (`data-bg="..."`): **Active mode** always.

### Which should I use?

- Use **passive** for most regular images/media.
- Use **active** for responsive pipes (`data-srcset`), fine-grained observer control, backgrounds, and older browser `<video>`/`<iframe>` support.

## API

### `lazyish(options?): LazyishInstance`

Initializes lazy loading and returns an instance.

### Options

| Option | Type | Default | Mode | Description |
|--------|------|---------|------|-------------|
| `selector` | `string` | `'.lazyload'` | Both | CSS selector for lazy elements |
| `classLoading` | `string` | `'lazyloading'` | Both | Class added while loading |
| `classLoaded` | `string` | `'lazyloaded'` | Both | Class added when loaded |
| `classError` | `string` | `'lazyerror'` | Both | Class added on error |
| `rootMargin` | `string` | `'200px'` | Active | IntersectionObserver root margin |
| `threshold` | `number\|number[]` | `0` | Active | IntersectionObserver threshold |
| `observeDOM` | `boolean` | `true` | Both | Auto-discover new elements |
| `autoSizes` | `boolean` | `true` | Active | Auto-compute `sizes` attribute |
| `backgroundImages` | `boolean` | `true` | Active | Support `data-bg` |
| `onLoad` | `(el) => void` | — | Both | Callback on successful load |
| `onError` | `(el) => void` | — | Both | Callback on load error |
| `onBeforeUnveil` | `(el) => void` | — | Active | Callback before unveiling |

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
- [`video.html`](examples/video.html) – Lazy-loaded videos with `data-src` and `data-poster`
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
