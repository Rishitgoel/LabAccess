let csrfToken;
let csrfPromise;
export class ApiError extends Error {
  constructor(status, error) {
    super(error?.message ?? "The server could not be reached. Try again.");
    this.status = status;
    this.code = error?.code;
    this.fields = error?.fields ?? {};
  }
}
export function clearCsrf() {
  csrfToken = undefined;
  csrfPromise = undefined;
}
async function token() {
  if (csrfToken) return csrfToken;
  csrfPromise ??= api("/auth/csrf")
    .then((result) => (csrfToken = result.data.csrfToken))
    .finally(() => {
      csrfPromise = undefined;
    });
  return csrfPromise;
}
export async function api(path, { method = "GET", body } = {}) {
  const headers = {};
  if (method !== "GET") {
    headers["Content-Type"] = "application/json";
    headers["X-CSRF-Token"] = await token();
  }
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: "include",
      headers,
      ...(body !== undefined && { body: JSON.stringify(body) }),
    });
  } catch {
    throw new ApiError(0);
  }
  let result;
  try {
    result = await response.json();
  } catch {
    const error = new ApiError(response.status, {
      message: "Unexpected server response. Try again.",
    });
    error.uncertain = method !== "GET";
    throw error;
  }
  if (!response.ok) {
    if (
      response.status === 401 &&
      path !== "/auth/login" &&
      path !== "/auth/me"
    )
      window.dispatchEvent(new Event("session-expired"));
    if (result.error?.code === "CSRF_INVALID") {
      clearCsrf();
      if (!path.startsWith("/auth/")) {
        try {
          await api("/auth/me");
        } catch (sessionError) {
          if (sessionError.status === 401)
            window.dispatchEvent(new Event("session-expired"));
        }
      }
    }
    throw new ApiError(response.status, result.error);
  }
  return result;
}
