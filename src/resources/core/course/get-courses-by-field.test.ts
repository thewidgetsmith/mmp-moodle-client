import { MoodleClient } from "../../../client";
import { getCoursesByField } from "./get-courses-by-field";
import type { MoodleCourseInfo } from "./course-types";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Trimmed version of a real core_course_get_courses_by_field response.
const sampleCourse: MoodleCourseInfo = {
  id: 11,
  fullname: "Julia's Path To Employment",
  displayname: "Julia's Path To Employment",
  shortname: "Julias Path To Employment",
  courseimage: "https://lms.mapmypath.co/pluginfile.php/60/course/generated/course.svg",
  categoryid: 8,
  categoryname: "Work and Careers",
  sortorder: 60002,
  summary: "<p>Short Course Summary</p>",
  summaryformat: 1,
  summaryfiles: [],
  overviewfiles: [],
  showactivitydates: true,
  showcompletionconditions: true,
  contacts: [{ id: 3, fullname: "Richard Macdonald" }],
  enrollmentmethods: ["manual"],
  customfields: [
    {
      name: "Course Content Type",
      shortname: "content_type",
      type: "select",
      valueraw: 3,
      value: "Video",
    },
    {
      name: "Course Content Duration",
      shortname: "content_duration",
      type: "text",
      valueraw: "3 min",
      value: "3 min",
    },
  ],
  format: "topics",
  visible: 1,
};

describe("getCoursesByField", () => {
  it("calls core_course_get_courses_by_field with the given field/value", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(jsonResponse({ courses: [sampleCourse], warnings: [] }));
    const client = new MoodleClient({
      baseUrl: "https://lms.mapmypath.co",
      token: "abc123",
      fetch: fetchMock,
    });

    const result = await getCoursesByField(client, { field: "category", value: 8 });

    expect(result.courses).toEqual([sampleCourse]);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = init.body as URLSearchParams;
    expect(body.get("wsfunction")).toBe("core_course_get_courses_by_field");
    expect(body.get("field")).toBe("category");
    expect(body.get("value")).toBe("8");
  });

  it("omits field/value when not provided, to fetch every course", async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse({ courses: [], warnings: [] }));
    const client = new MoodleClient({
      baseUrl: "https://lms.mapmypath.co",
      token: "abc123",
      fetch: fetchMock,
    });

    await getCoursesByField(client);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = init.body as URLSearchParams;
    expect(body.has("field")).toBe(false);
    expect(body.has("value")).toBe(false);
  });
});
