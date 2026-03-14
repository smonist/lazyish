import { LazyishOptions } from './types.js';
import { addClass, removeClass, onLoad, onError } from './utils.js';
import { loadBackground } from './bg.js';
import { setupAutoSizes } from './resize.js';

/**
 * Determine if an element is in OBSERVER MODE (has data-src, data-srcset, or data-poster).
 */
function isObserverMode(el: Element): boolean {
  return el.hasAttribute('data-src') || el.hasAttribute('data-srcset') || el.hasAttribute('data-poster');
}

/**
 * Determine if an element is in PASSIVE MODE
 * (has src + loading="lazy", no data-src).
 */
function isPassiveMode(el: Element): boolean {
  return (
    el instanceof HTMLImageElement &&
    el.hasAttribute('src') &&
    el.getAttribute('loading') === 'lazy' &&
    !el.hasAttribute('data-src')
  );
}

/**
 * Unveil an element: copy data-* attributes to live attributes,
 * handle background images, and manage class lifecycle.
 */
function unveil(el: Element, options: LazyishOptions): void {
  options.onBeforeUnveil?.(el);

  // Handle background image
  if (options.backgroundImages && el.hasAttribute('data-bg')) {
    loadBackground(
      el,
      options.classLoading,
      options.classLoaded,
      options.classError,
      options.onLoad,
      options.onError,
    );
    return;
  }

  addClass(el, options.classLoading);
  removeClass(el, options.selector.replace(/^\./, ''));

  const dataSrc = el.getAttribute('data-src');
  const dataSrcset = el.getAttribute('data-srcset');
  const dataSizes = el.getAttribute('data-sizes');

  if (dataSrc) {
    el.removeAttribute('data-src');
    el.setAttribute('src', dataSrc);
  }
  if (dataSrcset) {
    el.removeAttribute('data-srcset');
    el.setAttribute('srcset', dataSrcset);
  }
  if (dataSizes && dataSizes !== 'auto') {
    el.removeAttribute('data-sizes');
    el.setAttribute('sizes', dataSizes);
  }

  // Handle video-specific attributes
  if (el instanceof HTMLVideoElement) {
    const dataPoster = el.getAttribute('data-poster');
    if (dataPoster) {
      el.removeAttribute('data-poster');
      el.setAttribute('poster', dataPoster);
    }

    // Copy data-src to src on child <source> elements
    const sources = el.querySelectorAll('source[data-src]');
    for (const source of sources) {
      const sourceSrc = source.getAttribute('data-src');
      if (sourceSrc) {
        source.removeAttribute('data-src');
        source.setAttribute('src', sourceSrc);
      }
    }

    // Trigger the video to load the new sources
    if (sources.length > 0) {
      el.load();
    }
  }

  onLoad(el, () => {
    removeClass(el, options.classLoading);
    addClass(el, options.classLoaded);
    options.onLoad?.(el);
  });

  onError(el, () => {
    removeClass(el, options.classLoading);
    addClass(el, options.classError);
    options.onError?.(el);
  });
}

/**
 * Set up class lifecycle for a passive-mode element (loading="lazy").
 */
function setupPassive(el: Element, options: LazyishOptions): void {
  const img = el as HTMLImageElement;
  if (img.complete) {
    if (img.naturalWidth > 0) {
      addClass(el, options.classLoaded);
    } else {
      addClass(el, options.classError);
    }
    return;
  }
  el.addEventListener('load', () => {
    addClass(el, options.classLoaded);
    options.onLoad?.(el);
  }, { once: true });
  el.addEventListener('error', () => {
    addClass(el, options.classError);
    options.onError?.(el);
  }, { once: true });
}

export interface CoreController {
  observe(el: Element): void;
  triggerLoad(el: Element): void;
  update(): void;
  destroy(): void;
}

/**
 * Initialize the core lazy loading logic.
 */
export function createCore(options: LazyishOptions): CoreController {
  const processed = new WeakSet<Element>();
  let cleanupAutoSizes: (() => void) | null = null;

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const el = entry.target;
          io.unobserve(el);
          unveil(el, options);
        }
      }
    },
    {
      rootMargin: options.rootMargin,
      threshold: options.threshold,
    },
  );

  function processElement(el: Element): void {
    if (processed.has(el)) return;
    processed.add(el);

    if (isObserverMode(el)) {
      io.observe(el);
    } else if (isPassiveMode(el)) {
      setupPassive(el, options);
    } else if (options.backgroundImages && el.hasAttribute('data-bg')) {
      io.observe(el);
    }
  }

  function scanDOM(): void {
    const elements = Array.from(document.querySelectorAll(options.selector));
    for (const el of elements) {
      processElement(el);
    }
    if (options.autoSizes) {
      if (cleanupAutoSizes) cleanupAutoSizes();
      cleanupAutoSizes = setupAutoSizes(elements);
    }
  }

  // Initial scan
  scanDOM();

  return {
    observe(el: Element): void {
      processElement(el);
    },
    triggerLoad(el: Element): void {
      if (!processed.has(el)) {
        processed.add(el);
      }
      io.unobserve(el);
      if (isObserverMode(el) || (options.backgroundImages && el.hasAttribute('data-bg'))) {
        unveil(el, options);
      }
    },
    update(): void {
      scanDOM();
    },
    destroy(): void {
      io.disconnect();
      if (cleanupAutoSizes) {
        cleanupAutoSizes();
        cleanupAutoSizes = null;
      }
    },
  };
}
