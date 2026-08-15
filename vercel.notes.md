# vercel.json notes

Vercel's schema rejects unknown top-level keys (including `"//"` comment keys), so the
rationale for each block lives here instead.

## rewrites

Only the interactive app routes fall back to the SPA shell. Everything public is prerendered
to its own `index.html` and served straight off the filesystem, so a blanket
`/(.*) -> /index.html` rewrite would shadow `404.html` and re-create the soft-404 problem this
build set out to fix.

## redirects

Keyword-variant URLs resolve to the single canonical page rather than becoming duplicate pages
competing for the same query.
