import lazyish, { lazyish as namedLazyish } from './index.js';

export default Object.assign(lazyish, {
  default: lazyish,
  lazyish: namedLazyish,
});
