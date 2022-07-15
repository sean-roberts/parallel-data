import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import json from 'rollup-plugin-json';
import replace from 'rollup-plugin-replace';
import uglify from 'rollup-plugin-uglify';
import { version } from './package.json';


export default [{
  input: 'src/index.js',
  output: {
    file: 'dist/parallel-data.js',
    name: 'ParallelData',
    format: 'iife',
    banner: `// ParallelData v${version} by Sean Roberts @DevelopSean`
  },
  plugins: [
    json(),
    resolve(),
    replace({
      INCLUDE_XHR: true,
      INCLUDE_FETCH: true,
    }),
    babel({
      // only transpile our source code
      exclude: 'node_modules/**',
      plugins: ['external-helpers']
    })
  ],
  watch: {
    include: 'src/**'
  }
}, {
    input: 'src/index.js',
    output: {
      file: 'dist/parallel-data.min.js',
      name: 'ParallelData',
      format: 'iife'
    },
    plugins: [
      json(),
      resolve(),
      replace({
        INCLUDE_XHR: true,
        INCLUDE_FETCH: true,
      }),
      babel({
        // only transpile our source code
        exclude: 'node_modules/**',
        plugins: ['external-helpers']
      }),
      uglify({
        output: {
          preamble: `// ParallelData v${version} by Sean Roberts @DevelopSean`
        }
      })
    ],
    watch: {
      include: 'src/**'
    }
  }, {
    input: 'src/index.js',
    output: {
      file: 'dist/parallel-data.fetch-only.min.js',
      name: 'ParallelData',
      format: 'iife'
    },
    plugins: [
      json(),
      resolve(),
      replace({
        INCLUDE_XHR: false,
        INCLUDE_FETCH: true,
      }),
      babel({
        // only transpile our source code
        exclude: 'node_modules/**',
        plugins: ['external-helpers']
      }),
      uglify({
        output: {
          preamble: `// ParallelData v${version} by Sean Roberts @DevelopSean`
        }
      })
    ],
    watch: {
      include: 'src/**'
    }
  }];
