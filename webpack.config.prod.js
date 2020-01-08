let merge = require('webpack-merge');
let base = require('./webpack.config.base');

let prod = {
  mode:'production'
}

module.exports = merge(base,prod);