var path = require('path');
var webpack = require('webpack');
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  context: __dirname,

  resolve: {
    extensions: ['', '.js', '.json'],
    modulesDirectories: [
      'src/js',
      'node_modules'
    ]
  },

  entry: {
    eventpage: ['./src/js/eventPage.js'],
    models: ['./src/js/models.js'],
    constants: ['./src/js/constants.js'],
    popup: ['./src/js/popup.js'],
    options: ['./src/js/options.js'],
    common: [
      'jquery',
      'lodash',
      'tooltip'
    ]
  },

  output: {
    path: path.resolve(__dirname, './build'),
    pathinfo: true,
    filename: '[name].js'
  },

  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /\/node_modules/,
        loader: 'babel'
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: "babel",
        query: {
          presets: ["react", "es2015"],
          plugins: ["add-module-exports"],
        }
      },
      {
        test: /\.html$/,
        loader: "underscore-template-loader",
        query: {
            engine: "lodash",
        }
      }
    ],
  },

  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.ProvidePlugin({
      $: 'jquery',
      _: 'lodash',
      jQuery: 'jquery',
      tooltip: 'tooltip'
    }),
    // copy extra ./src files to the build folder
    new CopyWebpackPlugin([
      { from: 'manifest.json', to: 'manifest.json' },
      { from: 'src/css', to: 'css' },
      { from: 'src/assets', to: 'assets' },
      { from: 'src/options.html', to: 'options.html' },
      { from: 'src/popup.html', to: 'popup.html' }
    ])
  ]
};