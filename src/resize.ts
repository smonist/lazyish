/**
 * Set up ResizeObserver for elements with data-sizes="auto".
 * Returns a controller that accepts elements incrementally.
 */
export interface AutoSizesController {
  observe(el: Element): void;
  disconnect(): void;
}

export function setupAutoSizes(elements: Element[]): AutoSizesController {
  if (typeof ResizeObserver === 'undefined') {
    return { observe: () => {}, disconnect: () => {} };
  }

  const autoSizeEls = new Set<Element>();
  const parents = new Set<Element>();

  const updateSize = (el: Element): void => {
    const parent = el.parentElement;
    if (!parent) return;
    const width = parent.getBoundingClientRect().width;
    el.setAttribute('sizes', `${Math.round(width)}px`);
  };

  const ro = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const parent = entry.target;
      // Find all lazy elements that are children of this parent
      for (const el of autoSizeEls) {
        if (el.parentElement === parent) {
          const width = Math.round(entry.contentRect.width);
          el.setAttribute('sizes', `${width}px`);
        }
      }
    }
  });

  const observe = (el: Element): void => {
    if (el.getAttribute('data-sizes') !== 'auto' || autoSizeEls.has(el)) return;

    autoSizeEls.add(el);
    updateSize(el);

    const parent = el.parentElement;
    if (parent && !parents.has(parent)) {
      parents.add(parent);
      ro.observe(parent);
    }
  };

  for (const el of elements) {
    observe(el);
  }

  return {
    observe,
    disconnect(): void {
      ro.disconnect();
    },
  };
}
