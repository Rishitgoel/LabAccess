import { ApiError } from "../../middleware/errors.js";
import { pagination } from "../../middleware/validation.js";
import { Resource } from "./resource.model.js";
export function publicResource({
  _id,
  name,
  description,
  category,
  eligibility,
  isActive,
}) {
  return {
    id: String(_id),
    name,
    description,
    category,
    eligibility,
    isActive,
  };
}
export async function availableResource(id) {
  const resource = await Resource.findOne({ _id: id, isActive: true }).lean();
  if (!resource)
    throw new ApiError(
      404,
      "NOT_FOUND",
      "Resource is unavailable or does not exist.",
    );
  return publicResource(resource);
}
export async function getResourceSummaries(ids) {
  const resources = await Resource.find({ _id: { $in: ids } })
    .select("name description category eligibility isActive")
    .lean();
  return new Map(
    resources.map((resource) => [
      String(resource._id),
      publicResource(resource),
    ]),
  );
}
export async function listResources(query) {
  const { page, pageSize, skip } = pagination(query);
  const filter = { isActive: true };
  const [records, total] = await Promise.all([
    Resource.find(filter)
      .sort({ name: 1, _id: 1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
    Resource.countDocuments(filter),
  ]);
  return {
    data: records.map(publicResource),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
