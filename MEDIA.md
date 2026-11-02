# Where the media lives

A note for future me, because the sample videos are the part of this site
that can actually break.

## The short version

The videos are committed to this repository and served straight from GitHub
Pages. They are not on a separate host, a CDN, or object storage. That is a
deliberate choice: the material stays next to the code that presents it, and
there is no second service to keep alive, pay for, or lose the keys to.

It also means the media counts against GitHub's limits, so the numbers below
matter.

## Layout

| Path | What | Size |
|---|---|---|
| `assets/v2v-samples/` | OmniReason task clips (`<id>-input.mp4`, `-target.mp4`, plus `-reference.mp4` for the RV2V modality) and their poster frames | ~43 MB |
| `assets/generator-samples/` | Counterfactual generator clips (`<id>-true.mp4`, `-counterfactual.mp4`) and posters | ~11 MB |
| `assets/research/counterfactual/` | The four-panel figures: true, counterfactual, binary mask, QA overlay | ~1 MB |
| `assets/research/v2v/` | Diagrams used in the articles | <1 MB |

`content/v2v-task-samples.json`, `content/counterfactual-samples.json` and
`content/v2v-task-480-appendix.json` describe what exists. The build script
reads those files, so adding a sample means adding the media and the JSON
entry — the page is generated, never hand-written.

## The limits that actually bind

From GitHub's Pages documentation:

| Limit | Value | Kind | Where we stand |
|---|---|---|---|
| Published site size | 1 GB | hard | 51 MB — 5% used |
| Source repository size | 1 GB | recommended | 123 MB |
| Bandwidth | 100 GB / month | soft | Needs ~2,000 full-site visits a month to hit it |
| Builds | 10 / hour | soft | Not applicable, deployment runs on GitHub Actions |
| Single file | 100 MB | hard | Largest clip is 10 MB |

**Bandwidth is not the constraint.** The site serves a lot of media per visit,
but at this traffic level it would take thousands of visits a month to matter.

**Site size is the constraint.** It is a hard limit, and every new batch of
samples adds to it. This is the number to watch.

## Keeping the size down

The clips were originally exported at very high bitrates for a 2-3 second
window — one held 25 Mbps for 3.4 seconds, 10 MB for a fragment you watch
for three seconds. Re-encoding at CRF 26 is visually identical (SSIM 0.99,
PSNR 36-38 dB) and cut the video payload from 118 MB to 44 MB.

Run it whenever new raw clips arrive:

```
npm run compress:videos          # rewrites the files in place
npm run compress:videos -- --dry-run   # shows what it would do
```

The script is safe to re-run. It skips clips that are already efficiently
encoded, never replaces a file with a larger one, and leaves a file alone
when the gain is under 15% — another generation of loss is not worth a
marginal saving.

## The capacity guard

`npm run check` includes `scripts/check-capacity.mjs`, which reports the
site size, the media size and the repository size, and fails the build past
70% of the limit. GitHub Actions runs the same check on every push, so the
number is noticed while there is still room to act.

## If the limit is ever reached

Moving the media out of the repository is the escape hatch, and it is not
urgent — there is room for roughly eighteen more batches of samples. The
options, in order of how much they change:

1. **Compress harder.** CRF 30 and a downscale would buy another 30-40 MB.
   The cost is visible quality, which matters here because the samples are
   research material rather than decoration.
2. **Store the media in object storage** (Cloudflare R2, S3 + CloudFront,
   Backblaze B2) and point the build at it. This removes the site-size limit
   entirely and usually reduces egress cost to zero. It also means a second
   service that can fail, that needs credentials, and that has to be paid for.
3. **Publish the media as GitHub release assets** and link to them. Keeps
   everything on GitHub, but release assets are downloads rather than inline
   media, so the pages lose the side-by-side layout.

## One more thing worth knowing

The git history still holds the original, uncompressed clips from the first
commit. That is deliberate: the pristine material stays recoverable. It
also means the repository cannot shrink below its current size without
rewriting history, which would change every commit hash and break the
deployment's cache. If the repository ever needs to shrink, rewrite the
history first, then force-push once.

## Verifying the site still works

```
npm run build && npm run check     # links, bilingual audit, capacity
npm run audit:runtime              # real browser, both languages (needs Playwright)
```

The runtime audit needs a browser once:

```
npx playwright install chromium
npm run build && python3 -m http.server 8141 --directory dist --bind 127.0.0.1
BASE_URL=http://127.0.0.1:8141 npm run audit:runtime
```
