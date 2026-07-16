/**
 * Shared types for the `core_course` web service functions. Both
 * `core_course_get_courses_by_field` and `core_course_search_courses` share
 * the bulk of their per-course field set (they're built from the same
 * `get_course_structure()` helper in Moodle's `core_course_external`), so
 * the common fields live here to avoid duplicating them across resource
 * files.
 *
 * @see https://github.com/moodle/moodle/blob/main/public/course/externallib.php
 */

export interface MoodleCourseContact {
  id: number;
  fullname: string;
}

/**
 * A course custom field value (Site administration > Courses > Custom
 * fields). `valueraw` is the underlying stored value (e.g. the numeric
 * option id for a `select` field), while `value` is the human-readable
 * display value.
 */
export interface MoodleCourseCustomField {
  name: string;
  shortname: string;
  type: string;
  valueraw: string | number;
  value: string;
}

export interface MoodleCourseFile {
  filename: string;
  fileurl: string;
  filesize: number;
  filepath: string;
  mimetype: string;
  timemodified: number;
}

export interface MoodleCourseFilter {
  filter: string;
  localstate: number;
  inheritedstate: number;
}

export interface MoodleCourseFormatOption {
  name: string;
  value: string;
}

/**
 * Fields returned for every course by both `core_course_get_courses_by_field`
 * and `core_course_search_courses` -- i.e. the "public" course info that's
 * safe to show to any caller who can see the course.
 *
 * Note: Moodle does **not** include a course's tags in this structure (or
 * the extended {@link MoodleCourseInfo} below). Tags can be used as a
 * *filter* (see `searchCourses`'s `tagid` criteria) but aren't echoed back
 * on the course itself by any `core_course` function.
 */
export interface MoodleCoursePublicInfo {
  id: number;
  fullname: string;
  displayname: string;
  shortname: string;
  /** URL of the course's image, or an auto-generated placeholder pattern if none was uploaded. */
  courseimage?: string;
  categoryid: number;
  categoryname: string;
  sortorder?: number;
  summary: string;
  summaryformat: number;
  summaryfiles?: MoodleCourseFile[];
  overviewfiles: MoodleCourseFile[];
  showactivitydates: boolean;
  showcompletionconditions: boolean;
  contacts: MoodleCourseContact[];
  enrollmentmethods: string[];
  customfields?: MoodleCourseCustomField[];
}

/**
 * Extended course fields only returned by `core_course_get_courses_by_field`
 * (on top of everything in {@link MoodleCoursePublicInfo}). Several of these
 * are only populated when the calling user/token has `moodle/course:update`
 * capability in the course.
 */
export interface MoodleCourseInfo extends MoodleCoursePublicInfo {
  idnumber?: string;
  format?: string;
  showgrades?: number;
  newsitems?: number;
  startdate?: number;
  enddate?: number;
  maxbytes?: number;
  showreports?: number;
  visible?: number;
  groupmode?: number;
  groupmodeforce?: number;
  defaultgroupingid?: number;
  enablecompletion?: number;
  completionnotify?: number;
  lang?: string;
  theme?: string;
  marker?: number;
  legacyfiles?: number;
  calendartype?: string;
  timecreated?: number;
  timemodified?: number;
  requested?: number;
  cacherev?: number;
  filters?: MoodleCourseFilter[];
  courseformatoptions?: MoodleCourseFormatOption[];
  communicationroomname?: string;
  communicationroomurl?: string;
}
