import { MoodleClient } from "../../../client";
import { getSiteInfo } from "./get-site-info";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("getSiteInfo", () => {
  it("calls core_webservice_get_site_info and returns the parsed site info", async () => {
    const siteInfoPayload = {
      sitename: "My Moodle Site",
      username: "admin",
      firstname: "Admin",
      lastname: "User",
      fullname: "Admin User",
      lang: "en",
      userid: 2,
      siteurl: "https://moodle.example.com",
      userpictureurl: "https://moodle.example.com/pic.jpg",
      functions: [{ name: "core_webservice_get_site_info", version: "3.9" }],
      downloadfiles: 1 as const,
      uploadfiles: 1 as const,
    };
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse(siteInfoPayload));
    const client = new MoodleClient({
      baseUrl: "https://moodle.example.com",
      token: "abc123",
      fetch: fetchMock,
    });

    const result = await getSiteInfo(client);

    expect(result).toEqual(siteInfoPayload);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = init.body as URLSearchParams;
    expect(body.get("wsfunction")).toBe("core_webservice_get_site_info");
  });

  it("passes serviceshortnames through as a flattened array param", async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse({ functions: [] }));
    const client = new MoodleClient({
      baseUrl: "https://moodle.example.com",
      token: "abc123",
      fetch: fetchMock,
    });

    await getSiteInfo(client, { serviceshortnames: ["mobile_app", "custom_service"] });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = init.body as URLSearchParams;
    expect(body.get("serviceshortnames[0]")).toBe("mobile_app");
    expect(body.get("serviceshortnames[1]")).toBe("custom_service");
  });
});
