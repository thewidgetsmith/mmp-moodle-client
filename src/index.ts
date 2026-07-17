export { MoodleClient } from "./client";
export type { MoodleClientConfig, MoodleResponseFormat, MoodleWarning } from "./types";

export {
  isAccessDeniedPayload,
  isMoodleExceptionPayload,
  MoodleAccessDeniedError,
  MoodleApiError,
  MoodleRequestError,
} from "./errors";
export type { MoodleExceptionPayload } from "./errors";

export { buildMoodleParams } from "./params";
export type { MoodleParamValue } from "./params";

export * as resources from "./resources";
