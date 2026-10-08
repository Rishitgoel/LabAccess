import express from "express";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { databaseReady } from "./config/database.js";
import { configureSession } from "./config/session.js";
import { csrfProtection } from "./middleware/csrf.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { resourceRoutes } from "./modules/resources/resource.routes.js";
import { ApiError } from "./middleware/errors.js";
import {
  requestRoutes,
  reviewRoutes,
} from "./modules/requests/request.routes.js";

export function createApp({
  isDatabaseReady = databaseReady,
  production = false,
  config,
} = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "16kb" }));
  app.get("/api/health", (_req, res) => {
    res.set("Cache-Control", "no-store");
    if (!isDatabaseReady()) {
      return res
        .status(503)
        .json({
          error: {
            code: "DATABASE_UNAVAILABLE",
            message:
              "API is reachable, but the database is unavailable. Check the server configuration and MongoDB.",
          },
        });
    }
    return res.json({ data: { status: "ready", database: "connected" } });
  });
  if (config) {
    app.use("/api", (_req, res, next) => {
      res.set("Cache-Control", "no-store");
      if (!isDatabaseReady())
        return next(
          new ApiError(
            503,
            "DATABASE_UNAVAILABLE",
            "Database unavailable. Try again shortly.",
          ),
        );
      next();
    });
    if (isDatabaseReady())
      app.locals.sessionStore = configureSession(app, config);
    app.use("/api", csrfProtection(config));
    app.use("/api/auth", authRoutes(config));
    app.use("/api/resources", resourceRoutes);
    app.use("/api/requests", requestRoutes);
    app.use("/api/review", reviewRoutes);
  }
  app.use("/api", (_req, res) =>
    res
      .status(404)
      .json({ error: { code: "NOT_FOUND", message: "API route not found." } }),
  );
  if (production) {
    const clientDist = fileURLToPath(
      new URL("../../client/dist/", import.meta.url),
    );
    if (!existsSync(`${clientDist}/index.html`))
      throw new Error(
        "Client build is missing. Run npm run build before production start.",
      );
    app.use(express.static(clientDist));
    app.get("/{*path}", (_req, res) =>
      res.sendFile(`${clientDist}/index.html`),
    );
  }
  app.use((_req, res) =>
    res
      .status(404)
      .json({ error: { code: "NOT_FOUND", message: "Route not found." } }),
  );
  app.use((error, _req, res, _next) => {
    if (error instanceof ApiError)
      return res
        .status(error.status)
        .json({
          error: {
            code: error.code,
            message: error.message,
            ...(error.fields && { fields: error.fields }),
          },
        });
    const status =
      error.type === "entity.too.large"
        ? 413
        : error.type === "entity.parse.failed"
          ? 400
          : 500;
    const code =
      status === 413
        ? "PAYLOAD_TOO_LARGE"
        : status === 400
          ? "INVALID_JSON"
          : "INTERNAL_ERROR";
    const message =
      status === 413
        ? "Request body is too large."
        : status === 400
          ? "Request body must be valid JSON."
          : "An unexpected error occurred.";
    res.status(status).json({ error: { code, message } });
  });
  return app;
}
