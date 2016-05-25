var path = require('path');
var webpack = require('webpack');

module.exports = {
  context: __dirname + '/../src/js',

  entry: {
    eventpage: ['./eventPage.js'],
    models: ['./models.js'],
    constants: ['./constants.js'],
    popup: ['./popup.js'],
    options: ['./options.js'],
    common: [
      'jquery',
      'lodash',
      'tooltip'
    ]
  },

  output: {
    path: path.resolve(__dirname, '../build'),
    pathinfo: true,
    filename: '[name].js',
    sourceMapFilename: '[name].map'
  },

  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /\/node_modules/,
        loader: 'babel'
      },
      {
        test: /\.css$/,
        loader: 'style!css'
      },
      {
        test: /\.tpl$/,
        loader: 'raw'
      },
      {
        test: /\.png$/,
        loader: 'url?limit=10000&name=assets/[name].[ext]'
      },
      {
        test: /\.html$/,
        loader: "underscore-template-loader",
        query: {
            engine: "lodash",
        }
      }
    ],
    // noParse: /\/node_modules/
  },

  resolve: {
    extensions: ['', '.js', '.json'],
    modulesDirectories: [
      '../node_modules',
    ]
  },

  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      _: 'lodash',
      jQuery: 'jquery',
      tooltip: 'tooltip'
    }),
   new webpack.optimize.CommonsChunkPlugin('common', 'common.js')
  ]
};
