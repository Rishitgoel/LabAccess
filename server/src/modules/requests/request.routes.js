import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { create, detail, list, transition } from "./request.controller.js";
export const requestRoutes = Router();
requestRoutes.use(requireAuth);
requestRoutes.post("/", requireRole("learner"), create);
requestRoutes.get("/mine", requireRole("learner"), list(false));
requestRoutes.get("/:id", detail);
requestRoutes.post("/:id/cancel", requireRole("learner"), transition("cancel"));
requestRoutes.post(
  "/:id/resubmit",
  requireRole("learner"),
  transition("resubmit"),
);
export const reviewRoutes = Router();
reviewRoutes.use(requireAuth, requireRole("reviewer"));
reviewRoutes.get("/requests", list(true));
reviewRoutes.post("/requests/:id/decision", transition("decision"));
