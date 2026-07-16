/**
 * Namespaced resource functions, mirroring Moodle's own
 * `component_subsystem_functionname` web service naming convention, e.g.
 * `core_webservice_get_site_info` lives at `resources.core.webservice.getSiteInfo`.
 *
 * Each resource function takes a {@link MoodleClient} plus a typed params
 * object, and returns a typed response -- see `src/resources/core/webservice/getSiteInfo.ts`
 * for a reference implementation to follow when adding new functions.
 */
export * as core from "./core";
