import { MoodleClient } from "../../../client";
import { searchCourses } from "./search-courses";
import type { MoodleCoursePublicInfo } from "./course-types";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const sampleCourse: MoodleCoursePublicInfo = {
  id: 11,
  fullname: "Julia's Path To Employment",
  displayname: "Julia's Path To Employment",
  shortname: "Julias Path To Employment",
  courseimage: "https://lms.mapmypath.co/pluginfile.php/60/course/generated/course.svg",
  categoryid: 8,
  categoryname: "Work and Careers",
  summary: "<p>Short Course Summary</p>",
  summaryformat: 1,
  overviewfiles: [],
  showactivitydates: true,
  showcompletionconditions: true,
  contacts: [{ id: 3, fullname: "Richard Macdonald" }],
  enrollmentmethods: ["manual"],
  customfields: [
    {
      name: "Course Content Duration",
      shortname: "content_duration",
      type: "text",
      valueraw: "3 min",
      value: "3 min",
    },
  ],
};

describe("searchCourses", () => {
  it("searches by tag id, flattening params correctly", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(jsonResponse({ total: 1, courses: [sampleCourse], warnings: [] }));
    const client = new MoodleClient({
      baseUrl: "https://lms.mapmypath.co",
      token: "abc123",
      fetch: fetchMock,
    });

    const result = await searchCourses(client, { criterianame: "tagid", criteriavalue: 5 });

    expect(result.total).toBe(1);
    expect(result.courses).toEqual([sampleCourse]);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = init.body as URLSearchParams;
    expect(body.get("wsfunction")).toBe("core_course_search_courses");
    expect(body.get("criterianame")).toBe("tagid");
    expect(body.get("criteriavalue")).toBe("5");
  });

  it("serializes optional params, including boolean flags and capability arrays", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(jsonResponse({ total: 0, courses: [], warnings: [] }));
    const client = new MoodleClient({
      baseUrl: "https://lms.mapmypath.co",
      token: "abc123",
      fetch: fetchMock,
    });

    await searchCourses(client, {
      criterianame: "search",
      criteriavalue: "employment",
      page: 1,
      perpage: 10,
      requiredcapabilities: ["moodle/course:view"],
      limittoenrolled: true,
      onlywithcompletion: false,
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = init.body as URLSearchParams;
    expect(body.get("criterianame")).toBe("search");
    expect(body.get("criteriavalue")).toBe("employment");
    expect(body.get("page")).toBe("1");
    expect(body.get("perpage")).toBe("10");
    expect(body.get("requiredcapabilities[0]")).toBe("moodle/course:view");
    expect(body.get("limittoenrolled")).toBe("1");
    expect(body.get("onlywithcompletion")).toBe("0");
  });
});
