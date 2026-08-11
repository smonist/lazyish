# Changelog

## 2.0.0 - 2026-08-11

### Added

- Lazy loading for `<source data-srcset>` elements inside `<picture>`.
- Automatic sizing for dynamically added and manually observed elements.

### Changed

- Auto-sizing now follows each element's rendered width and observes elements directly.
- The runtime API now exposes only the default `lazyish` export. Replace `import { lazyish } from 'lazyish'` with `import lazyish from 'lazyish'`.
- CommonJS and IIFE builds now expose `lazyish` as a directly callable function.

### Fixed

- Compound CSS selectors no longer cause invalid class removal.
- Passive-mode elements now transition through the configured loading class.
- Passive mode recognizes case-insensitive `loading="lazy"` values.
- Already-settled passive resources now fire their configured callbacks.

