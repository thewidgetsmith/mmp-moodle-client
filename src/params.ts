/**
 * Value types accepted when building parameters for a Moodle web service
 * call. Moodle's REST protocol encodes nested arrays/objects using PHP-style
 * bracket notation (e.g. `options[ids][0]=2`), so consumers may freely nest
 * plain objects and arrays here and {@link buildMoodleParams} will flatten
 * them appropriately.
 */
export type MoodleParamValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly MoodleParamValue[]
  | { readonly [key: string]: MoodleParamValue };

/**
 * Flattens a (possibly nested) params object into a `URLSearchParams`
 * instance using the PHP-style bracket notation Moodle's `server.php`
 * endpoint expects, e.g.:
 *
 * ```ts
 * buildMoodleParams({ options: { ids: [2, 3] } }).toString();
 * // "options%5Bids%5D%5B0%5D=2&options%5Bids%5D%5B1%5D=3"
 * ```
 *
 * `null` and `undefined` values (at any depth) are omitted entirely, which
 * lets resource functions pass through optional parameters without needing
 * to manually strip them first. Booleans are serialized as `"1"`/`"0"`,
 * matching Moodle's `PARAM_BOOL` convention.
 */
export function buildMoodleParams(
  params: Readonly<Record<string, MoodleParamValue>> = {},
): URLSearchParams {
  const searchParams = new URLSearchParams();
  appendParam(searchParams, undefined, params);
  return searchParams;
}

function appendParam(
  target: URLSearchParams,
  key: string | undefined,
  value: MoodleParamValue,
): void {
  if (value === null || value === undefined) {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      appendParam(target, formatKey(key, String(index)), item);
    });
    return;
  }

  if (typeof value === "object") {
    for (const [childKey, childValue] of Object.entries(value)) {
      appendParam(target, formatKey(key, childKey), childValue);
    }
    return;
  }

  if (key === undefined) {
    throw new TypeError("Top-level Moodle parameters must be a plain object.");
  }

  target.append(key, serializePrimitive(value));
}

function formatKey(parentKey: string | undefined, childKey: string): string {
  return parentKey === undefined ? childKey : `${parentKey}[${childKey}]`;
}

function serializePrimitive(value: string | number | boolean): string {
  if (typeof value === "boolean") {
    return value ? "1" : "0";
  }
  return String(value);
}
