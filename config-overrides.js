// config-overrides.js
const webpack = require('webpack');

module.exports = function override(config, env) {
    // Adding fallbacks for Node.js core modules
    config.resolve.fallback = {
        os: require.resolve('os-browserify/browser'),
        fs: false,
        child_process: false,
        querystring: require.resolve('querystring-es3'),
        path: require.resolve("path-browserify"),
        https: require.resolve("https-browserify"),
        http: require.resolve("stream-http"),
        crypto: require.resolve("crypto-browserify"),
        tls: false,
        net: false,
        process: require.resolve("process/browser"),
        vm: require.resolve('vm-browserify'),
        buffer: require.resolve('buffer/'),
    };

    // Adding DefinePlugin to define global variables
    // config.plugins.push(
    //     new webpack.DefinePlugin({
    //         'global': 'window', // Define global to window
    //         'process.env': JSON.stringify(process.env), // Define process.env
    //         'browser': JSON.stringify(true), // Ensure browser is defined as a string
    //         process: 'process/browser', // This line defines process
    //     })
    // );

    return config;
};