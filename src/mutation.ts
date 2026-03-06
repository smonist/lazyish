/**
 * Set up a MutationObserver to auto-discover new elements in the DOM.
 * Returns enable/disable functions.
 */
export function setupMutationObserver(
  selector: string,
  onNewElements: (els: Element[]) => void,
): { enable: () => void; disable: () => void } {
  if (typeof MutationObserver === 'undefined') {
    return { enable: () => {}, disable: () => {} };
  }

  let rafId: number | null = null;
  const pendingEls: Element[] = [];

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        const el = node as Element;
        if (el.matches(selector)) {
          pendingEls.push(el);
        }
        const nested = el.querySelectorAll(selector);
        for (const child of nested) {
          pendingEls.push(child);
        }
      }
    }

    if (pendingEls.length > 0 && rafId === null) {
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (pendingEls.length > 0) {
          const toProcess = pendingEls.splice(0);
          onNewElements(toProcess);
        }
      });
    }
  });

  const enable = (): void => {
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }
  };

  const disable = (): void => {
    observer.disconnect();
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  return { enable, disable };
}
