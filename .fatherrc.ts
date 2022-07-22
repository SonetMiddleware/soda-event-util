export default {
  umd: { globals: {} },
  cjs: 'rollup',
  esm: 'rollup',
  entry: ['src/main/index.ts', 'src/sdk/index.ts'],
  overridesByEntry: {
    'src/main/index.ts': {
      file: 'inject-hook'
    },
    'src/sdk/index.ts': {
      file: 'sdk'
    }
  }
}
