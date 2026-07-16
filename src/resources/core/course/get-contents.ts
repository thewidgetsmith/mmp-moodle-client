import type { MoodleClient } from "../../../client";
import type { MoodleParamValue } from "../../../params";

/** Name of an option accepted by `core_course_get_contents`. */
export type GetContentsOptionName =
  | "excludemodules"
  | "excludecontents"
  | "includestealthmodules"
  | "sectionid"
  | "sectionnumber"
  | "cmid"
  | "modname"
  | "modid";

export interface GetContentsOption {
  name: GetContentsOptionName;
  value: string | number | boolean;
}

export interface GetContentsParams {
  courseid: number;
  /**
   * Filters for the returned sections/modules, e.g.
   * `[{ name: "sectionnumber", value: 0 }]` to return only one section, or
   * `[{ name: "excludecontents", value: true }]` to omit module file/URL
   * contents. See {@link GetContentsOptionName} for all supported names.
   */
  options?: GetContentsOption[];
}

export interface MoodleCourseModuleDate {
  label: string;
  timestamp: number;
  relativeto?: number;
  dataid?: string;
}

export interface MoodleCourseModuleContent {
  /** e.g. `"file"`, `"url"`, or `"content"`. */
  type: string;
  filename: string;
  /**
   * Moodle's formal schema marks this (and `timecreated`/`sortorder`/
   * `userid`/`author`/`license` below) as required and non-null, but real
   * responses return `null` for `url`-type module content (e.g. a
   * `mod_url` activity holding an external link) -- typed as nullable here
   * to match observed behavior rather than the documented schema.
   */
  filepath: string | null;
  filesize: number;
  /** The file/URL's address. Present for `file`/`url` type content. */
  fileurl?: string;
  /** Raw content, used when `type` is `"content"`. */
  content?: string;
  timecreated: number | null;
  timemodified: number;
  sortorder: number | null;
  mimetype?: string;
  isexternalfile?: boolean;
  repositorytype?: string;
  userid: number | null;
  author: string | null;
  license: string | null;
}

export interface MoodleCourseModuleContentsInfo {
  filescount: number;
  filessize: number;
  lastmodified: number;
  mimetypes: string[];
  repositorytype?: string;
}

export interface MoodleCourseModule {
  id: number;
  /** View URL for the module. Absent for modules with no view page (e.g. labels). */
  url?: string;
  name: string;
  instance?: number;
  contextid?: number;
  /** Formatted HTML description, only present when the module shows its description on the course page. */
  description?: string;
  visible?: number;
  uservisible?: boolean;
  availabilityinfo?: string;
  visibleoncoursepage?: number;
  modicon: string;
  /** The activity module type, e.g. `"url"`, `"resource"`, `"scorm"`, `"forum"`. */
  modname: string;
  /** The module's declared purpose, e.g. `"content"`, `"collaboration"`. */
  purpose: string;
  branded?: boolean;
  modplural: string;
  availability?: string;
  indent: number;
  onclick?: string;
  afterlink?: string;
  /** Not fully typed -- shape varies by module and isn't needed for content-browsing use cases. */
  activitybadge?: unknown;
  /** JSON-encoded custom data, module-type-specific. */
  customdata?: string;
  noviewlink?: boolean;
  candisplay?: boolean;
  /** Completion tracking type: `0` none, `1` manual, `2` automatic. */
  completion?: number;
  /** Not fully typed -- only present when completion tracking is enabled for this module. */
  completiondata?: unknown;
  downloadcontent?: number;
  dates: MoodleCourseModuleDate[];
  groupmode?: number;
  /**
   * The module's files/URLs. Absent entirely (not just empty) for module
   * types without a content-export callback, e.g. forums.
   */
  contents?: MoodleCourseModuleContent[];
  contentsinfo?: MoodleCourseModuleContentsInfo;
}

export interface MoodleCourseSection {
  id: number;
  name: string;
  visible?: number;
  summary: string;
  summaryformat: number;
  section?: number;
  hiddenbynumsections?: number;
  uservisible?: boolean;
  availabilityinfo?: string;
  component?: string;
  itemid?: number;
  modules: MoodleCourseModule[];
}

/**
 * Calls `core_course_get_contents`, returning the sections and
 * activities/modules that make up a course. This is how the actual card
 * content (e.g. a `url` module holding a Vimeo link, or a transcript link)
 * is fetched for display in a modal.
 *
 * Modules are identified by matching on `name` (e.g. `"Video"`,
 * `"Transcript"`) rather than `modname`/order, since a course may use the
 * same module type (e.g. `url`) for more than one piece of content.
 *
 * @see https://github.com/moodle/moodle/blob/main/public/course/externallib.php
 */
export async function getContents(
  client: MoodleClient,
  params: GetContentsParams,
): Promise<MoodleCourseSection[]> {
  return client.call<MoodleCourseSection[]>("core_course_get_contents", {
    courseid: params.courseid,
    // `GetContentsOption` doesn't structurally satisfy `MoodleParamValue`'s
    // index signature (named interfaces don't unless declared with one),
    // even though its `name`/`value` fields are all valid param values.
    options: params.options as ReadonlyArray<Record<string, MoodleParamValue>> | undefined,
  });
}
