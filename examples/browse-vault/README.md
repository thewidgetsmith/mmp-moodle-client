# Example: browse the Vault (live)

A proof-of-concept demonstrating how a real web app would use
`mmp-moodle-client`: a small backend server holds the Moodle web service
token and proxies calls to Moodle via the client, while a plain
HTML/CSS/JS browser frontend talks only to that server's own same-origin
`/api/*` endpoints -- the token never reaches the browser, which is the
standard pattern for any third-party API that requires a secret credential.

It implements the scenario described in `AGENTS.md`:

1. Browse cards by interest tag (`criterianame: "tagid"`) or by free-text
   title/topic search (`criterianame: "search"`), both via
   `resources.core.course.searchCourses`.
2. Click a card to open a modal showing its embedded Vimeo video and a
   transcript link, fetched via `resources.core.course.getContents`
   (matching the `"Video"`/`"Transcript"` modules by name).

## Running it

This example requires a real Moodle instance and web service token -- there's
no bundled fixture/demo mode, since the point is to demonstrate live API
interaction.

```sh
# From the package root, only needed once (or after changing src/):
npm run build

MOODLE_BASE_URL=https://lms.example.com \
MOODLE_TOKEN=your_token \
node examples/browse-vault/server.mjs
```

Then open the printed URL (defaults to `http://localhost:4173`; override with
a `PORT` environment variable) in a browser. Enter a tag id (found via Site
administration > Search > Manage standard tags, or `core_tag_get_tag_cloud`)
or a search string, and click "Browse".

## Files

- `server.mjs` -- the backend: a plain `node:http` server (no framework, no
  dependencies) exposing two endpoints backed by the real client:
  - `GET /api/courses?criterianame=tagid|search&criteriavalue=...` -- proxies
    `searchCourses`, shaped down to just the fields a card needs.
  - `GET /api/courses/:id/contents` -- proxies `getContents`, extracting a
    Vimeo embed URL and transcript link.
- `public/index.html`, `public/app.css`, `public/app.js` -- the static
  frontend: a search form, a card grid, and a click-to-open modal, all
  vanilla JS/CSS with no build step or framework.
