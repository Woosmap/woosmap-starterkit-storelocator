"use strict";
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
    plugins: [
        new CopyWebpackPlugin([
            {from: 'app/images', to: 'images'}
        ]),
        new MiniCssExtractPlugin(),
        new HtmlWebpackPlugin({
            template: 'app/index.html',
            inject: 'head'
        })],
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: [{
                    loader: MiniCssExtractPlugin.loader,
                    options: {
                        hmr: process.env.NODE_ENV === 'development',
                        reloadAll: true,
                    }
                }, 'css-loader'],
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
        filename: 'storelocator.js'
    },
    mode: 'development',
    devServer: {
        contentBase: path.join(__dirname, 'dist')
    }
};
