import path from "path";
import sass from "sass";
import fibers from "fibers";

import { Configuration } from "webpack";

import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";

const isDev = process.env.NODE_ENV === "development";

const base: Configuration = {
  mode: isDev ? "development" : "production",
  resolve: {
    extensions: [".js", ".ts", ".jsx", ".tsx", ".json"],
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    publicPath: "./",
    filename: "[name].js",
    assetModuleFilename: "images/[name][ext]",
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: "ts-loader",
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: { sourceMap: isDev },
          },
          {
            loader: "sass-loader",
            options: {
              sourceMap: isDev,
              implementation: sass,
              sassOptions: { fiber: fibers },
            },
          },
        ],
      },
      {
        test: /\.(bmp|ico|gif|jpe?g|png|svg|ttf|eot|woff?2?)$/,
        type: "asset/resource",
      },
    ],
  },
  devtool: isDev ? "inline-source-map" : false,
};

const main: Configuration = {
  ...base,
  target: "electron-main",
  entry: {
    main: "./src/main",
  },
};

const preload: Configuration = {
  ...base,
  target: "electron-preload",
  entry: {
    preload: "./src/preload.ts",
  },
};

const renderer: Configuration = {
  ...base,
  target: "web",
  entry: {
    renderer: "./src/renderer",
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/index.html",
      minify: !isDev,
      inject: "body",
      filename: "index.html",
      scriptLoading: "blocking",
    }),
    new MiniCssExtractPlugin(),
  ],
};

export default [main, preload, renderer];
