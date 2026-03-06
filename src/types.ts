/** Configuration options for lazyish */
export interface LazyishOptions {
  /** CSS class added while loading. Default: 'lazyloading' */
  classLoading: string;
  /** CSS class added when loaded successfully. Default: 'lazyloaded' */
  classLoaded: string;
  /** CSS class added on load error. Default: 'lazyerror' */
  classError: string;
  /** CSS selector to find lazy elements. Default: '.lazyload' */
  selector: string;
  /** IntersectionObserver root margin. Default: '200px' */
  rootMargin: string;
  /** IntersectionObserver threshold. Default: 0 */
  threshold: number | number[];
  /** Enable MutationObserver for dynamic content. Default: true */
  observeDOM: boolean;
  /** Enable ResizeObserver for data-sizes="auto". Default: true */
  autoSizes: boolean;
  /** Enable data-bg background image support. Default: true */
  backgroundImages: boolean;
  /** Callback fired when an element finishes loading */
  onLoad?: (el: Element) => void;
  /** Callback fired when an element fails to load */
  onError?: (el: Element) => void;
  /** Callback fired before an element is unveiled */
  onBeforeUnveil?: (el: Element) => void;
}

/** The lazyish instance returned by lazyish() */
export interface LazyishInstance {
  /** Manually observe a specific element */
  observe(el: Element): void;
  /** Force-load an element immediately */
  triggerLoad(el: Element): void;
  /** Re-scan the DOM for new elements matching the selector */
  update(): void;
  /** Tear down all observers and clean up */
  destroy(): void;
}
