import { MoodleClient } from "../../../client";
import { getContents } from "./get-contents";
import type { MoodleCourseSection } from "./get-contents";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Trimmed version of a real core_course_get_contents response.
const sampleSections: MoodleCourseSection[] = [
  {
    id: 52,
    name: "General",
    visible: 1,
    summary: "",
    summaryformat: 1,
    section: 0,
    hiddenbynumsections: 0,
    uservisible: true,
    modules: [
      {
        id: 20,
        url: "https://lms.mapmypath.co/mod/url/view.php?id=20",
        name: "Video",
        instance: 1,
        contextid: 62,
        visible: 1,
        uservisible: true,
        visibleoncoursepage: 1,
        modicon: "https://lms.mapmypath.co/theme/image.php/boost/url/1782767868/monologo?filtericon=1",
        modname: "url",
        purpose: "content",
        branded: false,
        modplural: "URLs",
        indent: 0,
        dates: [],
        contents: [
          {
            type: "url",
            filename: "Video",
            filepath: null,
            filesize: 0,
            fileurl: "https://vimeo.com/1208215275?share=copy&fl=sv&fe=ci",
            timecreated: null,
            timemodified: 1784156776,
            sortorder: null,
            userid: null,
            author: null,
            license: null,
          },
        ],
        contentsinfo: {
          filescount: 1,
          filessize: 0,
          lastmodified: 1784156776,
          mimetypes: [],
        },
      },
      {
        id: 21,
        url: "https://lms.mapmypath.co/mod/url/view.php?id=21",
        name: "Transcript",
        instance: 2,
        contextid: 63,
        visible: 1,
        uservisible: true,
        visibleoncoursepage: 1,
        modicon: "https://lms.mapmypath.co/theme/image.php/boost/url/1782767868/monologo?filtericon=1",
        modname: "url",
        purpose: "content",
        branded: false,
        modplural: "URLs",
        indent: 0,
        dates: [],
        contents: [
          {
            type: "url",
            filename: "Transcript",
            filepath: null,
            filesize: 0,
            fileurl: "https://example.com/transcript",
            timecreated: null,
            timemodified: 1784156892,
            sortorder: null,
            userid: null,
            author: null,
            license: null,
          },
        ],
        contentsinfo: {
          filescount: 1,
          filessize: 0,
          lastmodified: 1784156892,
          mimetypes: [],
        },
      },
      {
        id: 22,
        url: "https://lms.mapmypath.co/mod/forum/view.php?id=22",
        name: "Announcements",
        instance: 10,
        contextid: 67,
        visible: 1,
        uservisible: true,
        visibleoncoursepage: 1,
        modicon: "https://lms.mapmypath.co/theme/image.php/boost/forum/1782767868/monologo?filtericon=1",
        modname: "forum",
        purpose: "collaboration",
        branded: false,
        modplural: "Forums",
        indent: 0,
        dates: [],
      },
    ],
  },
];

describe("getContents", () => {
  it("calls core_course_get_contents and returns sections/modules", async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse(sampleSections));
    const client = new MoodleClient({
      baseUrl: "https://lms.mapmypath.co",
      token: "abc123",
      fetch: fetchMock,
    });

    const sections = await getContents(client, { courseid: 11 });

    expect(sections).toEqual(sampleSections);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = init.body as URLSearchParams;
    expect(body.get("wsfunction")).toBe("core_course_get_contents");
    expect(body.get("courseid")).toBe("11");
  });

  it("lets the modal find the Video and Transcript modules by name", async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse(sampleSections));
    const client = new MoodleClient({
      baseUrl: "https://lms.mapmypath.co",
      token: "abc123",
      fetch: fetchMock,
    });

    const sections = await getContents(client, { courseid: 11 });
    const modules = sections.flatMap((section) => section.modules);

    const video = modules.find((module) => module.name === "Video");
    const transcript = modules.find((module) => module.name === "Transcript");

    expect(video?.contents?.[0]?.fileurl).toBe("https://vimeo.com/1208215275?share=copy&fl=sv&fe=ci");
    expect(transcript?.contents?.[0]?.fileurl).toBe("https://example.com/transcript");
  });

  it("flattens filter options into the request body", async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse(sampleSections));
    const client = new MoodleClient({
      baseUrl: "https://lms.mapmypath.co",
      token: "abc123",
      fetch: fetchMock,
    });

    await getContents(client, {
      courseid: 11,
      options: [{ name: "excludecontents", value: false }],
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = init.body as URLSearchParams;
    expect(body.get("options[0][name]")).toBe("excludecontents");
    expect(body.get("options[0][value]")).toBe("0");
  });
});
