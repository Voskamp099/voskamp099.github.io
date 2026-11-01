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
- The chips on a research article describe the work itself: the field it belongs to (Video
  reasoning, AI), the kind of work (Benchmark, Multi-model, Counterfactual) and the form of the
  write-up (Research notes, Evaluation). A chip that only describes internal plumbing does not
  belong on the article.

To introduce a new tag, add it to content/tag-library.json first, then reference its id from a post.

## Post writing conventions

- **Titles use a "Name: description" shape.** Product posts lead with the project name (PetAssistant,
  AlphaForge) and one clause after the colon; the English title keeps the same shape with a lowercase
  start after the colon, for example "AlphaForge: alpha research with an agent".
- **Name the project in the first paragraph** so a title name is never unexplained in the body.
- **Topic pills use the same boxed style everywhere.** The keyword row under an article title and the
  pills on a sample page use the homepage pill style, so a reader sees the same chip shape in every
  place.
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

## Sample pages

A sample page is a page of its own, not a section inside an article. The article carries the method
and the lessons; the sample page carries the artefacts, one entry per task and one entry per
generator, so it can be shared on its own.

- The catalogue lives in content/v2v-task-samples.json and content/counterfactual-samples.json, and
  scripts/build.mjs renders it. Every entry has an id, a name, a modality or a phenomenon id, a
  one-line description in both languages, the source dataset, the licence and the line to cite it by.
- /sample-of-work/ is a directory, not a long page. Its rows use the same list style as the writing
  section: an id on the left, a chip, a title, one line of description, and a link out. Every entry
  opens on a page of its own: /sample-of-work/task-<id>/ for a task, /sample-of-work/generator-<slug>/
  for a counterfactual generator, /sample-of-work/appendix-task-480/ for the Task 480 appendix.
- The directory shows the generator section itself. A section that is only a link to another page is
  not a section.
- The two modalities are spelled out for the reader: Video to Video and Reference Video to Video.
  The abbreviations never appear in reader-facing text.
- Every entry carries a Chinese task name and a Chinese prompt next to the English ones, because
  the Chinese page is the one people read first.
- A task entry shows the input video, the target video and the prompt. A Reference Video to Video
  task also shows its reference asset, on its own labelled row above the input and target pair.
- Every clip on the page is rendered in the same box, so a reference asset and an input clip read as
  the same object and no frame is ever cropped.
- A generator entry shows the true clip beside the counterfactual clip, plus the phenomenon id.
- The page never states whether a task is finished, passed or pending.
- Every task card carries its own "play together" control that starts that task's clips at once;
  the page keeps one "pause all" control above the entries.

### Media rules

- Publish at the quality the host allows. GitHub Pages serves the files as they are, so clips are
  kept at their native resolution and never downscaled for the web; only the container is changed
  (faststart), or the pixel format when a browser cannot decode the original.
- Every clip gets a poster image so the page shows a real frame before playback.
- Footage that may not be redistributed is not published: the entry then shows the prompt and the
  task definition only, and says so in one line.
- Clips live under assets/v2v-samples/ (tasks) and assets/generator-samples/ (generators), H.264,
  yuv420p, faststart, no audio.

### Licence rules

- Check the licence of the source dataset before publishing any frame of it. The licence, its link
  and a ready-to-use citation line travel with every entry.
- Redistributable sources (Apache-2.0, MIT, CC BY, CC BY-SA, public domain) are published with the
  attribution they require.
- Non-commercial sources (CC BY-NC) are published only with the non-commercial term stated, because
  the page is not a commercial product but the term still binds anyone reusing the clip.
- Sources that restrict redistribution, stock footage without a recorded clearance, and sources whose
  licence is not recorded are not published as frames.

## Design and templates

- The site's colours live in the CSS custom properties at the top of assets/site.css. A new template means new
  values for those properties plus the handful of component rules that carry the template's character
  (corner radius, borders, top bar).
- Before a template is published it is built locally and looked at as a whole site, not as one page. The
  preview lives outside the repository and is served over http://127.0.0.1:4177/.
- Each template gets its own copy of the built site with the template stylesheet linked last, so the
  comparison is the real pages in a new palette.
- Colour and arrangement are reviewed separately: the palette first, then the layout. Changing the layout
  does not carry a new palette along with it.

## What a research write-up contains

- One real sample per generator or per task, not a description of the idea.
- For dataset work, list every task that reached a formal review pass. A task that passed Gate B but
  has not reached Gate C still counts and stays on the list.
- The public pages do not show which stage each task reached. Gate and delivery state stays internal;
  readers see the task definition, the sample and the method.
- Third-party source footage stays in the team's storage unless its licence allows redistribution. The
  write-up publishes the contract, the workflow and the numbers; the frames live on the sample page
  when the licence allows it, and stay in storage when it does not.

First-time publishing needs GitHub Actions selected under the repository's Settings → Pages; an already enabled repository needs no further change.

The project uses a small Node.js build script and markdown-it, with no application server or database. The source repository is public; keep drafts and personal material outside it.
