// Pages that are copied into the build verbatim instead of being generated from
// the content folder. They are single-language by design, so the bilingual
// markup check in check.mjs does not apply to them.
//
// time-mirror-demo/ is the Time Mirror product demo. It is a single
// self-contained file, copied verbatim from the source repo
// (Voskamp099/time-mirror, demo/index.html) so the published path is
// /time-mirror-demo/ — the path both READMEs of that repo point at.
export const STATIC_PAGES = ['technical-profile.html', 'time-mirror-demo/index.html'];
