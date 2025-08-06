# Thiết lập hệ thống Build cho Chrome Extension

Để sử dụng đầy đủ ES Modules trong Chrome Extension, bạn cần thiết lập một hệ thống build. Tài liệu này hướng dẫn cách thiết lập Webpack để bundle các ES modules.

## Cài đặt Webpack

1. **Khởi tạo NPM**

```bash
cd extension-main-v2
npm init -y
```

2. **Cài đặt Webpack và các dependencies**

```bash
npm install --save-dev webpack webpack-cli babel-loader @babel/core @babel/preset-env
```

3. **Tạo file cấu hình Webpack**

Tạo file `webpack.config.js` tại thư mục gốc:

```javascript
const path = require('path');

module.exports = {
  mode: 'development', // 'production' for minified output
  entry: {
    background: './src/background/background.js',
    content: './src/content/content.js',
    popup: './js/popup.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
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
    ]
  }
};
```

4. **Cập nhật package.json**

Thêm scripts build:

```json
"scripts": {
  "build": "webpack --config webpack.config.js",
  "watch": "webpack --watch --config webpack.config.js"
}
```

5. **Cập nhật manifest.json để sử dụng các file được bundle**

```json
{
  "background": {
    "service_worker": "dist/background.bundle.js"
  },
  "content_scripts": [
    {
      "matches": ["http://*/*", "https://*/*"],
      "js": ["dist/content.bundle.js"],
      "run_at": "document_idle"
    }
  ]
}
```

6. **Tạo file popup.html mới để sử dụng bundled JavaScript**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="css/styles.css">
  <title>SEO AI Assistant</title>
</head>
<body>
  <div id="root"></div>
  <script src="dist/popup.bundle.js"></script>
</body>
</html>
```

## Sử dụng React

Nếu muốn sử dụng React (đề xuất cho PopupUI):

1. **Cài đặt React và Babel preset cho React**

```bash
npm install --save react react-dom
npm install --save-dev @babel/preset-react
```

2. **Cập nhật cấu hình Babel trong webpack.config.js**

```javascript
module: {
  rules: [
    {
      test: /\.m?jsx?$/, // Support .js and .jsx
      exclude: /(node_modules)/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env', '@babel/preset-react']
        }
      }
    }
  ]
}
```

3. **Cập nhật entry point cho React**

```javascript
entry: {
  // ... other entries
  popup: './src/popup/popup.js' // Changed from ./js/popup.js
}
```

## Hướng dẫn sử dụng

1. **Build extension**

```bash
npm run build
```

Hoặc chạy chế độ watch để tự động rebuild khi có thay đổi:

```bash
npm run watch
```

2. **Cài đặt extension**

Sau khi build, thư mục `dist` sẽ chứa các file được bundle. Cài đặt extension bằng cách:

- Mở Chrome/Edge và truy cập `chrome://extensions` hoặc `edge://extensions`
- Bật "Developer mode"
- Click "Load unpacked" và chọn thư mục `extension-main-v2`

## Cấu trúc file sau khi build

```
extension-main-v2/
  ├── dist/                         # Thư mục đầu ra của webpack
  │   ├── background.bundle.js      # Background script được bundle
  │   ├── content.bundle.js         # Content script được bundle
  │   └── popup.bundle.js           # Popup script được bundle
  ├── src/                          # Source code directory
  │   ├── background/              
  │   ├── content/                  
  │   ├── popup/                    
  │   └── shared/                   
  ├── css/                          
  ├── images/                       
  ├── node_modules/                 # NPM packages
  ├── manifest.json                 # Đã cập nhật để trỏ đến các file bundle
  ├── package.json                  # NPM package configuration
  └── webpack.config.js             # Webpack configuration
```

## Lưu ý

- Webpack sẽ bundle tất cả các dependencies, bao gồm cả ES modules
- Bạn vẫn có thể sử dụng import/export trong code nguồn
- Cấu trúc thư mục gốc vẫn được giữ nguyên, chỉ thay đổi các đường dẫn trong manifest.json

## Tài liệu tham khảo

- [Webpack Documentation](https://webpack.js.org/concepts/)
- [Chrome Extensions with Webpack](https://developer.chrome.com/docs/extensions/mv3/getstarted/)
- [Babel Documentation](https://babeljs.io/docs/en/)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
