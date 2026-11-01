# Raelynn — Projects & Notes

[English](README.md) · [简体中文](README.zh-CN.md)

A personal project notebook and technical blog at **https://voskamp099.github.io/**.

The design retains the supplied reference's cream paper, orange accents, and monospace details, and organises the site into three areas: writing, projects, and a short introduction. Light mode uses a faint, sparse dotted background; dark mode uses a solid background.

- Bilingual content, persistent theme and language preferences, article search and categories, mobile navigation, keyboard focus support, and reduced-motion support.
- One complete article per project, with debugging notes included as sections in that article; every article has its own address, and the site ships a sitemap and a 404 page.
- RSS remains available for reader autodiscovery; visitor pages do not link directly to its XML document.
- Posts are written in Markdown and built into static HTML, which is what GitHub Pages serves.
- The repository contains no résumé, private material, database, or admin entry point from the old site.

## Local development

Node.js 22 or later and Python 3 are required.

```bash
npm ci
npm run build
npm run check
npm run dev
```

Open the local address printed in the terminal.

## Publish a post

Add the following under content/posts/:

1. A JSON metadata file with a unique slug, date, category, tags, and a title and summary in both languages.
2. Two Markdown bodies, one in Chinese and one in English, referenced by file name in the JSON body field.

An existing post can be used as a format sample. After editing, run npm run build and npm run check, then commit and push to main. GitHub Actions builds and publishes dist/ automatically.

## Tag library

Every tag comes from content/tag-library.json; post metadata only stores tag ids.

- Each library entry has an id, an English label, a Chinese label, and a group (platform / stack / method / topic / format).
- Every post uses exactly four tags, as set by perPost in the library.
- The tags field in a post JSON holds ids only, for example "tags": ["worldquant-brain", "quant-research", "automation", "ai-collaboration"].
- The build fails on an unknown id or a wrong tag count.
- Pills show the Chinese or English label depending on the active language, and search matches both.

To introduce a new tag, add it to content/tag-library.json first, then reference its id from a post.

## Post writing conventions

- **Titles use a "Name: description" shape.** Product posts lead with the project name (PetAssistant,
  AlphaForge) and one clause after the colon; the English title keeps the same shape with a lowercase
  start after the colon, for example "AlphaForge: alpha research with an agent".
- **Name the project in the first paragraph** so a title name is never unexplained in the body.
- **Topic pills appear only in the homepage writing list.** The keyword row under an article title is plain
  text.
- **Hovering an article card turns only the title red**; the keywords stay untouched.
- **Slugs stay stable** once published. When two posts are merged, add a redirect in
  scripts/static-pages.mjs.

## Categories and the filter row

Every post JSON carries a `categories` array. The filter row on the homepage is generated from the
categories that are actually in use, so a new category needs no site change beyond the post JSON and
the label map in scripts/build.mjs.

- `research` is reserved for research write-ups. Project posts keep their own category, and the card
  shows the first category as a small chip.
- The chip and the filter row are the only places a category is visible; the article body does not
  repeat it.

## Images and clips

- Images live under assets/ and are referenced with a root-relative path, for example
  `/assets/research/counterfactual/<name>.jpg`.
- A body can embed one or more clips with a line that contains only
  `%%VIDEO:/assets/.../true.mp4|/assets/.../counterfactual.mp4%%`. The build turns that line into a
  row of video players. The markdown renderer escapes raw HTML, so the request has to travel as
  plain text.
- Keep clips small: downscale to 512 pixels wide and keep each clip well under a megabyte.

## What a research write-up contains

- One real sample per generator or per task, not a description of the idea.
- For dataset work, list every task that reached a formal review pass. A task that passed Gate B but
  has not reached Gate C still counts, and the write-up states which state each task is in.
- Third-party source footage stays in the team's storage; publish the contract, the workflow and the
  numbers instead of the frames.

First-time publishing needs GitHub Actions selected under the repository's Settings → Pages; an already enabled repository needs no further change.

The project uses a small Node.js build script and markdown-it, with no application server or database. The source repository is public; keep drafts and personal material outside it.
