import path from "path";

import { Configuration } from "webpack";

import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";

const isDevelopmentMode = process.env.NODE_ENV === "development";

const base: Configuration = {
  mode: isDevelopmentMode ? "development" : "production",
  resolve: {
    extensions: [".js", ".ts", ".jsx", ".tsx", ".json"],
  },
  output: {
    path: path.resolve(__dirname, "build"),
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
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: { sourceMap: isDevelopmentMode },
          },
        ],
      },
      {
        test: /\.(bmp|ico|gif|jpe?g|png|svg|ttf|eot|woff?2?)$/,
        type: "asset/resource",
      },
    ],
  },
  watch: isDevelopmentMode,
  devtool: isDevelopmentMode ? "inline-source-map" : false,
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
      minify: !isDevelopmentMode,
      inject: "body",
      filename: "index.html",
      scriptLoading: "blocking",
    }),
    new MiniCssExtractPlugin(),
  ],
};

export default [main, preload, renderer];
