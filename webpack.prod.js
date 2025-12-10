import MiniCssExtractPlugin from "mini-css-extract-plugin"
import { dirname, resolve } from "path"
import { fileURLToPath } from "url"
import { merge } from "webpack-merge"
import common from "./webpack.common.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default merge(common, {
  mode: "production",
  devtool: "source-map",
  output: {
    filename: "[name].[contenthash].bundle.js",
    path: resolve(__dirname, "dist"),
    clean: true,
    publicPath: "/",
    assetModuleFilename: "assets/[name][ext]",
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              modules: false,
            },
          },
        ],
      },
      {
        test: /\.(png|jpg|jpeg|gif|ico|svg)$/i,
        type: "asset/resource",
        generator: {
          filename: "images/[name][ext]",
        },
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "[name].[contenthash].css",
      chunkFilename: "[id].[contenthash].css",
    }),
  ],
  optimization: {
    minimize: true,
    usedExports: true,
    sideEffects: false,
    concatenateModules: true,
  },
  performance: {
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
    hints: "warning",
  },
})
