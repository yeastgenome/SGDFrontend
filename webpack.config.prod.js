let merge = require('webpack-merge');
let base = require('./webpack.config.base');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

let prod = {
  mode: 'production',
  plugins: [
    new BundleAnalyzerPlugin()
  ],
  // optimization: {
  //   splitChunks: {
  //     chunks: 'all'
  //   }
  // }
}

module.exports = merge(base, prod);
