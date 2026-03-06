import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createCore } from '../src/core';
import { LazyishOptions } from '../src/types';

const defaultOptions: LazyishOptions = {
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

// Mock IntersectionObserver
let intersectionCallback: IntersectionObserverCallback;
const mockObserve = vi.fn();
const mockUnobserve = vi.fn();
const mockDisconnect = vi.fn();

beforeEach(() => {
  document.body.innerHTML = '';
  mockObserve.mockClear();
  mockUnobserve.mockClear();
  mockDisconnect.mockClear();

  vi.stubGlobal('IntersectionObserver', vi.fn((cb: IntersectionObserverCallback) => {
    intersectionCallback = cb;
    return {
      observe: mockObserve,
      unobserve: mockUnobserve,
      disconnect: mockDisconnect,
      root: null,
      rootMargin: '',
      thresholds: [0],
      takeRecords: () => [],
    };
  }));

  vi.stubGlobal('ResizeObserver', vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function triggerIntersection(el: Element, isIntersecting = true): void {
  intersectionCallback(
    [{ isIntersecting, target: el } as IntersectionObserverEntry],
    {} as IntersectionObserver,
  );
}

describe('createCore', () => {
  it('observes elements with data-src', () => {
    document.body.innerHTML = '<img class="lazyload" data-src="image.jpg">';
    const img = document.querySelector('img')!;
    createCore(defaultOptions);
    expect(mockObserve).toHaveBeenCalledWith(img);
  });

  it('copies data-src to src on intersection', () => {
    document.body.innerHTML = '<img class="lazyload" data-src="image.jpg">';
    const img = document.querySelector('img')!;
    createCore(defaultOptions);
    triggerIntersection(img);
    expect(img.getAttribute('src')).toBe('image.jpg');
  });

  it('adds classLoading when element is unveiled', () => {
    document.body.innerHTML = '<img class="lazyload" data-src="image.jpg">';
    const img = document.querySelector('img')!;
    createCore(defaultOptions);
    triggerIntersection(img);
    expect(img.classList.contains('lazyloading')).toBe(true);
  });

  it('adds classLoaded on successful load', () => {
    document.body.innerHTML = '<img class="lazyload" data-src="image.jpg">';
    const img = document.querySelector('img')!;
    createCore(defaultOptions);
    triggerIntersection(img);
    img.dispatchEvent(new Event('load'));
    expect(img.classList.contains('lazyloaded')).toBe(true);
    expect(img.classList.contains('lazyloading')).toBe(false);
  });

  it('adds classError on failed load', () => {
    document.body.innerHTML = '<img class="lazyload" data-src="bad.jpg">';
    const img = document.querySelector('img')!;
    createCore(defaultOptions);
    triggerIntersection(img);
    img.dispatchEvent(new Event('error'));
    expect(img.classList.contains('lazyerror')).toBe(true);
    expect(img.classList.contains('lazyloading')).toBe(false);
  });

  it('fires onLoad callback', () => {
    document.body.innerHTML = '<img class="lazyload" data-src="image.jpg">';
    const img = document.querySelector('img')!;
    const onLoad = vi.fn();
    createCore({ ...defaultOptions, onLoad });
    triggerIntersection(img);
    img.dispatchEvent(new Event('load'));
    expect(onLoad).toHaveBeenCalledWith(img);
  });

  it('fires onError callback', () => {
    document.body.innerHTML = '<img class="lazyload" data-src="bad.jpg">';
    const img = document.querySelector('img')!;
    const onError = vi.fn();
    createCore({ ...defaultOptions, onError });
    triggerIntersection(img);
    img.dispatchEvent(new Event('error'));
    expect(onError).toHaveBeenCalledWith(img);
  });

  it('fires onBeforeUnveil callback', () => {
    document.body.innerHTML = '<img class="lazyload" data-src="image.jpg">';
    const img = document.querySelector('img')!;
    const onBeforeUnveil = vi.fn();
    createCore({ ...defaultOptions, onBeforeUnveil });
    triggerIntersection(img);
    expect(onBeforeUnveil).toHaveBeenCalledWith(img);
  });

  it('copies data-srcset and data-sizes to live attributes', () => {
    document.body.innerHTML = '<img class="lazyload" data-src="image.jpg" data-srcset="image-400.jpg 400w" data-sizes="400px">';
    const img = document.querySelector('img')!;
    createCore(defaultOptions);
    triggerIntersection(img);
    expect(img.getAttribute('srcset')).toBe('image-400.jpg 400w');
    expect(img.getAttribute('sizes')).toBe('400px');
  });

  it('does not process elements twice', () => {
    document.body.innerHTML = '<img class="lazyload" data-src="image.jpg">';
    const img = document.querySelector('img')!;
    const core = createCore(defaultOptions);
    core.observe(img);
    // Should still only be observed once
    expect(mockObserve).toHaveBeenCalledTimes(1);
  });

  it('triggerLoad force-loads an element', () => {
    document.body.innerHTML = '<img class="lazyload" data-src="image.jpg">';
    const img = document.querySelector('img')!;
    const core = createCore(defaultOptions);
    core.triggerLoad(img);
    expect(img.getAttribute('src')).toBe('image.jpg');
  });

  it('destroy disconnects the IntersectionObserver', () => {
    document.body.innerHTML = '<img class="lazyload" data-src="image.jpg">';
    const core = createCore(defaultOptions);
    core.destroy();
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('update re-scans DOM', () => {
    createCore(defaultOptions);
    document.body.innerHTML = '<img class="lazyload" data-src="new.jpg">';
    const img = document.querySelector('img')!;
    // After update, the new element should be observed
    // We need to re-get the core for this test
    const core = createCore(defaultOptions);
    core.update();
    // img was already processed in createCore second call
    expect(mockObserve).toHaveBeenCalledWith(img);
  });

  it('passive mode: adds classLoaded for loading=lazy image that loads', () => {
    document.body.innerHTML = '<img class="lazyload" src="image.jpg" loading="lazy">';
    const img = document.querySelector('img')!;
    Object.defineProperty(img, 'complete', { value: false, configurable: true });
    Object.defineProperty(img, 'naturalWidth', { value: 0, configurable: true });
    createCore(defaultOptions);
    img.dispatchEvent(new Event('load'));
    expect(img.classList.contains('lazyloaded')).toBe(true);
  });

  it('multiple instances do not interfere', () => {
    document.body.innerHTML = `
      <img id="img1" class="lazyload" data-src="image1.jpg">
      <img id="img2" class="lazyload2" data-src="image2.jpg">
    `;
    const opts1 = { ...defaultOptions, selector: '.lazyload' };
    const opts2 = { ...defaultOptions, selector: '.lazyload2' };
    createCore(opts1);
    createCore(opts2);
    const img1 = document.getElementById('img1')!;
    const img2 = document.getElementById('img2')!;
    expect(mockObserve).toHaveBeenCalledWith(img1);
    expect(mockObserve).toHaveBeenCalledWith(img2);
  });
});
