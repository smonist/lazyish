import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupAutoSizes } from '../src/resize';

let resizeCallback: ResizeObserverCallback;
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

beforeEach(() => {
  mockObserve.mockClear();
  mockDisconnect.mockClear();

  vi.stubGlobal('ResizeObserver', vi.fn(function(cb: ResizeObserverCallback) {
    resizeCallback = cb;
    return {
      observe: mockObserve,
      unobserve: vi.fn(),
      disconnect: mockDisconnect,
    };
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('setupAutoSizes', () => {
  it('sets initial sizes based on parent width', () => {
    const parent = document.createElement('div');
    const img = document.createElement('img');
    img.setAttribute('data-sizes', 'auto');
    parent.appendChild(img);
    document.body.appendChild(parent);

    vi.spyOn(parent, 'getBoundingClientRect').mockReturnValue({
      width: 800,
      height: 0,
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    setupAutoSizes([img]);

    expect(img.getAttribute('sizes')).toBe('800px');

    document.body.removeChild(parent);
  });

  it('observes parent element for resize events', () => {
    const parent = document.createElement('div');
    const img = document.createElement('img');
    img.setAttribute('data-sizes', 'auto');
    parent.appendChild(img);
    document.body.appendChild(parent);

    vi.spyOn(parent, 'getBoundingClientRect').mockReturnValue({
      width: 400,
      height: 0,
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    setupAutoSizes([img]);

    expect(mockObserve).toHaveBeenCalledWith(parent);

    document.body.removeChild(parent);
  });

  it('updates sizes attribute on resize', () => {
    const parent = document.createElement('div');
    const img = document.createElement('img');
    img.setAttribute('data-sizes', 'auto');
    parent.appendChild(img);
    document.body.appendChild(parent);

    vi.spyOn(parent, 'getBoundingClientRect').mockReturnValue({
      width: 400,
      height: 0,
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    setupAutoSizes([img]);

    // Simulate resize
    resizeCallback(
      [{ target: parent, contentRect: { width: 1200 } } as unknown as ResizeObserverEntry],
      {} as ResizeObserver,
    );

    expect(img.getAttribute('sizes')).toBe('1200px');

    document.body.removeChild(parent);
  });

  it('returns a cleanup function that disconnects the observer', () => {
    const parent = document.createElement('div');
    const img = document.createElement('img');
    img.setAttribute('data-sizes', 'auto');
    parent.appendChild(img);
    document.body.appendChild(parent);

    vi.spyOn(parent, 'getBoundingClientRect').mockReturnValue({
      width: 400,
      height: 0,
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    const cleanup = setupAutoSizes([img]);
    cleanup();

    expect(mockDisconnect).toHaveBeenCalled();

    document.body.removeChild(parent);
  });

  it('skips elements without data-sizes="auto"', () => {
    const img = document.createElement('img');
    img.setAttribute('data-src', 'image.jpg');

    setupAutoSizes([img]);

    expect(mockObserve).not.toHaveBeenCalled();
  });
});
