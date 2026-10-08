import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { listResources } from "./resource.service.js";
export const resourceRoutes = Router();
resourceRoutes.get("/", requireAuth, async (req, res) =>
  res.json(await listResources(req.query)),
);
