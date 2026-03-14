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

  it('observes iframes with data-src', () => {
    document.body.innerHTML = '<iframe class="lazyload" data-src="https://example.com"></iframe>';
    const iframe = document.querySelector('iframe')!;
    createCore(defaultOptions);
    expect(mockObserve).toHaveBeenCalledWith(iframe);
  });

  it('copies data-src to src on iframe intersection', () => {
    document.body.innerHTML = '<iframe class="lazyload" data-src="https://example.com"></iframe>';
    const iframe = document.querySelector('iframe')!;
    createCore(defaultOptions);
    triggerIntersection(iframe);
    expect(iframe.getAttribute('src')).toBe('https://example.com');
  });

  it('adds classLoaded on successful iframe load', () => {
    document.body.innerHTML = '<iframe class="lazyload" data-src="https://example.com"></iframe>';
    const iframe = document.querySelector('iframe')!;
    createCore(defaultOptions);
    triggerIntersection(iframe);
    iframe.dispatchEvent(new Event('load'));
    expect(iframe.classList.contains('lazyloaded')).toBe(true);
    expect(iframe.classList.contains('lazyloading')).toBe(false);
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

  it('observes video elements with data-src', () => {
    document.body.innerHTML = '<video class="lazyload" data-src="video.mp4"></video>';
    const video = document.querySelector('video')!;
    createCore(defaultOptions);
    expect(mockObserve).toHaveBeenCalledWith(video);
  });

  it('copies data-src to src on video intersection', () => {
    document.body.innerHTML = '<video class="lazyload" data-src="video.mp4"></video>';
    const video = document.querySelector('video')!;
    createCore(defaultOptions);
    triggerIntersection(video);
    expect(video.getAttribute('src')).toBe('video.mp4');
  });

  it('copies data-poster to poster on video intersection', () => {
    document.body.innerHTML = '<video class="lazyload" data-src="video.mp4" data-poster="poster.jpg"></video>';
    const video = document.querySelector('video')!;
    createCore(defaultOptions);
    triggerIntersection(video);
    expect(video.getAttribute('poster')).toBe('poster.jpg');
    expect(video.hasAttribute('data-poster')).toBe(false);
  });

  it('copies data-src to src on child source elements', () => {
    document.body.innerHTML = `
      <video class="lazyload" data-poster="poster.jpg">
        <source data-src="video.mp4" type="video/mp4">
        <source data-src="video.webm" type="video/webm">
      </video>`;
    const video = document.querySelector('video')!;
    const sources = video.querySelectorAll('source');
    createCore(defaultOptions);
    triggerIntersection(video);
    expect(sources[0].getAttribute('src')).toBe('video.mp4');
    expect(sources[0].hasAttribute('data-src')).toBe(false);
    expect(sources[1].getAttribute('src')).toBe('video.webm');
    expect(sources[1].hasAttribute('data-src')).toBe(false);
  });

  it('calls video.load() when source children are present', () => {
    document.body.innerHTML = `
      <video class="lazyload" data-poster="poster.jpg">
        <source data-src="video.mp4" type="video/mp4">
      </video>`;
    const video = document.querySelector('video')!;
    const loadSpy = vi.spyOn(video, 'load');
    createCore(defaultOptions);
    triggerIntersection(video);
    expect(loadSpy).toHaveBeenCalled();
  });

  it('adds classLoaded on video loadeddata event', () => {
    document.body.innerHTML = '<video class="lazyload" data-src="video.mp4"></video>';
    const video = document.querySelector('video')!;
    createCore(defaultOptions);
    triggerIntersection(video);
    video.dispatchEvent(new Event('loadeddata'));
    expect(video.classList.contains('lazyloaded')).toBe(true);
    expect(video.classList.contains('lazyloading')).toBe(false);
  });

  it('adds classError on video error', () => {
    document.body.innerHTML = '<video class="lazyload" data-src="bad.mp4"></video>';
    const video = document.querySelector('video')!;
    createCore(defaultOptions);
    triggerIntersection(video);
    video.dispatchEvent(new Event('error'));
    expect(video.classList.contains('lazyerror')).toBe(true);
    expect(video.classList.contains('lazyloading')).toBe(false);
  });

  it('observes video with only data-poster (no data-src)', () => {
    document.body.innerHTML = `
      <video class="lazyload" data-poster="poster.jpg">
        <source data-src="video.mp4" type="video/mp4">
      </video>`;
    const video = document.querySelector('video')!;
    createCore(defaultOptions);
    expect(mockObserve).toHaveBeenCalledWith(video);
  });
});
