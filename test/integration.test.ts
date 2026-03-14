import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { lazyish } from '../src/index';

let intersectionCallback: IntersectionObserverCallback;
const mockIOObserve = vi.fn();
const mockIOUnobserve = vi.fn();
const mockIODisconnect = vi.fn();

let mutationCallback: MutationCallback;
const mockMOObserve = vi.fn();
const mockMODisconnect = vi.fn();

beforeEach(() => {
  document.body.innerHTML = '';
  mockIOObserve.mockClear();
  mockIOUnobserve.mockClear();
  mockIODisconnect.mockClear();
  mockMOObserve.mockClear();
  mockMODisconnect.mockClear();

  vi.stubGlobal('IntersectionObserver', vi.fn((cb: IntersectionObserverCallback) => {
    intersectionCallback = cb;
    return {
      observe: mockIOObserve,
      unobserve: mockIOUnobserve,
      disconnect: mockIODisconnect,
      root: null,
      rootMargin: '',
      thresholds: [0],
      takeRecords: () => [],
    };
  }));

  vi.stubGlobal('MutationObserver', vi.fn((cb: MutationCallback) => {
    mutationCallback = cb;
    return {
      observe: mockMOObserve,
      disconnect: mockMODisconnect,
      takeRecords: () => [],
    };
  }));

  vi.stubGlobal('ResizeObserver', vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })));

  vi.stubGlobal('requestAnimationFrame', vi.fn((cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  }));
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

describe('lazyish integration', () => {
  it('full lifecycle: init → intersect → load → class transition', () => {
    document.body.innerHTML = '<img class="lazyload" data-src="image.jpg" alt="Test">';
    const img = document.querySelector('img')!;

    lazyish();

    // Element should be observed
    expect(mockIOObserve).toHaveBeenCalledWith(img);

    // Intersect
    triggerIntersection(img);
    expect(img.getAttribute('src')).toBe('image.jpg');
    expect(img.classList.contains('lazyloading')).toBe(true);

    // Load
    img.dispatchEvent(new Event('load'));
    expect(img.classList.contains('lazyloaded')).toBe(true);
    expect(img.classList.contains('lazyloading')).toBe(false);
  });

  it('destroy cleans up all observers', () => {
    document.body.innerHTML = '<img class="lazyload" data-src="image.jpg">';
    const instance = lazyish();
    instance.destroy();
    expect(mockIODisconnect).toHaveBeenCalled();
    expect(mockMODisconnect).toHaveBeenCalled();
  });

  it('SPA: dynamically added element is auto-discovered', async () => {
    document.body.innerHTML = '<div id="container"></div>';
    lazyish();

    const img = document.createElement('img');
    img.className = 'lazyload';
    img.setAttribute('data-src', 'dynamic.jpg');

    const container = document.getElementById('container')!;
    container.appendChild(img);

    // Simulate mutation
    const mutations: MutationRecord[] = [{
      type: 'childList',
      addedNodes: [img] as unknown as NodeList,
      removedNodes: [] as unknown as NodeList,
      target: container,
      attributeName: null,
      attributeNamespace: null,
      nextSibling: null,
      oldValue: null,
      previousSibling: null,
    }];
    mutationCallback(mutations, {} as MutationObserver);

    expect(mockIOObserve).toHaveBeenCalledWith(img);
  });

  it('custom options are used', () => {
    document.body.innerHTML = '<img class="lazy" data-src="image.jpg">';
    const img = document.querySelector('img')!;

    lazyish({ selector: '.lazy', classLoaded: 'loaded' });

    triggerIntersection(img);
    img.dispatchEvent(new Event('load'));

    expect(img.classList.contains('loaded')).toBe(true);
  });

  it('update re-discovers new elements', () => {
    const instance = lazyish();

    document.body.innerHTML = '<img class="lazyload" data-src="new.jpg">';
    const img = document.querySelector('img')!;

    instance.update();

    expect(mockIOObserve).toHaveBeenCalledWith(img);
  });

  it('manual observe works', () => {
    lazyish();

    const img = document.createElement('img');
    img.className = 'lazyload';
    img.setAttribute('data-src', 'manual.jpg');
    document.body.appendChild(img);

    const instance = lazyish();
    instance.observe(img);

    // The element should be observed (it was added manually)
    expect(mockIOObserve).toHaveBeenCalledWith(img);
  });

  it('iframe lifecycle: init → intersect → load → class transition', () => {
    document.body.innerHTML = '<iframe class="lazyload" data-src="https://example.com" title="Test"></iframe>';
    const iframe = document.querySelector('iframe')!;

    lazyish();

    // Element should be observed
    expect(mockIOObserve).toHaveBeenCalledWith(iframe);

    // Intersect
    triggerIntersection(iframe);
    expect(iframe.getAttribute('src')).toBe('https://example.com');
    expect(iframe.classList.contains('lazyloading')).toBe(true);

    // Load
    iframe.dispatchEvent(new Event('load'));
    expect(iframe.classList.contains('lazyloaded')).toBe(true);
    expect(iframe.classList.contains('lazyloading')).toBe(false);
  });
});
