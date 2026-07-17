import type { MoodleClient } from "../../../client";
import type { MoodleWarning } from "../../../types";

export interface GetPagesByCoursesParams {
  /** Course ids to fetch Page activities for. Omit (or pass an empty array) to fetch every course the caller can access. */
  courseids?: number[];
}

export interface MoodlePageFile {
  filename: string;
  fileurl: string;
  filesize: number;
  filepath: string;
  mimetype: string;
  timemodified: number;
}

/**
 * A single `mod_page` (Page) activity instance, as returned by
 * `mod_page_get_pages_by_courses`.
 */
export interface MoodlePage {
  /** The page instance id (not the course module id -- see `coursemodule`). */
  id: number;
  /** The course module id -- what `core_course_get_contents` calls a module's `id`. */
  coursemodule: number;
  course: number;
  name: string;
  intro: string;
  introformat: number;
  introfiles?: MoodlePageFile[];
  section?: number;
  visible?: boolean;
  groupmode?: number;
  groupingid?: number;
  lang?: string;
  /**
   * The page's body content, as rich HTML. Already passed through Moodle's
   * `format_text()`, so any embedded images/files have real, directly
   * fetchable URLs -- no `@@PLUGINFILE@@` placeholders to rewrite yourself.
   */
  content: string;
  contentformat: number;
  /** Files embedded in `content` (e.g. images inserted via the WYSIWYG editor). */
  contentfiles: MoodlePageFile[];
  legacyfiles: number;
  legacyfileslast: number;
  /** How the page is displayed (Moodle's `RESOURCELIB_DISPLAY_*` constants). */
  display: number;
  /** Opaque -- Moodle stores this as a PHP-serialized string, not JSON. */
  displayoptions: string;
  revision: number;
  timemodified: number;
}

export interface GetPagesByCoursesResponse {
  pages: MoodlePage[];
  warnings: MoodleWarning[];
}

/**
 * Calls `mod_page_get_pages_by_courses`, returning every Page activity in
 * the given courses -- this is how a "quick read" article's actual body
 * (rich HTML, WYSIWYG-authored in Moodle, images already resolved to real
 * URLs) is fetched for display in a modal, analogous to how `getContents`
 * is used to fetch a video card's Vimeo link.
 *
 * Like video/transcript modules, a course's Page activity is identified by
 * matching on `name` (e.g. `"Article"`) rather than position, since a
 * course could in principle contain more than one Page.
 *
 * @see https://github.com/moodle/moodle/blob/main/public/mod/page/classes/external.php
 */
export async function getPagesByCourses(
  client: MoodleClient,
  params: GetPagesByCoursesParams = {},
): Promise<GetPagesByCoursesResponse> {
  return client.call<GetPagesByCoursesResponse>("mod_page_get_pages_by_courses", {
    courseids: params.courseids,
  });
}
