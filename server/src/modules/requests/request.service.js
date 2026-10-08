import { ApiError } from "../../middleware/errors.js";
import { getUserSummaries } from "../auth/auth.service.js";
import {
  availableResource,
  getResourceSummaries,
} from "../resources/resource.service.js";
import { AccessRequest } from "./request.model.js";
const transitions = {
  cancel: { role: "learner", from: ["pending"], to: "cancelled" },
  resubmit: { role: "learner", from: ["rejected", "cancelled"], to: "pending" },
  approve: { role: "reviewer", from: ["pending"], to: "approved" },
  reject: { role: "reviewer", from: ["pending"], to: "rejected" },
};
const visible = (actor, id) => ({
  _id: id,
  ...(actor.role === "learner" && { learnerId: actor.id }),
});
function assertRole(actor, role) {
  if (actor.role !== role)
    throw new ApiError(
      403,
      "FORBIDDEN",
      "You do not have permission to perform this action.",
    );
}
const notFound = () => new ApiError(404, "NOT_FOUND", "Request not found.");
const conflict = () =>
  new ApiError(
    409,
    "REQUEST_CONFLICT",
    "This request has changed or the action is no longer available. Refresh it before trying again.",
  );
async function responses(records) {
  const [resources, learners] = await Promise.all([
    getResourceSummaries([
      ...new Set(records.map((record) => String(record.resourceId))),
    ]),
    getUserSummaries([
      ...new Set(
        records.flatMap((record) => [
          String(record.learnerId),
          ...record.history.map((event) => String(event.actorId)),
        ]),
      ),
    ]),
  ]);
  return records.map((record) => ({
    id: String(record._id),
    resourceId: String(record.resourceId),
    learnerId: String(record.learnerId),
    reason: record.reason,
    status: record.status,
    submittedAt: record.submittedAt,
    decisionReason: record.decisionReason ?? null,
    revision: record.revision,
    history: record.history.map((event) => ({
      action: event.action,
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      actorId: String(event.actorId),
      actorName: learners.get(String(event.actorId))?.name ?? null,
      reason: event.reason,
      at: event.at,
    })),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    resource: resources.get(String(record.resourceId)) ?? null,
    learner: learners.get(String(record.learnerId)) ?? null,
  }));
}
export async function createRequest(actor, { resourceId, reason }) {
  assertRole(actor, "learner");
  await availableResource(resourceId);
  const at = new Date();
  let record;
  try {
    record = await AccessRequest.create({
      learnerId: actor.id,
      resourceId,
      reason,
      status: "pending",
      revision: 0,
      submittedAt: at,
      decisionReason: null,
      createdAt: at,
      updatedAt: at,
      history: [
        {
          action: "submit",
          fromStatus: null,
          toStatus: "pending",
          actorId: actor.id,
          reason,
          at,
        },
      ],
    });
  } catch (error) {
    if (error.code === 11000)
      throw new ApiError(
        409,
        "REQUEST_EXISTS",
        "A request already exists for this resource. Open that request to see its status or resubmit it.",
      );
    throw error;
  }
  return (await responses([record]))[0];
}
export async function requestDetail(actor, id) {
  const record = await AccessRequest.findOne(visible(actor, id)).lean();
  if (!record) throw notFound();
  return (await responses([record]))[0];
}
export async function listRequests(
  actor,
  { page, pageSize, skip, status },
  review = false,
) {
  assertRole(actor, review ? "reviewer" : "learner");
  const filter = {
    ...(!review && { learnerId: actor.id }),
    ...(status !== "all" && { status }),
  };
  const direction = review && status === "pending" ? 1 : -1;
  const [records, total] = await Promise.all([
    AccessRequest.find(filter)
      .sort({ submittedAt: direction, _id: direction })
      .skip(skip)
      .limit(pageSize)
      .lean(),
    AccessRequest.countDocuments(filter),
  ]);
  return {
    data: await responses(records),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
export async function transitionRequest(
  actor,
  id,
  action,
  { revision, reason },
) {
  const rule = transitions[action];
  assertRole(actor, rule.role);
  const identity = visible(actor, id);
  const previous = await AccessRequest.findOne(identity).lean();
  if (!previous) throw notFound();
  if (!rule.from.includes(previous.status) || previous.revision !== revision)
    throw conflict();
  if (action === "resubmit")
    await availableResource(String(previous.resourceId));
  const at = new Date();
  const changes = { status: rule.to, updatedAt: at };
  if (action === "resubmit")
    Object.assign(changes, { reason, submittedAt: at, decisionReason: null });
  if (action === "approve" || action === "reject")
    changes.decisionReason = reason;
  const record = await AccessRequest.findOneAndUpdate(
    { ...identity, status: previous.status, revision },
    {
      $set: changes,
      $inc: { revision: 1 },
      $push: {
        history: {
          action,
          fromStatus: previous.status,
          toStatus: rule.to,
          actorId: actor.id,
          reason: action === "cancel" ? previous.reason : reason,
          at,
        },
      },
    },
    { returnDocument: "after", runValidators: true, timestamps: false },
  ).lean();
  if (!record) {
    // Preserve the hidden/missing distinction if another writer removed the record.
    if (!(await AccessRequest.exists(identity))) throw notFound();
    throw conflict();
  }
  return (await responses([record]))[0];
}
