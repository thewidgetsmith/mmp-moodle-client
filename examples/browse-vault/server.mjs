#!/usr/bin/env node
// Live web interface for browsing Moodle course content via
// `mmp-moodle-client`. This is a proof-of-concept demonstrating the
// standard pattern for calling an API that requires a secret token from a
// browser app: a small backend (this file) holds the Moodle token and
// proxies calls to Moodle using the client, while the browser only ever
// talks to this server's own same-origin `/api/*` endpoints.
//
// Run:
//   npm run build   (from the package root, if you haven't already)
//   MOODLE_BASE_URL=https://lms.example.com MOODLE_TOKEN=your_token \
//     node examples/browse-vault/server.mjs
//
// Then open http://localhost:4173 (or whatever PORT you set) in a browser.

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MoodleAccessDeniedError, MoodleApiError, MoodleClient, MoodleRequestError, resources } from "mmp-moodle-client";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(dirname, "public");

const { MOODLE_BASE_URL, MOODLE_TOKEN, PORT } = process.env;

if (!MOODLE_BASE_URL || !MOODLE_TOKEN) {
  console.error(
    "Missing required environment variables. Set MOODLE_BASE_URL and MOODLE_TOKEN before " +
      "running this example, e.g.:\n\n" +
      "  MOODLE_BASE_URL=https://lms.example.com MOODLE_TOKEN=your_token node examples/browse-vault/server.mjs\n",
  );
  process.exit(1);
}

const client = new MoodleClient({ baseUrl: MOODLE_BASE_URL, token: MOODLE_TOKEN });

// Must match the "Course Content Type" custom field option label set on
// "Quick Read" courses in Moodle -- see examples/browse-vault/README.md.
const QUICK_READ_CONTENT_TYPE = "Quick Read";

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

function findCustomField(course, shortname) {
  return course.customfields?.find((field) => field.shortname === shortname)?.value;
}

/**
 * Extracts a Vimeo video id (and, if present, its privacy hash) from a
 * share/watch URL and builds a player embed URL.
 *
 * Unlisted Vimeo videos require their privacy hash to be included when
 * embedding (as the `h` query param) -- without it, the player reports the
 * video as unavailable even if the video's embed-domain setting allows
 * embedding anywhere. The hash appears as a second path segment on the
 * share URL, e.g. `https://vimeo.com/123456789/abcdef1234`.
 *
 * @see https://developer.vimeo.com/api/oembed/videos
 */
function toVimeoEmbedUrl(fileUrl) {
  const match = /vimeo\.com\/(?:video\/)?(\d+)(?:\/([\w-]+))?/i.exec(fileUrl ?? "");
  if (!match) {
    return null;
  }

  const [, id, hash] = match;
  return hash ? `https://player.vimeo.com/video/${id}?h=${hash}` : `https://player.vimeo.com/video/${id}`;
}

/**
 * GET /api/courses?criterianame=tagid|search&criteriavalue=...
 *
 * Proxies `resources.core.course.searchCourses` -- this is the call that
 * powers "browse by interest" (`criterianame: "tagid"`) and "search by
 * title/topic" (`criterianame: "search"`), shaping each course into just
 * the fields a card needs.
 */
async function handleListCourses(url, res) {
  const criterianame = url.searchParams.get("criterianame") ?? "tagid";
  const criteriavalue = url.searchParams.get("criteriavalue");

  if (!criteriavalue) {
    return sendJson(res, 400, { error: "Missing required query param: criteriavalue" });
  }
  if (criterianame !== "tagid" && criterianame !== "search") {
    return sendJson(res, 400, { error: 'criterianame must be "tagid" or "search"' });
  }

  const { total, courses } = await resources.core.course.searchCourses(client, {
    criterianame,
    criteriavalue,
  });

  const cards = courses.map((course) => ({
    id: course.id,
    title: course.fullname,
    summaryHtml: course.summary,
    image: course.courseimage,
    contentType: findCustomField(course, "content_type"),
    duration: findCustomField(course, "content_duration"),
  }));

  sendJson(res, 200, { total, courses: cards });
}

/**
 * GET /api/courses/:id/contents?contentType=Video|Quick+Read
 *
 * Proxies either `resources.core.course.getContents` (for video cards) or
 * `resources.mod.page.getPagesByCourses` (for "Quick Read" article cards),
 * depending on the card's `content_type` custom field. The browser already
 * knows this from the initial `/api/courses` listing, so it's passed
 * through as a query param rather than re-fetched here. Either way, the
 * relevant module/page is found by matching its `name` (`"Video"` /
 * `"Transcript"` / `"Article"`), exactly like the client's own tests do.
 */
async function handleGetCourseContents(courseId, contentType, res) {
  if (contentType === QUICK_READ_CONTENT_TYPE) {
    return handleGetArticleContent(courseId, res);
  }
  return handleGetVideoContent(courseId, res);
}

async function handleGetVideoContent(courseId, res) {
  const sections = await resources.core.course.getContents(client, { courseid: courseId });
  const modules = sections.flatMap((section) => section.modules);

  const video = modules.find((module) => module.name === "Video");
  const transcript = modules.find((module) => module.name === "Transcript");

  sendJson(res, 200, {
    type: "video",
    videoEmbedUrl: toVimeoEmbedUrl(video?.contents?.[0]?.fileurl),
    transcriptUrl: transcript?.contents?.[0]?.fileurl ?? null,
  });
}

async function handleGetArticleContent(courseId, res) {
  const { pages } = await resources.mod.page.getPagesByCourses(client, { courseids: [courseId] });
  const article = pages.find((page) => page.name === "Article");

  sendJson(res, 200, {
    type: "article",
    html: article?.content ?? null,
  });
}

async function serveStaticFile(pathname, res) {
  const relativePath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.join(publicDir, relativePath);

  // Prevent escaping the public/ directory via a crafted pathname.
  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const contents = await readFile(filePath);
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream" });
    res.end(contents);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (url.pathname === "/api/courses" && req.method === "GET") {
      await handleListCourses(url, res);
      return;
    }

    const contentsMatch = /^\/api\/courses\/(\d+)\/contents$/.exec(url.pathname);
    if (contentsMatch && req.method === "GET") {
      const contentType = url.searchParams.get("contentType");
      await handleGetCourseContents(Number(contentsMatch[1]), contentType, res);
      return;
    }

    if (url.pathname.startsWith("/api/")) {
      sendJson(res, 404, { error: "Not found" });
      return;
    }

    await serveStaticFile(url.pathname, res);
  } catch (error) {
    console.error(error);
    if (error instanceof MoodleAccessDeniedError) {
      // The token's external service doesn't allow this specific function --
      // distinct from other API errors, so it gets its own clearer message.
      sendJson(res, 502, {
        error: `This token isn't allowed to call ${error.wsfunction}. Check the token's external service configuration in Moodle.`,
        errorCode: error.errorCode,
      });
    } else if (error instanceof MoodleApiError) {
      // Moodle understood the request but rejected it for some other reason
      // (bad token, resource-specific permission, etc).
      sendJson(res, 502, { error: error.message, errorCode: error.errorCode });
    } else if (error instanceof MoodleRequestError) {
      sendJson(res, 502, { error: error.message });
    } else {
      sendJson(res, 500, { error: "Internal server error" });
    }
  }
});

const port = Number(PORT) || 4173;
server.listen(port, () => {
  console.log(`Vault browsing demo running at http://localhost:${port}`);
  console.log(`Talking live to Moodle at ${MOODLE_BASE_URL}`);
});
