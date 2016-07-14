module.exports = {
  devtool: 'source-map',
  entry: './demo/js/main.js',
  output: {
    path: './demo/',
    filename: 'bundle.js',
  },
  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel-loader',
    }],
  },
  devServer: {
    contentBase: './demo',
  },
};
