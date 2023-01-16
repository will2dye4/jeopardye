const { addWebpackResolve, useBabelRc, override } = require('customize-cra');

module.exports = override(
  addWebpackResolve({
    fallback: {
      'buffer': require.resolve('buffer/'),
      'crypto': require.resolve('crypto-browserify'),
      'stream': require.resolve('stream-browserify'),
    },
  }),
  useBabelRc()
);
