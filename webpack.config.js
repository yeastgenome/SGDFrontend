require('webpack');
const path = require('path');

module.exports = {
  entry: './client/jsx/application.jsx',
  output: {
    path: path.resolve(__dirname, 'src/sgd/frontend/yeastgenome/static/js'),
    filename: 'application.js'
  },
  resolve: {
    alias: {
      jquery: path.resolve(__dirname, 'src/sgd/frontend/yeastgenome/static/js/build/jquery.min.js')
    }
  },
  module: {
    loaders: [
      {
        test: /\.jsx$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel', // 'babel-loader' is also a legal name to reference
        query: {
          presets: ['es2015', 'react', 'stage-0']
        }
      }
    ]
  }
};
