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
  it('falls back to parent width when the element has no width', () => {
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

  it('uses the rendered element width when available', () => {
    const parent = document.createElement('div');
    const img = document.createElement('img');
    img.setAttribute('data-sizes', 'auto');
    parent.appendChild(img);
    document.body.appendChild(parent);

    vi.spyOn(img, 'getBoundingClientRect').mockReturnValue({
      width: 300,
      height: 0,
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    vi.spyOn(parent, 'getBoundingClientRect').mockReturnValue({
      width: 1200,
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

    expect(img.getAttribute('sizes')).toBe('300px');

    document.body.removeChild(parent);
  });

  it('observes the element for resize events', () => {
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

    expect(mockObserve).toHaveBeenCalledWith(img);

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
      [{ target: img, contentRect: { width: 1200 } } as unknown as ResizeObserverEntry],
      {} as ResizeObserver,
    );

    expect(img.getAttribute('sizes')).toBe('1200px');

    document.body.removeChild(parent);
  });

  it('disconnects the observer', () => {
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

    const controller = setupAutoSizes([img]);
    controller.disconnect();

    expect(mockDisconnect).toHaveBeenCalled();

    document.body.removeChild(parent);
  });

  it('skips elements without data-sizes="auto"', () => {
    const img = document.createElement('img');
    img.setAttribute('data-src', 'image.jpg');

    setupAutoSizes([img]);

    expect(mockObserve).not.toHaveBeenCalled();
  });

  it('registers elements added after setup', () => {
    const parent = document.createElement('div');
    const img = document.createElement('img');
    img.setAttribute('data-sizes', 'auto');
    parent.appendChild(img);
    document.body.appendChild(parent);

    vi.spyOn(parent, 'getBoundingClientRect').mockReturnValue({
      width: 600,
      height: 0,
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    const controller = setupAutoSizes([]);
    controller.observe(img);

    expect(img.getAttribute('sizes')).toBe('600px');
    expect(mockObserve).toHaveBeenCalledWith(img);

    document.body.removeChild(parent);
  });
});
