module.exports = {
  entry: __dirname + '/src/client/js/browser_bundle.js',
  output: {
    path: __dirname + '/static/js/',
    filename: 'application.js'
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel', // 'babel-loader' is also a legal name to reference
        query: {
          presets: ['react', 'es2015']
        }
      }
    ]
  }
};
