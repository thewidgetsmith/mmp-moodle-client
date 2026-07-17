import { MoodleClient } from "../../../client";
import { getPagesByCourses } from "./get-pages-by-courses";
import type { MoodlePage } from "./get-pages-by-courses";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Shaped like a real mod_page_get_pages_by_courses response for a "quick
// read" card's Article page.
const samplePage: MoodlePage = {
  id: 7,
  coursemodule: 25,
  course: 13,
  name: "Article",
  intro: "",
  introformat: 1,
  content:
    "<h2>Building a Resume</h2><p>Start with your most recent experience.</p>" +
    '<img src="https://lms.mapmypath.co/webservice/pluginfile.php/70/mod_page/content/7/resume-example.png" alt="" />',
  contentformat: 1,
  contentfiles: [
    {
      filename: "resume-example.png",
      fileurl: "https://lms.mapmypath.co/webservice/pluginfile.php/70/mod_page/content/7/resume-example.png",
      filesize: 12345,
      filepath: "/",
      mimetype: "image/png",
      timemodified: 1784162950,
    },
  ],
  legacyfiles: 0,
  legacyfileslast: 0,
  display: 5,
  displayoptions: 'a:2:{s:10:"printintro";i:0;s:12:"printlastmod";i:0;}',
  revision: 1,
  timemodified: 1784162950,
};

describe("getPagesByCourses", () => {
  it("calls mod_page_get_pages_by_courses and returns the parsed pages", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(jsonResponse({ pages: [samplePage], warnings: [] }));
    const client = new MoodleClient({
      baseUrl: "https://lms.mapmypath.co",
      token: "abc123",
      fetch: fetchMock,
    });

    const result = await getPagesByCourses(client, { courseids: [13] });

    expect(result.pages).toEqual([samplePage]);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = init.body as URLSearchParams;
    expect(body.get("wsfunction")).toBe("mod_page_get_pages_by_courses");
    expect(body.get("courseids[0]")).toBe("13");
  });

  it("lets a consumer find the Article page by name, mirroring how getContents matches modules", async () => {
    const otherPage: MoodlePage = { ...samplePage, id: 8, name: "Further Reading" };
    const fetchMock = jest
      .fn()
      .mockResolvedValue(jsonResponse({ pages: [samplePage, otherPage], warnings: [] }));
    const client = new MoodleClient({
      baseUrl: "https://lms.mapmypath.co",
      token: "abc123",
      fetch: fetchMock,
    });

    const { pages } = await getPagesByCourses(client, { courseids: [13] });
    const article = pages.find((page) => page.name === "Article");

    expect(article?.content).toContain("Building a Resume");
  });
});
