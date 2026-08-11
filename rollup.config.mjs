import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

const tsPlugin = typescript({ tsconfig: './tsconfig.json' });

export default [
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/lazyish.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    plugins: [tsPlugin, terser()],
  },
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/lazyish.cjs',
      format: 'cjs',
      sourcemap: true,
      exports: 'default',
    },
    plugins: [tsPlugin, terser()],
  },
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/lazyish.iife.js',
      format: 'iife',
      name: 'lazyish',
      sourcemap: true,
      exports: 'default',
    },
    plugins: [tsPlugin, terser()],
  },
];
