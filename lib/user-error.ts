/**
 * Maps a caught error to a safe, user-facing message.
 *
 * Pass an optional `fallback` for operation-specific wording,
 * e.g. userError(err, "Failed to save event.")
 */
export function userError(
  _err: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  return fallback;
}

/** common fallback strings used across the app. */
export const ERR = {
  load:   "Failed to load data. Please refresh the page.",
  save:   "Failed to save. Please try again.",
  delete: "Failed to delete. Please try again.",
  auth:   "Sign in failed. Please check your credentials and try again.",
  upload: "Failed to upload file. Please try again.",
  submit: "Failed to submit. Please try again.",
  network:"Something went wrong. Please try again.",
} as const;
