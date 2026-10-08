import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { exactFields } from "../../middleware/errors.js";
import { requireAuth } from "../../middleware/auth.js";
import { newCsrfToken } from "../../middleware/csrf.js";
import { cookieName, cookieOptions } from "../../config/session.js";
import { register, login, validateCredentials } from "./auth.service.js";
const sessionCall = (req, method) =>
  new Promise((resolve, reject) =>
    req.session[method]((error) => (error ? reject(error) : resolve())),
  );
export function authRoutes(config) {
  const router = Router();
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, res) =>
      res
        .status(429)
        .json({
          error: {
            code: "RATE_LIMITED",
            message: "Too many attempts. Try again in 15 minutes.",
          },
        }),
  });
  router.get("/csrf", (req, res) => {
    req.session.csrfToken ??= newCsrfToken();
    res.json({ data: { csrfToken: req.session.csrfToken } });
  });
  router.post("/register", limiter, async (req, res) => {
    exactFields(req.body, ["name", "email", "password"]);
    res
      .status(201)
      .json({ data: await register(validateCredentials(req.body, true)) });
  });
  router.post("/login", limiter, async (req, res) => {
    exactFields(req.body, ["email", "password"]);
    const user = await login(validateCredentials(req.body));
    await sessionCall(req, "regenerate");
    req.session.userId = user.id;
    req.session.csrfToken = newCsrfToken();
    await sessionCall(req, "save");
    res.json({ data: user });
  });
  router.get("/me", requireAuth, (req, res) => res.json({ data: req.user }));
  router.post("/logout", requireAuth, async (req, res) => {
    exactFields(req.body, []);
    await sessionCall(req, "destroy");
    res.clearCookie(cookieName, cookieOptions(config));
    res.json({ data: { loggedOut: true } });
  });
  return router;
}
