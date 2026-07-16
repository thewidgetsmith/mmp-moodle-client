/**
 * REST response format requested from Moodle. Moodle's web services layer
 * also supports a legacy XML format, but this client only parses `json`
 * responses -- `xml` (or any other format) is returned to the caller as a
 * raw string.
 */
export type MoodleResponseFormat = "json" | "xml";

/**
 * Configuration used to construct a {@link MoodleClient}.
 */
export interface MoodleClientConfig {
  /**
   * Base URL of the Moodle site, e.g. `https://moodle.example.com`.
   * A trailing slash is optional and will be stripped.
   */
  baseUrl: string;

  /**
   * The web service token generated for the calling user/service in Moodle
   * (Site administration > Server > Web services > Manage tokens).
   */
  token: string;

  /**
   * REST response format Moodle should return. Defaults to `"json"`.
   */
  restFormat?: MoodleResponseFormat;

  /**
   * Overrides the REST endpoint path appended to `baseUrl`.
   * Defaults to `/webservice/rest/server.php`.
   */
  endpointPath?: string;

  /**
   * Custom `fetch` implementation. Defaults to the runtime's global `fetch`.
   * Primarily useful for testing or non-standard runtimes.
   */
  fetch?: typeof fetch;
}

/**
 * Shape of a single warning entry that many Moodle web service functions
 * include in their response (e.g. "course 5 could not be found") alongside
 * otherwise-successful data.
 */
export interface MoodleWarning {
  item?: string;
  itemid?: number;
  warningcode: string;
  message: string;
}
