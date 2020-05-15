const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
const Dotenv = require('dotenv-webpack');


module.exports = {
    mode: 'development',
    entry: './src/app.js',
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    plugins: [
        new CopyWebpackPlugin(['index.html']),
        new webpack.HotModuleReplacementPlugin(),
        new MiniCssExtractPlugin({filename:'[name].bundle.css'}),
        new FaviconsWebpackPlugin('sudoku_icon.png'),
        new Dotenv()
    ],
    module: {
        rules: [
            {
                test: /\.js$/,
                include: __dirname + '/src',
                exclude: /node_modules/
            },
            {
                test: /\.(s*)css$/,
                include: __dirname + '/src',
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader
                    },
                    'css-loader', 
                    'sass-loader'
                ]
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                use: ['file-loader'],
            },
        ]
    },
    devServer: {
        contentBase: './dist',
        overlay: true,
        hot: true
    },
    node: {
        fs: 'empty'
    }
};