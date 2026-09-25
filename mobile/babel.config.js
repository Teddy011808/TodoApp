module.exports = function (api) {
  api.cache(true)
  return {
    // jsxImportSource lets `className` work on React Native components.
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
  }
}
