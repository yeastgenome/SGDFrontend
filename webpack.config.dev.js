let merge = require('webpack-merge');
let base = require('./webpack.config.base');

let dev = {
  mode:'development',
  devtool:'source-map'
}

module.exports = merge(base,dev);