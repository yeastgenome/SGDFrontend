let merge = require('webpack-merge');
let base = require('./webpack.config.base');

let dev = {
  mode:'development'
}

module.exports = merge(base,dev);