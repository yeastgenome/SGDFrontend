const path = require("path");

module.exports = {
  entry: "./client/jsx/application.jsx",
  output: {
    filename: "./application.js",
    path:path.join(__dirname, "src/sgd/frontend/yeastgenome/static/js")
  },
  module: {
    rules: [
      {
        test: /\.jsx$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: "babel-loader",
          options: {
            cacheDirectory: true,
            presets: ["@babel/preset-env","@babel/preset-react"]
          }
        }
      }
    ]
  },
  resolve:{
    extensions: ['*','.jsx','.js','.json']
  },
  stats: {
    colors: true,
    modules: true,
    reasons: true,
    errorDetails: false
  }
} 
