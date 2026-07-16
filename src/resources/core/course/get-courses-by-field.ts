import type { MoodleClient } from "../../../client";
import type { MoodleWarning } from "../../../types";
import type { MoodleCourseInfo } from "./course-types";

/**
 * Field to match courses against. Notably, this does **not** support
 * matching by tag -- use `searchCourses` with `criterianame: "tagid"` for
 * that.
 */
export type GetCoursesByFieldField =
  | ""
  | "id"
  | "ids"
  | "shortname"
  | "idnumber"
  | "category"
  | "sectionid";

export interface GetCoursesByFieldParams {
  /** Field to search on. Leave both params unset to return every course. */
  field?: GetCoursesByFieldField;
  /**
   * Value to match. For `field: "ids"`, pass a comma-separated string of
   * course ids (e.g. `"11,12"`).
   */
  value?: string | number;
}

export interface GetCoursesByFieldResponse {
  courses: MoodleCourseInfo[];
  warnings: MoodleWarning[];
}

/**
 * Calls `core_course_get_courses_by_field`, returning the courses matching
 * the given field/value pair -- e.g. `{ field: "category", value: 8 }` to
 * list every course directly inside a category, or `{ field: "id", value: 11 }`
 * to fetch a single course by id.
 *
 * @see https://github.com/moodle/moodle/blob/main/public/course/externallib.php
 */
export async function getCoursesByField(
  client: MoodleClient,
  params: GetCoursesByFieldParams = {},
): Promise<GetCoursesByFieldResponse> {
  return client.call<GetCoursesByFieldResponse>("core_course_get_courses_by_field", {
    field: params.field,
    value: params.value,
  });
}
