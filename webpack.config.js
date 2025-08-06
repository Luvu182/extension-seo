const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development', // 'production' for minified output
  devtool: 'source-map', // Source maps for development
  entry: {
    background: './src/background/background.js',
    content: './src/content/content.js',
    popup: './js/popup.js'
    // Chúng ta sẽ thêm popup React component khi hoàn thiện
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true, // Clean the output directory before build
  },
  experiments: {
    topLevelAwait: true, // Enable top-level await
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: {
                  browsers: ['last 2 Chrome versions']
                },
                modules: false // Preserve ES modules
              }]
            ]
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js'],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "manifest.json", to: "" },
        { from: "images", to: "images" },
        { from: "css", to: "css" },
        { from: "popup.html", to: "" },
        { from: "js/lib", to: "js/lib" }, // Copy web-vitals library and handler
        { from: "js/modules", to: "js/modules" }, // Copy the modules folder
      ],
    }),
  ],
  // Explicitly ensure web-vitals is not externalized
  externals: {
    // List any dependencies you DON'T want to be externalized
    // Specifically do not externalize web-vitals to ensure it's properly bundled
  },
};
