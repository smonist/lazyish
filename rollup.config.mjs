import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

const input = 'src/index.ts';
const tsPlugin = typescript({ tsconfig: './tsconfig.json' });

export default [
  {
    input,
    output: {
      file: 'dist/lazyish.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    plugins: [tsPlugin, terser()],
  },
  {
    input,
    output: {
      file: 'dist/lazyish.cjs.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
    plugins: [tsPlugin, terser()],
  },
  {
    input,
    output: {
      file: 'dist/lazyish.iife.js',
      format: 'iife',
      name: 'lazyish',
      sourcemap: true,
      exports: 'named',
    },
    plugins: [tsPlugin, terser()],
  },
];
