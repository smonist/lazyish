import { addClass, removeClass } from './utils.js';

/**
 * Load a background image for an element that has a data-bg attribute.
 */
export function loadBackground(
  el: Element,
  classLoading: string,
  classLoaded: string,
  classError: string,
  onLoadCb?: (el: Element) => void,
  onErrorCb?: (el: Element) => void,
): void {
  const bgUrl = el.getAttribute('data-bg');
  if (!bgUrl) return;

  el.removeAttribute('data-bg');
  addClass(el, classLoading);

  const img = new Image();
  img.onload = () => {
    (el as HTMLElement).style.backgroundImage = `url(${JSON.stringify(bgUrl)})`;
    removeClass(el, classLoading);
    addClass(el, classLoaded);
    onLoadCb?.(el);
  };
  img.onerror = () => {
    removeClass(el, classLoading);
    addClass(el, classError);
    onErrorCb?.(el);
  };
  img.src = bgUrl;
}
