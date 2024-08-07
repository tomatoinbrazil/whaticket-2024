// All this three lines bellow are importings
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require('path');

// Here goes all configuration
module.exports = {
  // mode: 'development'
  entry: './index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  resolve: {
    fallback: {
      "path": require.resolve("path"),
    }
  },
  module: {
    rules: [
       { 
        test: /\.js$/, // apply to all JS files
        exclude: /node_modules/, // exclude all files on node_modules
        use: {
          loader: 'babel-loader', // looks at .babelrc
        }
      }
    ]
  },
  plugins:[
    new HtmlWebpackPlugin({
      template: "public/index.html" // create a template to start from
    })
  ],
}