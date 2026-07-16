import { MoodleClient } from "./client";
import { MoodleApiError, MoodleRequestError } from "./errors";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("MoodleClient constructor", () => {
  it("strips a trailing slash from baseUrl", () => {
    const client = new MoodleClient({
      baseUrl: "https://moodle.example.com/",
      token: "abc123",
    });

    expect(client.endpointUrl).toBe(
      "https://moodle.example.com/webservice/rest/server.php",
    );
  });

  it("supports overriding the endpoint path", () => {
    const client = new MoodleClient({
      baseUrl: "https://moodle.example.com",
      token: "abc123",
      endpointPath: "/custom/rest/server.php",
    });

    expect(client.endpointUrl).toBe(
      "https://moodle.example.com/custom/rest/server.php",
    );
  });

  it("throws when baseUrl is missing", () => {
    expect(() => new MoodleClient({ baseUrl: "", token: "abc123" })).toThrow(
      /baseUrl/,
    );
  });

  it("throws when token is missing", () => {
    expect(
      () => new MoodleClient({ baseUrl: "https://moodle.example.com", token: "" }),
    ).toThrow(/token/);
  });

  it("defaults restFormat to json", () => {
    const client = new MoodleClient({
      baseUrl: "https://moodle.example.com",
      token: "abc123",
    });

    expect(client.restFormat).toBe("json");
  });
});

describe("MoodleClient#call", () => {
  it("posts wstoken, wsfunction, and moodlewsrestformat alongside custom params", async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse({ ok: true }));
    const client = new MoodleClient({
      baseUrl: "https://moodle.example.com",
      token: "abc123",
      fetch: fetchMock,
    });

    await client.call("core_course_get_courses", { options: { ids: [2, 3] } });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toBe("https://moodle.example.com/webservice/rest/server.php");
    expect(init.method).toBe("POST");

    const body = init.body as URLSearchParams;
    expect(body.get("wstoken")).toBe("abc123");
    expect(body.get("wsfunction")).toBe("core_course_get_courses");
    expect(body.get("moodlewsrestformat")).toBe("json");
    expect(body.get("options[ids][0]")).toBe("2");
    expect(body.get("options[ids][1]")).toBe("3");
  });

  it("returns the parsed JSON payload on success", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(jsonResponse({ sitename: "My Moodle Site" }));
    const client = new MoodleClient({
      baseUrl: "https://moodle.example.com",
      token: "abc123",
      fetch: fetchMock,
    });

    const result = await client.call("core_webservice_get_site_info");

    expect(result).toEqual({ sitename: "My Moodle Site" });
  });

  it("throws MoodleApiError when Moodle returns an exception payload", async () => {
    const fetchMock = jest.fn().mockImplementation(() =>
      Promise.resolve(
        jsonResponse({
          exception: "moodle_exception",
          errorcode: "invalidtoken",
          message: "Invalid token - token not found",
        }),
      ),
    );
    const client = new MoodleClient({
      baseUrl: "https://moodle.example.com",
      token: "bad-token",
      fetch: fetchMock,
    });

    const error = await client.call("core_webservice_get_site_info").catch((err) => err);

    expect(error).toBeInstanceOf(MoodleApiError);
    expect(error).toMatchObject({ errorCode: "invalidtoken" });
  });

  it("throws MoodleRequestError on a non-2xx HTTP response", async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      new Response("Internal Server Error", { status: 500 }),
    );
    const client = new MoodleClient({
      baseUrl: "https://moodle.example.com",
      token: "abc123",
      fetch: fetchMock,
    });

    await expect(client.call("core_webservice_get_site_info")).rejects.toThrow(
      MoodleRequestError,
    );
  });

  it("throws MoodleRequestError when the fetch call itself rejects", async () => {
    const fetchMock = jest.fn().mockRejectedValue(new Error("network down"));
    const client = new MoodleClient({
      baseUrl: "https://moodle.example.com",
      token: "abc123",
      fetch: fetchMock,
    });

    await expect(client.call("core_webservice_get_site_info")).rejects.toThrow(
      MoodleRequestError,
    );
  });

  it("returns raw text without JSON parsing when restFormat is not json", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(new Response("<RESPONSE>ok</RESPONSE>", { status: 200 }));
    const client = new MoodleClient({
      baseUrl: "https://moodle.example.com",
      token: "abc123",
      restFormat: "xml",
      fetch: fetchMock,
    });

    const result = await client.call("core_webservice_get_site_info");

    expect(result).toBe("<RESPONSE>ok</RESPONSE>");

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = init.body as URLSearchParams;
    expect(body.get("moodlewsrestformat")).toBe("xml");
  });
});
