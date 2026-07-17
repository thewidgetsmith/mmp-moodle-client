import {
  isAccessDeniedPayload,
  isMoodleExceptionPayload,
  MoodleAccessDeniedError,
  MoodleApiError,
  MoodleRequestError,
} from "./errors";

describe("MoodleApiError", () => {
  it("exposes the exception payload fields", () => {
    const error = new MoodleApiError({
      exception: "moodle_exception",
      errorcode: "invalidtoken",
      message: "Invalid token - token not found",
      debuginfo: "some debug info",
    });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("MoodleApiError");
    expect(error.message).toBe("Invalid token - token not found");
    expect(error.exception).toBe("moodle_exception");
    expect(error.errorCode).toBe("invalidtoken");
    expect(error.debugInfo).toBe("some debug info");
  });

  it("leaves debugInfo undefined when not provided", () => {
    const error = new MoodleApiError({
      exception: "moodle_exception",
      errorcode: "nopermissions",
      message: "Sorry, but you do not currently have permissions to do that",
    });

    expect(error.debugInfo).toBeUndefined();
  });
});

describe("MoodleAccessDeniedError", () => {
  it("extends MoodleApiError and carries the wsfunction name", () => {
    const error = new MoodleAccessDeniedError(
      {
        exception: "webservice_access_exception",
        errorcode: "accessexception",
        message: "Access control exception",
      },
      "core_course_get_contents",
    );

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(MoodleApiError);
    expect(error.name).toBe("MoodleAccessDeniedError");
    expect(error.errorCode).toBe("accessexception");
    expect(error.wsfunction).toBe("core_course_get_contents");
  });
});

describe("isAccessDeniedPayload", () => {
  it("returns true for accessexception payloads", () => {
    expect(
      isAccessDeniedPayload({
        exception: "webservice_access_exception",
        errorcode: "accessexception",
        message: "Access control exception",
      }),
    ).toBe(true);
  });

  it("returns false for other errorcodes", () => {
    expect(
      isAccessDeniedPayload({
        exception: "moodle_exception",
        errorcode: "invalidtoken",
        message: "Invalid token",
      }),
    ).toBe(false);
  });
});

describe("MoodleRequestError", () => {
  it("captures an optional HTTP status and cause", () => {
    const cause = new Error("network down");
    const error = new MoodleRequestError("Failed to reach Moodle", {
      status: 502,
      cause,
    });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("MoodleRequestError");
    expect(error.status).toBe(502);
    expect(error.cause).toBe(cause);
  });
});

describe("isMoodleExceptionPayload", () => {
  it("returns true for well-formed exception payloads", () => {
    expect(
      isMoodleExceptionPayload({
        exception: "moodle_exception",
        errorcode: "invalidtoken",
        message: "Invalid token",
      }),
    ).toBe(true);
  });

  it("returns false for arbitrary successful responses", () => {
    expect(isMoodleExceptionPayload({ sitename: "My Moodle Site" })).toBe(false);
    expect(isMoodleExceptionPayload([1, 2, 3])).toBe(false);
    expect(isMoodleExceptionPayload(null)).toBe(false);
    expect(isMoodleExceptionPayload(undefined)).toBe(false);
    expect(isMoodleExceptionPayload("plain string")).toBe(false);
  });

  it("returns false when a required field has the wrong type", () => {
    expect(
      isMoodleExceptionPayload({
        exception: "moodle_exception",
        errorcode: "invalidtoken",
        message: 123,
      }),
    ).toBe(false);
  });
});
