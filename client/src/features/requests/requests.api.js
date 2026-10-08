import { api } from "../../lib/api.js";
export const requestApi = {
  list: (review, page = 1) =>
    api(`/${review ? "review/requests" : "requests/mine"}?page=${page}`),
  detail: (id) => api(`/requests/${id}`),
  create: (resourceId, reason) =>
    api("/requests", { method: "POST", body: { resourceId, reason } }),
  decide: (id, body) =>
    api(`/review/requests/${id}/decision`, { method: "POST", body }),
};
export async function loadAllMine(read = api) {
  const first = await read("/requests/mine?page=1&pageSize=50");
  const records = [...first.data];
  for (let page = 2; page <= first.pagination.totalPages; page++)
    records.push(
      ...(await read(`/requests/mine?page=${page}&pageSize=50`)).data,
    );
  return records;
}
export class UnconfirmedWrite extends Error {
  constructor() {
    super(
      "The save result is unknown. Check saved state before submitting again.",
    );
    this.unconfirmed = true;
  }
}
export async function saveAndReconcile(
  write,
  read,
  matches,
  unchanged = () => false,
) {
  try {
    return { record: (await write()).data, reconciled: false };
  } catch (error) {
    if (!(error.status === 0 || error.status >= 500 || error.uncertain))
      throw error;
    let saved;
    try {
      saved = await read();
    } catch {
      throw new UnconfirmedWrite();
    }
    if (saved && matches(saved)) return { record: saved, reconciled: true };
    if (saved && unchanged(saved)) throw error;
    if (saved) {
      const conflict = new Error(
        "This request changed. Review the saved state before choosing another action.",
      );
      conflict.status = 409;
      throw conflict;
    }
    throw error;
  }
}
