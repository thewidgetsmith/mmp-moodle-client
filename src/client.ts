import {
  isAccessDeniedPayload,
  isMoodleExceptionPayload,
  MoodleAccessDeniedError,
  MoodleApiError,
  MoodleRequestError,
} from "./errors";
import { buildMoodleParams, type MoodleParamValue } from "./params";
import type { MoodleClientConfig, MoodleResponseFormat } from "./types";

const DEFAULT_REST_FORMAT: MoodleResponseFormat = "json";
const DEFAULT_ENDPOINT_PATH = "/webservice/rest/server.php";

/**
 * Thin HTTP client for Moodle's "REST" web services protocol
 * (`/webservice/rest/server.php`). Resource functions (see `src/resources`)
 * are built on top of {@link MoodleClient.call} and encapsulate the
 * function name + parameter/response shapes for a specific Moodle web
 * service function.
 *
 * @example
 * ```ts
 * const client = new MoodleClient({
 *   baseUrl: "https://moodle.example.com",
 *   token: process.env.MOODLE_TOKEN!,
 * });
 *
 * const siteInfo = await client.call("core_webservice_get_site_info");
 * ```
 */
export class MoodleClient {
  readonly baseUrl: string;
  readonly restFormat: MoodleResponseFormat;

  private readonly token: string;
  private readonly endpointPath: string;
  private readonly fetchImpl: typeof fetch;

  constructor(config: MoodleClientConfig) {
    if (!config.baseUrl) {
      throw new TypeError("MoodleClient requires a non-empty `baseUrl`.");
    }
    if (!config.token) {
      throw new TypeError("MoodleClient requires a non-empty `token`.");
    }

    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.token = config.token;
    this.restFormat = config.restFormat ?? DEFAULT_REST_FORMAT;
    this.endpointPath = config.endpointPath ?? DEFAULT_ENDPOINT_PATH;
    this.fetchImpl = config.fetch ?? fetch;
  }

  /** Fully-qualified URL of the Moodle REST web services endpoint. */
  get endpointUrl(): string {
    return `${this.baseUrl}${this.endpointPath}`;
  }

  /**
   * Invokes a Moodle web service function by name.
   *
   * This is a low-level primitive; prefer using the typed resource
   * functions in `src/resources` where available, since they encapsulate
   * the function name and request/response types for you.
   *
   * @param wsfunction - The Moodle web service function name, e.g. `"core_course_get_courses"`.
   * @param params - Parameters for the function. Nested objects/arrays are
   *   flattened using Moodle's bracket notation (see {@link buildMoodleParams}).
   * @throws {MoodleAccessDeniedError} If Moodle denies access to `wsfunction`
   *   itself (the token's service doesn't include it, is missing a required
   *   capability, is IP/time-restricted, etc). A subclass of {@link MoodleApiError}.
   * @throws {MoodleApiError} If Moodle returns any other well-formed exception payload.
   * @throws {MoodleRequestError} If the request fails, or the response is an
   *   unrecognized non-2xx HTTP status.
   */
  async call<TResponse = unknown>(
    wsfunction: string,
    params: Readonly<Record<string, MoodleParamValue>> = {},
  ): Promise<TResponse> {
    const body = buildMoodleParams(params);
    body.set("wstoken", this.token);
    body.set("wsfunction", wsfunction);
    body.set("moodlewsrestformat", this.restFormat);

    let response: Response;
    try {
      response = await this.fetchImpl(this.endpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });
    } catch (cause) {
      throw new MoodleRequestError(
        `Failed to reach Moodle web services endpoint at ${this.endpointUrl}.`,
        { cause },
      );
    }

    if (!response.ok) {
      throw new MoodleRequestError(
        `Moodle web services endpoint responded with HTTP ${response.status} ${response.statusText}.`,
        { status: response.status },
      );
    }

    if (this.restFormat !== "json") {
      return (await response.text()) as unknown as TResponse;
    }

    const payload: unknown = await response.json();

    if (isMoodleExceptionPayload(payload)) {
      if (isAccessDeniedPayload(payload)) {
        throw new MoodleAccessDeniedError(payload, wsfunction);
      }
      throw new MoodleApiError(payload);
    }

    return payload as TResponse;
  }
}
