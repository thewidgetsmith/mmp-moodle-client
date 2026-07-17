import type { MoodleClient } from "../../../client";

/**
 * Parameters accepted by `core_webservice_get_site_info`.
 */
export interface GetSiteInfoParams {
  /**
   * Restrict the returned `functions` list to the given service short
   * names. When omitted, Moodle returns functions for every service the
   * token's user has access to.
   */
  serviceshortnames?: string[];
}

/** A single web service function exposed to the calling token. */
export interface MoodleSiteInfoFunction {
  name: string;
  version: string;
}

/** An "advanced feature" flag reported by the site (e.g. blogs, portfolios). */
export interface MoodleAdvancedFeature {
  name: string;
  value: number;
}

/**
 * Response shape of `core_webservice_get_site_info`. Several fields are
 * only present for authenticated (non-guest) users or newer Moodle
 * versions; those are marked optional.
 */
export interface MoodleSiteInfo {
  sitename: string;
  username: string;
  firstname: string;
  lastname: string;
  fullname: string;
  lang: string;
  userid: number;
  siteurl: string;
  userpictureurl: string;
  functions: MoodleSiteInfoFunction[];
  downloadfiles: 0 | 1;
  uploadfiles: 0 | 1;
  release?: string;
  version?: string;
  mobilecssurl?: string;
  advancedfeatures?: MoodleAdvancedFeature[];
  usercanmanageownfiles?: boolean;
  userquota?: number;
  usermaxuploadfilesize?: number;
  userhomepage?: number;
  userprivateaccesskey?: string;
  siteid?: number;
  sitecalendartype?: string;
  usercalendartype?: string;
  userissiteadmin?: boolean;
  theme?: string;
  limitconcurrentlogins?: number;
  policyagreed?: 0 | 1;
}

/**
 * Calls `core_webservice_get_site_info`, returning details about the site
 * and the capabilities/functions available to the authenticated web
 * service user. This is a good first call to make with a new token, since
 * it doubles as a way to verify the token is valid and see which functions
 * it's authorized to use.
 *
 * @see https://moodledev.io/docs/apis/subsystems/external/webservices
 */
export async function getSiteInfo(
  client: MoodleClient,
  params: GetSiteInfoParams = {},
): Promise<MoodleSiteInfo> {
  return client.call<MoodleSiteInfo>("core_webservice_get_site_info", {
    serviceshortnames: params.serviceshortnames,
  });
}

/**
 * Checks whether a `getSiteInfo` response indicates the calling token has
 * access to the given web service function -- a way to check access
 * *before* attempting a call, as an alternative to catching
 * {@link MoodleAccessDeniedError} after the fact. Useful for e.g. hiding UI
 * for features backed by functions the current token can't use.
 *
 * Note this only reflects function-level access (is the function part of
 * one of the token's enabled services); it can't predict resource-level
 * failures like `nopermissions` for a specific course/context.
 *
 * @example
 * ```ts
 * const siteInfo = await getSiteInfo(client);
 * if (!hasFunctionAccess(siteInfo, "core_course_get_contents")) {
 *   // Skip the call and degrade gracefully instead of hitting a MoodleAccessDeniedError.
 * }
 * ```
 */
export function hasFunctionAccess(
  siteInfo: Pick<MoodleSiteInfo, "functions">,
  wsfunction: string,
): boolean {
  return siteInfo.functions.some((fn) => fn.name === wsfunction);
}
