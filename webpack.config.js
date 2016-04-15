'use strict'
module.exports = {
  entry: './src/index.js',
  output: {
    path: 'tmp',
    filename: 'index.js',
    libraryTarget: 'commonjs2'
  },
  target: 'node',
  module: {
    noParse: /node_modules\/json-schema\/lib\/validate\.js/,
    loaders: [
      {test: /\.coffee$/, loader: 'coffee-loader'},
      {test: /\.json$/, loader: 'json-loader'},
      {
        test: /\.js/,
        loader: 'babel',
        exclude: /node_modules/
      }
    ]
  }
}
