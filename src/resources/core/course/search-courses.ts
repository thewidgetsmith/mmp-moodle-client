import type { MoodleClient } from "../../../client";
import type { MoodleWarning } from "../../../types";
import type { MoodleCoursePublicInfo } from "./course-types";

/**
 * Criteria Moodle allows searching courses by. `modulelist`/`blocklist`
 * additionally require site-config capability and aren't relevant to this
 * client's read-only content-browsing use case. `tagid` is the mechanism
 * used to browse content by interest/topic, since Moodle courses support
 * many-to-many tagging (unlike categories, which only allow one parent per
 * course).
 */
export type SearchCoursesCriteriaName = "search" | "modulelist" | "blocklist" | "tagid";

export interface SearchCoursesParams {
  /** Which criteria to search by -- see {@link SearchCoursesCriteriaName}. */
  criterianame: SearchCoursesCriteriaName;
  /**
   * The value to match. For `criterianame: "search"` this is a free-text
   * query (matched against course fullname/summary); for `"tagid"` this is
   * the numeric id of the tag to filter by.
   */
  criteriavalue: string | number;
  /** 0-based page number, used with `perpage`. Defaults to `0`. */
  page?: number;
  /** Results per page. `0` (the default) returns every matching course. */
  perpage?: number;
  /** Only return courses where the caller holds all of these capabilities. */
  requiredcapabilities?: string[];
  /** Only return courses the caller is enrolled in. Defaults to `false`. */
  limittoenrolled?: boolean;
  /** Only return courses that have completion tracking enabled. Defaults to `false`. */
  onlywithcompletion?: boolean;
}

export interface SearchCoursesResponse {
  /** Total number of matching courses (independent of pagination). */
  total: number;
  courses: MoodleCoursePublicInfo[];
  warnings: MoodleWarning[];
}

/**
 * Calls `core_course_search_courses`. This is the function to use for both
 * free-text search (`criterianame: "search"`) and browsing courses tagged
 * with a particular interest/topic (`criterianame: "tagid"`) --
 * `core_course_get_courses_by_field` cannot filter by tag.
 *
 * Note: like `core_course_get_courses_by_field`, the returned courses do not
 * include their own tags, even when searching by `tagid`.
 *
 * @see https://github.com/moodle/moodle/blob/main/public/course/externallib.php
 */
export async function searchCourses(
  client: MoodleClient,
  params: SearchCoursesParams,
): Promise<SearchCoursesResponse> {
  return client.call<SearchCoursesResponse>("core_course_search_courses", {
    criterianame: params.criterianame,
    criteriavalue: params.criteriavalue,
    page: params.page,
    perpage: params.perpage,
    requiredcapabilities: params.requiredcapabilities,
    limittoenrolled: params.limittoenrolled,
    onlywithcompletion: params.onlywithcompletion,
  });
}
