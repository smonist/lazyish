/**
 * Check if an image is already cached/loaded by the browser.
 */
export function isImageCached(el: HTMLImageElement): boolean {
  return el.complete && el.naturalWidth > 0;
}

/**
 * Add a CSS class to an element.
 */
export function addClass(el: Element, className: string): void {
  el.classList.add(className);
}

/**
 * Remove a CSS class from an element.
 */
export function removeClass(el: Element, className: string): void {
  el.classList.remove(className);
}

/**
 * Attach a load event listener to an element, handling cached images.
 */
export function onLoad(el: Element, callback: () => void): void {
  if (el instanceof HTMLImageElement && isImageCached(el)) {
    callback();
    return;
  }
  el.addEventListener('load', callback, { once: true });
}

/**
 * Attach an error event listener to an element.
 */
export function onError(el: Element, callback: () => void): void {
  el.addEventListener('error', callback, { once: true });
}
