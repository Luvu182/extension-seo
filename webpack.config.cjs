const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
// Không sử dụng JavaScript Obfuscator
// const JavaScriptObfuscator = require('webpack-obfuscator');

module.exports = {
  mode: 'development', // Chế độ development để dễ debug
  devtool: 'source-map', // Bật source maps để dễ debug
  entry: {
    background: './src/background/background.js',
    content: './src/content/content.js',
    popup: './js/popup.js'
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
    extensionAlias: {
      '.js': ['.js', '.ts']
    },
    modules: [
      path.resolve(__dirname),  // Allow absolute imports from project root
      'node_modules'
    ]
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "manifest.json", to: "" },
        { from: "images", to: "images" },
        { from: "css", to: "css" },
         { from: "popup.html", to: "" },
         { from: "js/lib", to: "js/lib" }, // Sao chép thư viện web-vitals (Keep for now, might be needed elsewhere or by older code)
         { from: "js/modules", to: "js/modules" } // Temporarily re-added to include new components
       ],
     }),
     // Đã loại bỏ JavaScript Obfuscator để dễ debug
  ],
};
