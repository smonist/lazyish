import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadBackground } from '../src/bg';

beforeEach(() => {
  document.body.innerHTML = '';
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('loadBackground', () => {
  it('sets background-image on successful load', () => {
    const el = document.createElement('div');
    el.setAttribute('data-bg', 'hero.jpg');
    document.body.appendChild(el);

    let onLoadCb: (() => void) | null = null;
    vi.spyOn(window, 'Image').mockImplementation(() => {
      const img = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: '',
      };
      Object.defineProperty(img, 'src', {
        set(v: string) {
          this._src = v;
          // Trigger onload asynchronously (simulate load)
          onLoadCb = this.onload;
        },
        get() { return this._src; },
      });
      return img as unknown as HTMLImageElement;
    });

    loadBackground(el, 'lazyloading', 'lazyloaded', 'lazyerror');

    expect(el.classList.contains('lazyloading')).toBe(true);
    expect(el.getAttribute('data-bg')).toBeNull();

    // Trigger load
    onLoadCb?.();

    expect(el.style.backgroundImage).toBe('url("hero.jpg")');
    expect(el.classList.contains('lazyloaded')).toBe(true);
    expect(el.classList.contains('lazyloading')).toBe(false);
  });

  it('adds classError on failed background load', () => {
    const el = document.createElement('div');
    el.setAttribute('data-bg', 'broken.jpg');
    document.body.appendChild(el);

    let onErrorCb: (() => void) | null = null;
    vi.spyOn(window, 'Image').mockImplementation(() => {
      const img = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: '',
      };
      Object.defineProperty(img, 'src', {
        set(v: string) {
          this._src = v;
          onErrorCb = this.onerror;
        },
        get() { return this._src; },
      });
      return img as unknown as HTMLImageElement;
    });

    loadBackground(el, 'lazyloading', 'lazyloaded', 'lazyerror');
    onErrorCb?.();

    expect(el.classList.contains('lazyerror')).toBe(true);
    expect(el.classList.contains('lazyloading')).toBe(false);
  });

  it('fires onLoad callback after successful background load', () => {
    const el = document.createElement('div');
    el.setAttribute('data-bg', 'hero.jpg');
    document.body.appendChild(el);

    let onLoadCb: (() => void) | null = null;
    vi.spyOn(window, 'Image').mockImplementation(() => {
      const img = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: '',
      };
      Object.defineProperty(img, 'src', {
        set() { onLoadCb = this.onload; },
        get() { return ''; },
      });
      return img as unknown as HTMLImageElement;
    });

    const onLoad = vi.fn();
    loadBackground(el, 'lazyloading', 'lazyloaded', 'lazyerror', onLoad);
    onLoadCb?.();

    expect(onLoad).toHaveBeenCalledWith(el);
  });

  it('fires onError callback after failed background load', () => {
    const el = document.createElement('div');
    el.setAttribute('data-bg', 'broken.jpg');
    document.body.appendChild(el);

    let onErrorCb: (() => void) | null = null;
    vi.spyOn(window, 'Image').mockImplementation(() => {
      const img = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: '',
      };
      Object.defineProperty(img, 'src', {
        set() { onErrorCb = this.onerror; },
        get() { return ''; },
      });
      return img as unknown as HTMLImageElement;
    });

    const onError = vi.fn();
    loadBackground(el, 'lazyloading', 'lazyloaded', 'lazyerror', undefined, onError);
    onErrorCb?.();

    expect(onError).toHaveBeenCalledWith(el);
  });

  it('does nothing if data-bg is missing', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);

    const imageSpy = vi.spyOn(window, 'Image');
    loadBackground(el, 'lazyloading', 'lazyloaded', 'lazyerror');

    expect(imageSpy).not.toHaveBeenCalled();
  });
});
