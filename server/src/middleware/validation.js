import { ApiError, exactFields } from "./errors.js";
export function objectId(value) {
  if (typeof value !== "string" || !/^[a-fA-F0-9]{24}$/.test(value))
    throw new ApiError(
      400,
      "INVALID_ID",
      "Use a valid resource or request ID.",
    );
  return value;
}
export function reasonText(value, min, max) {
  const text = typeof value === "string" ? value.trim() : "";
  if ([...text].length < min || [...text].length > max)
    throw new ApiError(
      400,
      "VALIDATION_ERROR",
      "Check the highlighted fields.",
      { reason: `Enter ${min}–${max} characters.` },
    );
  return text;
}
export function revisionNumber(value) {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new ApiError(
      400,
      "VALIDATION_ERROR",
      "A non-negative whole-number revision is required.",
    );
  return value;
}
export function pagination(query, extraFields = []) {
  exactFields(query, ["page", "pageSize", ...extraFields]);
  const positive = (value, fallback) => {
    if (value === undefined) return fallback;
    if (
      typeof value !== "string" ||
      !/^[1-9]\d*$/.test(value) ||
      !Number.isSafeInteger(Number(value))
    )
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "Use positive whole numbers for pagination.",
      );
    return Number(value);
  };
  const page = positive(query.page, 1),
    pageSize = Math.min(positive(query.pageSize, 20), 50);
  const skip = (page - 1) * pageSize;
  if (!Number.isSafeInteger(skip))
    throw new ApiError(400, "VALIDATION_ERROR", "Page is too large.");
  return { page, pageSize, skip };
}
