import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupMutationObserver } from '../src/mutation';

let mutationCallback: MutationCallback;
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

beforeEach(() => {
  document.body.innerHTML = '';
  mockObserve.mockClear();
  mockDisconnect.mockClear();

  vi.stubGlobal('MutationObserver', vi.fn((cb: MutationCallback) => {
    mutationCallback = cb;
    return {
      observe: mockObserve,
      disconnect: mockDisconnect,
      takeRecords: () => [],
    };
  }));

  vi.stubGlobal('requestAnimationFrame', vi.fn((cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function triggerMutation(addedNodes: Element[]): void {
  const mutations: MutationRecord[] = addedNodes.map((node) => ({
    type: 'childList',
    addedNodes: { length: 1, 0: node, item: (i: number) => (i === 0 ? node : null), [Symbol.iterator]: function* () { yield node; }, forEach: (cb: (node: Node) => void) => cb(node) } as unknown as NodeList,
    removedNodes: { length: 0, item: () => null, [Symbol.iterator]: function* () {}, forEach: () => {} } as unknown as NodeList,
    target: document.body,
    attributeName: null,
    attributeNamespace: null,
    nextSibling: null,
    oldValue: null,
    previousSibling: null,
  }));
  mutationCallback(mutations, {} as MutationObserver);
}

describe('setupMutationObserver', () => {
  it('enables observation on document.body', () => {
    const { enable } = setupMutationObserver('.lazyload', vi.fn());
    enable();
    expect(mockObserve).toHaveBeenCalledWith(document.body, { childList: true, subtree: true });
  });

  it('calls onNewElements when matching elements are added', () => {
    const onNewElements = vi.fn();
    const { enable } = setupMutationObserver('.lazyload', onNewElements);
    enable();

    const img = document.createElement('img');
    img.className = 'lazyload';
    document.body.appendChild(img);

    triggerMutation([img]);

    expect(onNewElements).toHaveBeenCalledWith([img]);
  });

  it('discovers nested matching elements', () => {
    const onNewElements = vi.fn();
    const { enable } = setupMutationObserver('.lazyload', onNewElements);
    enable();

    const div = document.createElement('div');
    const img = document.createElement('img');
    img.className = 'lazyload';
    div.appendChild(img);
    document.body.appendChild(div);

    triggerMutation([div]);

    expect(onNewElements).toHaveBeenCalledWith([img]);
  });

  it('disable disconnects the observer', () => {
    const { enable, disable } = setupMutationObserver('.lazyload', vi.fn());
    enable();
    disable();
    expect(mockDisconnect).toHaveBeenCalled();
  });
});
