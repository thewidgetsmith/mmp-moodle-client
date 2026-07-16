# MMP Moodle Client

A TypeScript client library for the [Moodle](https://moodle.org/) LMS Web
Services API. It wraps Moodle's "REST" protocol
(`/webservice/rest/server.php`) with a small, typed HTTP client plus a
growing set of typed **resource functions** -- one per Moodle web service
function (e.g. `core_course_get_courses`, `core_user_get_users`).

Built on the native `fetch` API, so it works in Node.js 18+ without any
runtime dependencies.

## Purpose & scope

This library backs a custom frontend for Moodle LMS. In that system, Moodle
is used purely as a content management system: administrators author
content (as courses, and the sections/modules/activities within them)
through Moodle's own web UI, and the custom frontend reads that content
back out via Moodle's web services API for display elsewhere.

As a result, **this client currently only needs to implement read
operations for course content** (e.g. `core_course_get_courses`,
`core_course_get_contents`, and similar `_get_*` functions). There is no
current plan to implement write/mutating operations (creating or updating
courses, activities, grades, enrollments, etc.). Keep this in mind when
prioritizing which cURL commands/functions to convert into resource
functions next -- favor read-oriented course content functions unless
explicitly told otherwise.

## Installation

```sh
npm install mmp-moodle-client
```

## Usage

```ts
import { MoodleClient, resources } from "mmp-moodle-client";

const client = new MoodleClient({
  baseUrl: "https://moodle.example.com",
  token: process.env.MOODLE_TOKEN!,
});

// Typed resource function -- prefer these where available.
const siteInfo = await resources.core.webservice.getSiteInfo(client);
console.log(siteInfo.sitename);

// Low-level escape hatch for functions that don't have a resource wrapper
// yet, or for one-off/exploratory calls.
const rawResult = await client.call("core_course_get_courses", {
  options: { ids: [2, 3] },
});
```

### Error handling

```ts
import { MoodleApiError, MoodleRequestError } from "mmp-moodle-client";

try {
  await resources.core.webservice.getSiteInfo(client);
} catch (error) {
  if (error instanceof MoodleApiError) {
    // Moodle understood the request but rejected it, e.g. invalid token
    // or missing capability. `errorCode` is Moodle's machine-readable
    // errorcode (e.g. "invalidtoken").
    console.error(error.errorCode, error.message);
  } else if (error instanceof MoodleRequestError) {
    // The request itself failed: network error, or an HTTP response that
    // wasn't 2xx and wasn't a well-formed Moodle exception payload.
    console.error(error.status, error.message);
  } else {
    throw error;
  }
}
```

## How it's organized

```
src/
  client.ts        MoodleClient - the low-level HTTP client
  params.ts        buildMoodleParams() - flattens nested params into Moodle's
                    bracket notation (e.g. options[ids][0]=2)
  errors.ts        MoodleApiError / MoodleRequestError
  types.ts         Shared config types
  resources/       Typed wrapper functions, one per Moodle web service
                    function, namespaced to mirror Moodle's own
                    component_subsystem_functionname convention (file names
                    are kebab-case):
    core/
      course/
        get-contents.ts        -> core_course_get_contents
        get-courses-by-field.ts -> core_course_get_courses_by_field
        search-courses.ts       -> core_course_search_courses
      webservice/
        get-site-info.ts -> core_webservice_get_site_info
```

`MoodleClient#call` is the single primitive every resource function is
built on. It:

1. Flattens the params you pass into Moodle's PHP-style bracket-notation
   body format via `buildMoodleParams` (e.g. `{ options: { ids: [2, 3] } }`
   becomes `options[ids][0]=2&options[ids][1]=3`).
2. Adds `wstoken`, `wsfunction`, and `moodlewsrestformat` to the request body.
3. POSTs the request to `{baseUrl}/webservice/rest/server.php`.
4. Parses the JSON response and throws `MoodleApiError` if Moodle returned
   a well-formed exception payload, or `MoodleRequestError` if the request
   failed outright or returned an unexpected non-2xx HTTP status.

## Adding a new resource function

See `mmp-moodle-client/AGENTS.md` for detailed guidance (including where to
find authoritative parameter/response definitions, since Moodle's public
web services documentation is sparse/out of date). In short, each Moodle
web service function gets its own file under
`src/resources/<component>/<subsystem>/<kebab-case-function-name>.ts`, using
`src/resources/core/webservice/get-site-info.ts` as a template, plus a
colocated `*.test.ts` file that mocks `fetch` and asserts on the request
shape and response parsing. New resource files are re-exported from the
nearest `index.ts` barrel so they show up under the `resources` namespace.

## Examples

`examples/browse-vault` is a live proof-of-concept web app showing how a
consuming codebase uses this package end-to-end: a small backend server
holds the Moodle token and proxies calls through the client, while a plain
HTML/CSS/JS browser frontend calls that server's own same-origin API to
browse courses by interest tag or search text, and open a card's video +
transcript in a modal. Requires a real Moodle instance and token -- see
`examples/browse-vault/README.md`.

## Scripts

| Command                | Description                                          |
| ----------------------- | ----------------------------------------------------- |
| `npm run build`         | Bundles `src/index.ts` to `dist/` (CJS + ESM + `.d.ts`) via `tsup` |
| `npm test`              | Runs the Jest test suite                              |
| `npm run test:watch`    | Runs Jest in watch mode                               |
| `npm run test:coverage` | Runs Jest with a coverage report                      |
| `npm run lint`          | Lints `src/` with ESLint                              |
| `npm run typecheck`     | Type-checks the project without emitting output       |

## References

Moodle's official web services documentation is thin and frequently out of
date, so this library leans on Moodle's own source code as the source of
truth:

- [moodle/moodle](https://github.com/moodle/moodle) -- the Moodle LMS
  source. Each web service function is defined by an `external_api`
  subclass with `execute_parameters()`/`execute_returns()` methods that are
  the authoritative parameter/response schema.
- [moodlehq/moodleapp](https://github.com/moodlehq/moodleapp) -- the
  official Moodle mobile app, written in TypeScript, which consumes this
  same web services API extensively. It's a great secondary reference for
  real-world request/response shapes and for TypeScript-flavored
  interpretations of Moodle's PHP types.
