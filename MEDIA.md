# Where the media lives

A note for future me, because the sample videos are the part of this site
that can actually break.

## The short version

The videos live in this repository, and they are committed to it in the
clear. They are not on a separate host, a CDN, or object storage. That is a
deliberate choice: the material stays next to the code that presents it, and
there is no second service to keep alive, pay for, or lose the keys to.

The published site does **not** serve them in the clear, though. The build
encrypts the material and the catalogue with an access code; a visitor has to
type the code before the pages and the clips appear. See "The access gate"
below.

It also means the media counts against GitHub's limits, so the numbers below
matter.

## The access gate

The sample material is research work, and it is published for people who were
given a code rather than for the whole internet. Three things have to hold
for that to be true, and all three are in place:

1. **The catalogue is encrypted.** `/sample-of-work/` and everything under it
   are built as an encrypted payload plus a shell that shows the lock. The
   published HTML contains no task titles, no prompts, no licences — only the
   lock panel.
2. **The clips are encrypted.** The delivered videos and their poster frames
   are encrypted with the same key and published as ciphertext under
   `dist/assets/media/<hash>.bin`. The browser decrypts them after the code is
   entered and plays them from a blob. The published figures that belong to
   the *notes* stay in the clear — a note is the public record, the catalogue
   behind it is the delivery.
3. **The repository stays public — a known trade-off.** The clips are committed
   here in the clear, so the gate protects the *site*, not the repository:
   anyone can clone this repo and get the original material. Making the
   repository private would close that, but GitHub Pages only accepts a
   private source on GitHub Pro — on the Free plan a private repository
   unpublishes the site entirely, which was measured, not assumed. Until the
   account moves to Pro, this is the remaining gap in the sharing story, and
   it is the reason to keep the repository out of reach of people who should
   not have the material.

The key is derived from one short access code with PBKDF2 (210,000 rounds,
SHA-256), so guessing it offline is slow. The code is short on purpose — it
can be read aloud and typed from memory — which means this is a sharing gate,
not a vault. Anyone who has the code can pass the material on.

The access code lives in `scripts/gate.mjs`, or in the `SAMPLE_ACCESS_CODE`
environment variable, which wins. Changing it re-encrypts everything, so
material shared under the old code stops opening.

To try it locally:

```
npm run build
python3 -m http.server 8141 --directory dist --bind 127.0.0.1
# open http://127.0.0.1:8141/sample-of-work/ and type the code
```

## Layout

| Path | What | Size |
|---|---|---|
| `assets/v2v-samples/` | OmniReason task clips (`<id>-input.mp4`, `-target.mp4`, plus `-reference.mp4` for the RV2V modality) and their poster frames | ~43 MB |
| `assets/generator-samples/` | Counterfactual generator clips (`<id>-true.mp4`, `-counterfactual.mp4`, plus `-mask.mp4` and `-overlay.mp4` for the generators that reached main) and posters | ~12 MB |
| `assets/research/counterfactual/` | The static four-panel figures used by the article: true, counterfactual, binary mask, QA overlay | ~1 MB |
| `assets/research/v2v/` | Diagrams used in the articles | <1 MB |

`content/v2v-task-samples.json`, `content/counterfactual-samples.json` and
`content/v2v-task-480-appendix.json` describe what exists. The build script
reads those files, so adding a sample means adding the media and the JSON
entry — the page is generated, never hand-written.

## The limits that actually bind

From GitHub's Pages documentation:

| Limit | Value | Kind | Where we stand |
|---|---|---|---|
| Published site size | 1 GB | hard | 52 MB — 5% used |
| Source repository size | 1 GB | recommended | 123 MB |
| Bandwidth | 100 GB / month | soft | Needs ~2,000 full-site visits a month to hit it |
| Builds | 10 / hour | soft | Not applicable, deployment runs on GitHub Actions |
| Single file | 100 MB | hard | Largest clip is 10 MB |

**Bandwidth is not the constraint.** The site serves a lot of media per visit,
but at this traffic level it would take thousands of visits a month to matter.

**Site size is the constraint.** It is a hard limit, and every new batch of
samples adds to it. This is the number to watch.

## The four-stream set of a generator

A generator that reached main ships four streams for one case: the true clip, the
counterfactual clip, the formal binary mask and the QA overlay that marks the
region the generator changed. The site shows all four in one row, in that order,
and takes them from the version that was merged into main — the delivered
artefact, not a working copy.

The rule the pages follow lives in README.md, under "Sample pages" and "Media
rules"; this section is the media-side record of how the set is built.

Two things about that set are easy to get wrong, so they are written down here.

**The names in the merged delivery are not always in the delivered order.** In the
approved36 batches the file called `case_XX_counterfactual.mp4` holds the binary
mask and the one called `case_XX_mask.mp4` holds the counterfactual clip. The
panels on this site are taken from the review page of the merged head, which
labels them correctly, and the mask panel is compared against the merged file
byte for byte before it is published.

**The mask panel has to stay binary.** It is encoded losslessly, so the label
stays a strict black-and-white mask instead of picking up compression ringing.
The overlay is the red-tinted copy from the same delivery, and it is the panel
that makes the change readable without watching the two clips side by side.

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
