# Raelynn — Projects & Notes

[简体中文](#中文) · [English](#english)

个人项目与技术博客，发布到 **https://voskamp099.github.io/**。

## 中文

沿用提供的 HTML 模板的奶油色、橙色点缀和等宽字体，将页面整理为文章、项目和关于三个区域。浅色背景保留稀疏的淡点阵，深色背景使用纯色。

- 中英文切换、深浅色切换，偏好保存在浏览器。
- 文章搜索与分类，手机导航，键盘焦点和减少动态效果支持。
- 一个项目对应一篇完整记录，调试过程作为文章内的章节；每篇文章有独立地址，提供站点地图和 404 页面。
- RSS 保留给订阅阅读器自动发现，页面不显示直接打开 XML 的按钮。
- 文章用 Markdown 保存，构建后是静态 HTML，适用于 GitHub Pages。
- 不包含旧网站的简历、私有资料、数据库或后台管理入口。

### 本地查看

需要 Node.js 22 或更高版本，以及 Python 3。

~~~bash
npm ci
npm run build
npm run check
npm run dev
~~~

打开终端打印的本地地址。

### 添加文章

在 content/posts/ 中增加：

1. 一份 JSON 元数据，包含唯一 slug、日期、分类、标签、中英文标题与简介。
2. 中文和英文两份 Markdown 正文，并在 JSON 的 body 字段中填写文件名。

现有文章可以作为格式样例。修改后运行 npm run build 和 npm run check，提交并推送到 main。GitHub Actions 会自动构建并发布 dist/。

### 关键词库

所有文章的关键词都从 content/tag-library.json 里选，不要在文章 JSON 里直接写标签文字。

- 库里的每条关键词有 id、英文名、中文名和分组（platform / stack / method / topic / format）。
- 每篇文章固定 4 个关键词，数量由库里的 perPost 决定。
- 文章 JSON 的 tags 字段只写 id，例如 "tags": ["worldquant-brain", "quant-research", "automation", "ai-collaboration"]。
- 构建时会校验：出现库里没有的 id，或者数量不等于 perPost，npm run build 直接报错。
- 页面上的胶囊会按当前语言显示中文名或英文名，搜索同时匹配两种语言。

需要新关键词时，先在 tag-library.json 里加一条，再在文章里引用。

首次发布需要在仓库 Settings → Pages 中选择 GitHub Actions；已经启用的仓库无需重复设置。

## English

A personal project notebook and technical blog at **https://voskamp099.github.io/**.

The design retains the supplied reference's cream paper, orange accents, and monospace details. Light mode uses a faint, sparse dotted background; dark mode uses a solid background. It focuses on writing, projects, and a short introduction.

Features include bilingual content, persistent theme and language preferences, article search and categories, mobile navigation, a sitemap, and a custom 404 page. RSS remains available for reader autodiscovery; visitor pages do not link directly to its XML document.

### Local development

Use Node.js 22 or later and Python 3. Run npm ci, npm run build, npm run check, then npm run dev.

### Publish a post

Keep one complete article per project, with debugging notes included as sections in that article.

Add a JSON metadata file and two Markdown files under content/posts/, following an existing post. Both translations need a title, summary, and body. Use a unique slug and an ISO date.

### Tag library

Every tag comes from content/tag-library.json; post metadata only stores tag ids.

- Each library entry has an id, an English label, a Chinese label, and a group (platform / stack / method / topic / format).
- Every post uses exactly four tags, as set by perPost in the library.
- The tags field in a post JSON holds ids only, for example "tags": ["worldquant-brain", "quant-research", "automation", "ai-collaboration"].
- The build fails on an unknown id or a wrong tag count.
- Pills show the Chinese or English label depending on the active language, and search matches both.

To introduce a new tag, add it to content/tag-library.json first, then reference its id from a post.

Build and check locally, commit, and push to main. GitHub Actions publishes the generated dist/ directory to GitHub Pages. The source repository is public; keep drafts and personal material outside it.

The project uses a small Node.js build script and markdown-it, with no application server or database.
