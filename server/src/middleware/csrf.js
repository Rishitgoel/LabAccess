import { randomBytes, timingSafeEqual } from "node:crypto";
import { ApiError } from "./errors.js";
export const newCsrfToken = () => randomBytes(32).toString("hex");
export function csrfProtection(config) {
  return (req, _res, next) => {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
    let origin;
    try {
      origin = req.get("origin") ?? new URL(req.get("referer")).origin;
    } catch {
      /* Rejected below. */
    }
    const sent = req.get("x-csrf-token");
    const expected = req.session?.csrfToken;
    if (
      origin !== config.appOrigin ||
      typeof sent !== "string" ||
      !expected ||
      Buffer.byteLength(sent) !== Buffer.byteLength(expected) ||
      !timingSafeEqual(Buffer.from(sent), Buffer.from(expected))
    ) {
      throw new ApiError(
        403,
        "CSRF_INVALID",
        "Your session could not be verified. Refresh the page and try again.",
      );
    }
    next();
  };
}
