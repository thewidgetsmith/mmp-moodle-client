# Agent instructions: mmp-moodle-client

This package is a TypeScript client for the Moodle LMS Web Services API
("REST" protocol, `/webservice/rest/server.php`). It provides a thin,
generic HTTP client (`MoodleClient`) plus a growing set of typed
**resource functions**, one per Moodle web service function, organized
under `src/resources/<component>/<subsystem>/<kebab-case-function-name>.ts`
to mirror Moodle's own `component_subsystem_functionname` naming convention
(e.g. `core_webservice_get_site_info` -> `src/resources/core/webservice/get-site-info.ts`,
exported as `resources.core.webservice.getSiteInfo`). File names are
kebab-case; the exported function/type names inside them are camelCase/PascalCase
as usual.

Read `README.md` first for the user-facing overview of the package layout
and usage. This file covers conventions and workflow for extending it.

## Purpose & scope

This client is being built to back a custom frontend for Moodle LMS. In
that system, Moodle is used purely as a content management system:
administrators author content (courses, and the sections/modules/
activities within them) through Moodle's own web UI, and the custom
frontend queries that content back out via this client.

**Only read operations for course content are currently in scope.**
There is no current plan to implement write/mutating web service functions
(creating or updating courses, activities, grades, enrollments, user
accounts, etc.). Concretely:

- When converting cURL commands or prioritizing which Moodle functions to
  wrap next, favor `_get_*`-style read functions related to courses and
  their content (courses, categories, sections, modules/activities, and
  content needed to render them) over write/mutating functions.
- If a user-supplied cURL command targets a write operation (e.g.
  `core_course_create_courses`, `core_course_edit_module`, anything
  `_update_`/`_delete_`/`_add_`/`_create_`), flag that it's outside the
  current scope and confirm with the user before implementing it, rather
  than assuming it should be added.
- This is a scoping preference, not a hard technical constraint -- nothing
  in `MoodleClient` or `buildMoodleParams` is read-only-specific, so scope
  can expand later if requirements change.

## Where to find authoritative API definitions

Moodle's public web services documentation (docs.moodle.org /
moodledev.io) is sparse, inconsistent, and often out of date. **Do not
rely on it as the primary source.** Instead, use Moodle's own source code:

1. **[moodle/moodle](https://github.com/moodle/moodle)** -- the Moodle LMS
   source. This is the ground truth.
   - Web service functions are registered in `db/services.php` files
     (one per component/plugin, e.g. `course/db/services.php`,
     `user/db/services.php`, plus core ones in `lib/db/services.php`).
     Search for the `wsfunction` name (e.g. `core_course_get_courses`) in
     these files to find the `classname` and `methodname` that implement it.
   - The implementing class extends `external_api` and defines two static
     methods that are the authoritative schema:
     - `execute_parameters()` returns an `external_function_parameters`
       describing every input parameter (via `external_value`,
       `external_single_structure`, `external_multiple_structure`, each
       tagged with a `PARAM_*` type constant such as `PARAM_INT`,
       `PARAM_TEXT`, `PARAM_BOOL`, `PARAM_ALPHANUMEXT`, etc, and whether
       it's `VALUE_REQUIRED`, `VALUE_OPTIONAL`, or `VALUE_DEFAULT`).
     - `execute_returns()` describes the response shape the same way.
   - These classes commonly live in `<component>/classes/external/<function_name>.php`
     (modern style) or `<component>/externallib.php` (legacy style, one
     big class with many `execute_*` methods, one set per function).
   - `PARAM_BOOL` values are what Moodle expects for booleans; this client
     serializes JS `true`/`false` as `"1"`/`"0"` to match
     (`src/params.ts`), which lines up with that convention.

2. **[moodlehq/moodleapp](https://github.com/moodlehq/moodleapp)** -- the
   official Moodle mobile app, written in TypeScript/Angular, and a heavy
   consumer of this same web services API. Use it as a secondary
   reference:
   - Grep the repo for the `wsfunction` string (e.g.
     `"core_course_get_courses"`) to find the call site, usually via
     `CoreSite.read()`/`CoreSite.write()` or a `WSProvider`-style method.
   - These call sites are typically colocated with TypeScript interfaces
     describing the params and response (often named like
     `CoreCourseGetCoursesWSParams` / `CoreCourseGetCoursesWSResponse`),
     which is useful both to cross-check the PHP definition and to see how
     a real-world TypeScript consumer models the same data (including
     which fields are treated as effectively always-present vs truly
     optional in practice).
   - Where the two sources disagree, trust the PHP `external_api` class in
     moodle/moodle -- it's the actual contract the server enforces --
     but note discrepancies in a code comment if they're likely to trip
     up consumers (e.g. a field documented as required that Moodle
     actually omits in older versions).

When converting a cURL command supplied by the user, match its
`wsfunction` parameter to the steps above rather than guessing shapes from
the sample response alone -- sample payloads are frequently missing
optional/null fields or fields gated behind capabilities.

## Conventions for adding a new resource function

Follow the pattern in `src/resources/core/webservice/get-site-info.ts`:

1. Create `src/resources/<component>/<subsystem>/<kebab-case-function-name>.ts`
   (kebab-case filename matching the exported function name, e.g.
   `getCoursesByField` -> `get-courses-by-field.ts`; the Moodle `wsfunction`
   string itself stays `snake_case` and is only referenced inside the
   function body).
2. Define a `<FunctionName>Params` interface for the input parameters.
   Only the params a caller supplies go here -- `wstoken`, `wsfunction`,
   and `moodlewsrestformat` are handled by `MoodleClient` and must not
   appear in resource-level types.
3. Define response type(s) (e.g. `Moodle<Noun>` interfaces). Mark fields
   optional if Moodle's `execute_returns()` marks them `VALUE_OPTIONAL`, if
   older supported Moodle versions omit them, or if they're only present
   for certain user roles/capabilities.
4. Export an `async function(client: MoodleClient, params: ... = {})` that
   calls `client.call<ResponseType>("moodle_wsfunction_name", { ...mapped params })`.
   Pass values through as plain nested objects/arrays -- `buildMoodleParams`
   (used internally by `MoodleClient#call`) handles flattening to Moodle's
   bracket notation, and `undefined`/`null` values are dropped automatically.
5. Add a JSDoc block on the exported function with a one-line summary and
   a link to the moodle/moodle source file backing it (a permalink to the
   `external_api` class or `db/services.php` entry is ideal).
6. Add the new file to the nearest `index.ts` barrel (e.g.
   `src/resources/<component>/<subsystem>/index.ts`) with
   `export * from "./kebab-case-function-name";`. Add new `<subsystem>/index.ts` or
   `<component>/index.ts` barrels (`export * as <name> from "./<name>";`)
   when introducing a new subsystem or component.
7. Add a colocated `<kebab-case-function-name>.test.ts` that constructs a
   `MoodleClient` with a mocked `fetch` (see existing tests for the
   pattern), and asserts both:
   - the outgoing request contains the expected `wsfunction` and
     correctly flattened params, and
   - the resource function returns/parses the mocked response correctly.

## Validating changes

Run these before considering a change complete:

```sh
npm run typecheck
npm test
npm run lint
npm run build
```

`npm run build` also rolls up `.d.ts` output via `tsup`; if you add a new
top-level barrel (e.g. a new component under `src/resources`), make sure
it's re-exported from `src/resources/index.ts` so it's reachable from the
package's public `resources` namespace.
