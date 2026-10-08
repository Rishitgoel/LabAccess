import { ApiError, exactFields } from "../../middleware/errors.js";
import {
  objectId,
  reasonText,
  revisionNumber,
  pagination,
} from "../../middleware/validation.js";
import { statuses } from "./request.model.js";
import {
  createRequest,
  requestDetail,
  listRequests,
  transitionRequest,
} from "./request.service.js";
export async function create(req, res) {
  exactFields(req.query, []);
  exactFields(req.body, ["resourceId", "reason"]);
  res
    .status(201)
    .json({
      data: await createRequest(req.user, {
        resourceId: objectId(req.body.resourceId),
        reason: reasonText(req.body.reason, 20, 1000),
      }),
    });
}
export async function detail(req, res) {
  exactFields(req.query, []);
  res.json({ data: await requestDetail(req.user, objectId(req.params.id)) });
}
export const list = (review) => async (req, res) => {
  const paging = pagination(req.query, ["status"]);
  const status = req.query.status ?? (review ? "pending" : "all");
  if (!["all", ...statuses].includes(status))
    throw new ApiError(
      400,
      "VALIDATION_ERROR",
      "Choose a valid request status.",
    );
  res.json(await listRequests(req.user, { ...paging, status }, review));
};
export const transition = (action) => async (req, res) => {
  exactFields(req.query, []);
  exactFields(
    req.body,
    action === "decision"
      ? ["revision", "status", "reason"]
      : action === "resubmit"
        ? ["revision", "reason"]
        : ["revision"],
  );
  const id = objectId(req.params.id),
    revision = revisionNumber(req.body.revision);
  let reason,
    nextAction = action;
  if (action === "decision") {
    if (!["approved", "rejected"].includes(req.body.status))
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "Choose approved or rejected.",
      );
    nextAction = req.body.status === "approved" ? "approve" : "reject";
    reason = reasonText(req.body.reason, 10, 500);
  }
  if (action === "resubmit") reason = reasonText(req.body.reason, 20, 1000);
  res.json({
    data: await transitionRequest(req.user, id, nextAction, {
      revision,
      reason,
    }),
  });
};
