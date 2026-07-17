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
 * Thrown when Moodle denies access to the requested web service function
 * itself, rather than rejecting a parameter or the resource being requested.
 * This corresponds to Moodle's `webservice_access_exception`
 * (`errorcode: "accessexception"`), which Moodle raises for a grab-bag of
 * related reasons -- there's no separate errorcode to distinguish which:
 *
 * 1. The token's external service doesn't include this function at all.
 * 2. The service is user-restricted and this user isn't on the allow list.
 * 3. The service or user is IP-restricted and the caller's IP isn't listed.
 * 4. The service or token is time-restricted and has expired.
 * 5. The service requires a system-level capability the user doesn't have.
 *
 * See `webservice_base_server::load_function_info()` in Moodle's
 * `webservice/lib.php` for the authoritative logic. Site administration >
 * Server > Web services > External services is where services/functions are
 * configured; Manage tokens is where a token's service and any user/IP/time
 * restrictions are set.
 */
export class MoodleAccessDeniedError extends MoodleApiError {
  /** The web service function access was denied for. */
  readonly wsfunction: string;

  constructor(payload: MoodleExceptionPayload, wsfunction: string) {
    super(payload);
    this.name = "MoodleAccessDeniedError";
    this.wsfunction = wsfunction;

    Object.setPrototypeOf(this, MoodleAccessDeniedError.prototype);
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

/**
 * Identifies whether an exception payload represents Moodle denying access
 * to the requested function itself (`webservice_access_exception`), as
 * opposed to some other exception (invalid parameter, missing resource,
 * etc). Used internally by {@link MoodleClient.call} to decide whether to
 * throw {@link MoodleAccessDeniedError} instead of the generic
 * {@link MoodleApiError}.
 */
export function isAccessDeniedPayload(payload: MoodleExceptionPayload): boolean {
  return payload.errorcode === "accessexception";
}
