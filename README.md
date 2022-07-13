# reveal-pdf

Convert PDF slides to [reveal.js](https://revealjs.com/) slides.

将你的PDF演示文稿转换为利用[reveal.js](https://revealjs.com/)展示的版本。可以自动识别章节，将同一章节的幻灯片放置在同一组[vertical slides](https://revealjs.com/vertical-slides/)内；能够识别`\pause`等beamer overlay，移除连续相同页码的切换动画。

## 如何使用

环境依赖：`nodejs`， `git`。

1. 克隆本仓库的主分支，以获得代码
    ```bash
    git clone https://github.com/WunschUnreif/Reveal-PDF.git
    ```
2. 安装依赖，编译源码，安装命令行工具
   ```bash
   npm install
   npm run build
   npm run link
   ```
   安装后不能删除代码仓库中的文件，因为`npm run link`只是添加一个符号链接。
3. 使用
   ```bash
   reveal-pdf -i <path/to/pdf> -o <output-dir>
   ```
   用浏览器打开`<output-dir>/index.html`即可。
4. 卸载
    ```bash
    npm run unlink
    ```

## 示例

[转换自`test/sample.pdf`](https://wunschunreif.github.io/Reveal-PDF/)

## 已知问题

- 对于PDF文件中的部分字体可能无法解析，导致相应的页面不能成功转换。

## Changelog

### 0.0.2

#### 【功能】

- 识别PDF文档的页码标签，为连续相同页码的幻灯片移除切换动画

### 0.0.1

- 基本功能
