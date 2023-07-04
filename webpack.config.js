const TerserPlugin = require("terser-webpack-plugin");
const path = require("path");
const webpack = require("webpack");
const config = {};

config.web = {
  name: "web",
  entry: "./build/esm/web/bundle.js",
  mode: "development",
  target: "web",
  devtool: "inline-source-map",
  devServer: {
    contentBase: "./dist",
  },
  resolve: {
    alias: {
      // process: "process/browser",
      crypto: "crypto-browserify",
      "stream/promises": path.resolve(__dirname, "node_modules/readable-stream/lib/stream/promises.js"),
      stream: "stream-browserify",
      "$/utils": path.resolve(__dirname, "./build/esm/web/utils"),
    },
    fallback: {
      // process: require.resolve("process/browser"),
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
    },
    extensions: [".ts", ".js"],
  },
  plugins: [
    // new webpack.ProvidePlugin({
    //   process: "process/browser",
    // }),
  ],
  output: {
    filename: "web.bundle.js",
    path: path.resolve(__dirname, "build"),
    // libraryTarget: "umd",
    // library: "Arweave",
  },
};

config.webprod = {
  name: "web-prod",
  entry: "./build/esm/web/bundle.js",
  mode: "production",
  target: "web",
  devtool: "source-map",
  devServer: {
    contentBase: "./dist",
  },
  resolve: {
    alias: {
      // process: "process/browser",
      crypto: "crypto-browserify",
      "stream/promises": path.resolve(__dirname, "node_modules/readable-stream/lib/stream/promises.js"),
      stream: "stream-browserify",
      "$/utils": path.resolve(__dirname, "./build/esm/web/utils"),
    },
    fallback: {
      // process: require.resolve("process/browser"),
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
    },
    extensions: [".ts", ".js"],
  },
  // plugins: [
  //   new webpack.ProvidePlugin({
  //     process: "process/browser",
  //   }),
  // ],
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
  output: {
    filename: "web.bundle.min.js",
    path: path.resolve(__dirname, "build"),
    // libraryTarget: "umd",
    // library: "Arweave",
  },
};

config.webtests = {
  name: "web-tests",
  entry: "./tests/web/web.ts",
  mode: "development",
  target: "web",
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: "ts-loader",
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias: {
      // process: "process/browser",
      "stream/promises": path.resolve(__dirname, "node_modules/readable-stream/lib/stream/promises.js"),
      "$/utils": path.resolve(__dirname, "./build/esm/web/utils"),
    },
    fallback: {
      // process: require.resolve("process/browser"),
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      buffer: require.resolve("buffer/"),
    },
  },
  plugins: [
    new webpack.ProvidePlugin({
      // process: "process/browser",
      buffer: "buffer/",
      crypto: "crypto-browserify",
      stream: "stream-browserify",
    }),
  ],
  devtool: "inline-source-map",
  devServer: {
    contentBase: "./dist",
  },
  output: {
    filename: "webtests.bundle.js",
    path: path.resolve(__dirname, "build"),
    // libraryTarget: "umd",
    // library: "Arweave",
  },
};

module.exports = [config.web, config.webprod, config.webtests];
