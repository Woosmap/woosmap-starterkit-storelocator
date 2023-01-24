const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
    plugins: [
        new CopyWebpackPlugin(
            {
                patterns: [
                    {from: 'app/images', to: 'images'}
                ]
            }
        ),
        new MiniCssExtractPlugin(),
        new HtmlWebpackPlugin({
            template: 'app/index.html',
            inject: 'head'
        })],
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: [MiniCssExtractPlugin.loader, "css-loader"],
            },
            {
                test: /\.m?js$/,
                exclude: /(node_modules)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ],
    },
    entry: ['./app/src/init.js', './app/css/base.css', './app/css/effect.css', './app/css/theme.css'],
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: '[name].[fullhash].js'
    },
    mode: 'development',
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist')
        },
        server: 'https',
    }
};
