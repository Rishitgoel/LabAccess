import { ApiError, exactFields } from "../../middleware/errors.js";
import { Resource } from "./resource.model.js";
export async function listResources(query) {
  exactFields(query, ["page", "pageSize"]);
  function pageNumber(value, fallback) {
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
  }
  const page = pageNumber(query.page, 1),
    pageSize = Math.min(pageNumber(query.pageSize, 20), 50);
  if (!Number.isSafeInteger((page - 1) * pageSize))
    throw new ApiError(400, "VALIDATION_ERROR", "Page is too large.");
  const filter = { isActive: true };
  const [records, total] = await Promise.all([
    Resource.find(filter)
      .sort({ name: 1, _id: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Resource.countDocuments(filter),
  ]);
  return {
    data: records.map(
      ({ _id, name, description, category, eligibility, isActive }) => ({
        id: String(_id),
        name,
        description,
        category,
        eligibility,
        isActive,
      }),
    ),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
