/**
 * Set up ResizeObserver for elements with data-sizes="auto".
 * Returns a cleanup function.
 */
export function setupAutoSizes(elements: Element[]): () => void {
  if (typeof ResizeObserver === 'undefined') {
    return () => {};
  }

  const autoSizeEls: Element[] = elements.filter(
    (el) => el.getAttribute('data-sizes') === 'auto',
  );

  if (autoSizeEls.length === 0) {
    return () => {};
  }

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

  const parents = new Set<Element>();
  for (const el of autoSizeEls) {
    // Set initial size
    updateSize(el);
    // Observe parent
    const parent = el.parentElement;
    if (parent && !parents.has(parent)) {
      parents.add(parent);
      ro.observe(parent);
    }
  }

  return () => {
    ro.disconnect();
  };
}
