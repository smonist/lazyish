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

  const autoSizeEls = new WeakSet<Element>();

  const updateSize = (el: Element): void => {
    const width =
      el.getBoundingClientRect().width ||
      el.parentElement?.getBoundingClientRect().width ||
      0;
    if (width > 0) {
      el.setAttribute('sizes', `${Math.round(width)}px`);
    }
  };

  const ro = new ResizeObserver((entries) => {
    for (const entry of entries) {
      if (entry.contentRect.width > 0) {
        entry.target.setAttribute('sizes', `${Math.round(entry.contentRect.width)}px`);
      } else {
        updateSize(entry.target);
      }
    }
  });

  const observe = (el: Element): void => {
    if (el.getAttribute('data-sizes') !== 'auto' || autoSizeEls.has(el)) return;

    autoSizeEls.add(el);
    updateSize(el);
    ro.observe(el);
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
