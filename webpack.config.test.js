var path = require('path');
var webpack = require('webpack');

config = require('./webpack.config.js');

config.entry = {
  testEventPage: ['./test/testEventPage'],
  testModels: ['./test/testModels'],
  testPopup: ['./test/testPopup'],
  common: [
    'jquery',
    'tooltip'
  ]
};

config.output = {
  path: path.resolve(__dirname, './test/build'),
  pathinfo: true,
  filename: '[name].js'
};

module.exports = config;