/**
 * Shape of the JSON payload Moodle returns when a web service call fails
 * with a handled exception (invalid token, missing capability, bad
 * parameter, etc). Moodle typically responds with HTTP 200 even in this
 * case, so the payload shape -- not the HTTP status -- is what identifies
 * the failure.
 */
export interface MoodleExceptionPayload {
  exception: string;
  errorcode: string;
  message: string;
  debuginfo?: string;
}

/**
 * Thrown when Moodle's web services endpoint responds with a well-formed
 * exception payload, e.g. an invalid token or a caller lacking the required
 * capability for the requested function.
 */
export class MoodleApiError extends Error {
  /** The PHP exception class Moodle raised (e.g. `moodle_exception`). */
  readonly exception: string;

  /** Moodle's machine-readable error code (e.g. `invalidtoken`). */
  readonly errorCode: string;

  /** Additional debugging information, only present when debug mode is on. */
  readonly debugInfo?: string;

  constructor(payload: MoodleExceptionPayload) {
    super(payload.message);
    this.name = "MoodleApiError";
    this.exception = payload.exception;
    this.errorCode = payload.errorcode;
    this.debugInfo = payload.debuginfo;

    Object.setPrototypeOf(this, MoodleApiError.prototype);
  }
}

/**
 * Thrown when the HTTP request to Moodle's web services endpoint could not
 * be completed at all, or when the endpoint responded with a non-2xx status
 * that isn't a well-formed {@link MoodleExceptionPayload} (e.g. a reverse
 * proxy error page, or the endpoint URL being misconfigured).
 */
export class MoodleRequestError extends Error {
  /** HTTP status code of the response, when one was received. */
  readonly status?: number;

  constructor(message: string, options: { cause?: unknown; status?: number } = {}) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "MoodleRequestError";
    this.status = options.status;

    Object.setPrototypeOf(this, MoodleRequestError.prototype);
  }
}

/**
 * Type guard identifying whether a parsed JSON response body matches
 * Moodle's exception payload shape.
 */
export function isMoodleExceptionPayload(
  payload: unknown,
): payload is MoodleExceptionPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "exception" in payload &&
    "errorcode" in payload &&
    "message" in payload &&
    typeof (payload as Record<string, unknown>).exception === "string" &&
    typeof (payload as Record<string, unknown>).errorcode === "string" &&
    typeof (payload as Record<string, unknown>).message === "string"
  );
}
