# Raelynn — 项目与笔记

[English](README.md) · [简体中文](README.zh-CN.md)

个人项目与技术博客，发布到 **https://voskamp099.github.io/**。

沿用所提供 HTML 模板的奶油色底、橙色点缀和等宽字体，把页面整理为文章、项目和关于三个区域。浅色背景保留稀疏的淡点阵，深色背景使用纯色。

- 中英文切换、深浅色切换，偏好保存在浏览器。
- 文章搜索与分类，手机导航，键盘焦点和减少动态效果支持。
- 一个项目对应一篇完整记录，调试过程作为文章内的章节；每篇文章有独立地址，提供站点地图和 404 页面。
- RSS 保留给订阅阅读器自动发现，页面不显示直接打开 XML 的按钮。
- 文章用 Markdown 保存，构建后是静态 HTML，适用于 GitHub Pages。
- 不包含旧网站的简历、私有资料、数据库或后台管理入口。

## 本地查看

需要 Node.js 22 或更高版本，以及 Python 3。

```bash
npm ci
npm run build
npm run check
npm run dev
```

打开终端打印的本地地址。

## 添加文章

在 content/posts/ 中增加：

1. 一份 JSON 元数据，包含唯一 slug、日期、分类、标签与中英文标题、简介。
2. 中文和英文两份 Markdown 正文，并在 JSON 的 body 字段中填写文件名。

现有文章可以作为格式样例。修改后运行 npm run build 和 npm run check，提交并推送到 main。GitHub Actions 会自动构建并发布 dist/。

## 关键词库

所有文章的关键词都从 content/tag-library.json 里选，不要在文章 JSON 里直接写标签文字。

- 库里的每条关键词有 id、英文名、中文名和分组（platform / stack / method / topic / format）。
- 每篇文章固定 4 个关键词，数量由库里的 perPost 决定。
- 文章 JSON 的 tags 字段只写 id，例如 "tags": ["worldquant-brain", "quant-research", "automation", "ai-collaboration"]。
- 构建时会校验：出现库里没有的 id，或者数量不等于 perPost，npm run build 直接报错。
- 页面上的胶囊会按当前语言显示中文名或英文名，搜索同时匹配两种语言。

需要新关键词时，先在 tag-library.json 里加一条，再在文章里引用。

首次发布需要在仓库 Settings → Pages 中选择 GitHub Actions；已经启用的仓库无需重复设置。

项目使用一个小型 Node.js 构建脚本和 markdown-it，没有应用服务器或数据库。源码仓库是公开的，草稿和个人材料不要放进来。
