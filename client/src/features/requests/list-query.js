export const requestStatuses = [
  "all",
  "pending",
  "approved",
  "rejected",
  "cancelled",
];
export function readListQuery(params, review) {
  const rawPage = params.get("page") ?? "1";
  return {
    page:
      /^[1-9]\d*$/.test(rawPage) && Number.isSafeInteger(Number(rawPage))
        ? Number(rawPage)
        : 1,
    status: requestStatuses.includes(params.get("status"))
      ? params.get("status")
      : review
        ? "pending"
        : "all",
  };
}
export const availablePage = (page, totalPages) =>
  Math.min(page, Math.max(1, totalPages));
