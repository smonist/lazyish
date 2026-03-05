import { LazyishOptions, LazyishInstance } from './types.js';
import { createCore } from './core.js';
import { setupMutationObserver } from './mutation.js';

const defaults: LazyishOptions = {
  classLoading: 'lazyloading',
  classLoaded: 'lazyloaded',
  classError: 'lazyerror',
  selector: '.lazyload',
  rootMargin: '200px',
  threshold: 0,
  observeDOM: true,
  autoSizes: true,
  backgroundImages: true,
};

/**
 * Initialize lazyish lazy loading.
 */
export function lazyish(userOptions: Partial<LazyishOptions> = {}): LazyishInstance {
  const options: LazyishOptions = { ...defaults, ...userOptions };
  const core = createCore(options);

  let mutationObserver: { enable: () => void; disable: () => void } | null = null;
  if (options.observeDOM) {
    mutationObserver = setupMutationObserver(options.selector, (els) => {
      for (const el of els) {
        core.observe(el);
      }
      if (options.autoSizes) {
        // autoSizes is handled per-scan in core.update(); for new elements
        // we rely on core.observe which uses cached ResizeObserver setup
      }
    });
    mutationObserver.enable();
  }

  return {
    observe(el: Element): void {
      core.observe(el);
    },
    triggerLoad(el: Element): void {
      core.triggerLoad(el);
    },
    update(): void {
      core.update();
    },
    destroy(): void {
      core.destroy();
      mutationObserver?.disable();
    },
  };
}

export default lazyish;
export type { LazyishOptions, LazyishInstance };
