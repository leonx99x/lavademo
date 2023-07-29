const webpack = require("webpack");

module.exports = function override(config) {
  const fallback = {
    fs: false,
    os: false,
    path: false,
    crypto: require.resolve("crypto-browserify"),
    stream: require.resolve("stream-browserify"),
    assert: require.resolve("assert"),
    http: require.resolve("stream-http"),
    https: require.resolve("https-browserify"),
    os: require.resolve("os-browserify"),
    url: require.resolve("url"),
  };

  config.resolve.fallback = fallback;

  config.module.rules.push({
    test: /\.js$/,
    enforce: "pre",
    use: ["source-map-loader"],
  });

  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: "process/browser",
      Buffer: ["buffer", "Buffer"],
    }),
  ]);

  // Ignore warnings about failed source map parsing
  config.ignoreWarnings = [/Failed to parse source map/];

  return config;
};
