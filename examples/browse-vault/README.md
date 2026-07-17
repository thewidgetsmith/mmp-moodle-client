# Example: browse the Vault (live)

A proof-of-concept demonstrating how a real web app would use
`mmp-moodle-client`: a small backend server holds the Moodle web service
token and proxies calls to Moodle via the client, while a plain
HTML/CSS/JS browser frontend talks only to that server's own same-origin
`/api/*` endpoints -- the token never reaches the browser, which is the
standard pattern for any third-party API that requires a secret credential.

It implements the scenario described in `AGENTS.md`, for both of the
content types currently supported:

1. Browse cards by interest tag (`criterianame: "tagid"`) or by free-text
   title/topic search (`criterianame: "search"`), both via
   `resources.core.course.searchCourses`. This works identically regardless
   of a card's content type, since search/browse operates at the course
   level.
2. Click a card to open a modal. What gets fetched depends on the card's
   `content_type` custom field:
   - **Video** cards: `resources.core.course.getContents`, matching the
     `"Video"`/`"Transcript"` modules by name, embedding the Vimeo link and
     linking the transcript.
   - **Quick Read** (article) cards: `resources.mod.page.getPagesByCourses`,
     matching the `"Article"` Page activity by name, rendering its
     WYSIWYG-authored HTML body (with embedded images already resolved to
     real URLs by Moodle) directly in the modal.

## Setting up a "Quick Read" course in Moodle

Same course-per-card structure as a video card, with a Page activity
instead of a URL activity:

1. Create a course in the appropriate pillar category. Fullname = article
   title, summary = short card description, course image = thumbnail.
2. Set the `Course Content Type` custom field to **"Quick Read"** (add it as
   a new option on that select field under Site administration > Courses >
   Custom fields, if you haven't already) and `Course Content Duration` to
   an estimated read time, e.g. `"5 min read"`.
3. Add the relevant interest tag(s).
4. Add an activity > **Page**, and name it exactly **"Article"**.
5. Write the body in the Page activity's "Page content" field using
   Moodle's WYSIWYG editor -- insert images via the editor's image button.
   No HTML authoring required.
6. Set the course visible when ready to publish.

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
  dependencies) exposing endpoints backed by the real client:
  - `GET /api/courses?criterianame=tagid|search&criteriavalue=...` -- proxies
    `searchCourses`, shaped down to just the fields a card needs.
  - `GET /api/courses/:id/contents?contentType=Video|Quick Read` -- proxies
    either `getContents` (video) or `getPagesByCourses` (quick reads),
    depending on the card's content type.
- `public/index.html`, `public/app.css`, `public/app.js` -- the static
  frontend: a search form, a card grid, and a click-to-open modal that
  renders either a video player + transcript link or an article body, all
  vanilla JS/CSS with no build step or framework.
