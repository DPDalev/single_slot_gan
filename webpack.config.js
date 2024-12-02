const path = require("path");
const PACKAGE = require('./package.json');

var FILE_NAME = "game";
var LIBRARY_NAME = PACKAGE.name;

var PATHS = {
  entryPoint: path.resolve(__dirname, 'src/index.ts'),
  dist: path.resolve(__dirname, 'dist')
}

module.exports = {
  mode: "development",
  entry: {
    [FILE_NAME]: [PATHS.entryPoint],
  },
  output: {
    path: PATHS.dist,
    filename: '[name].js',
    // libraryTarget: 'umd',
    // library: LIBRARY_NAME,
    // umdNamedDefine: true
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  module: {
    rules: [
      { test: /\.css$/, use: 'css-loader' },
      { test: /\.ts$/, use: 'ts-loader' },
    ],
  
  }
}