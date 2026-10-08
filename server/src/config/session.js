import session from "express-session";
import MongoStore from "connect-mongo";
import mongoose from "mongoose";
export const cookieName = "labaccess.sid";
export function cookieOptions(config) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: config.nodeEnv === "production",
    path: "/",
  };
}
export function configureSession(app, config) {
  if (!config.sessionSecret || config.sessionSecret.length < 32)
    throw new Error("SESSION_SECRET must contain at least 32 characters.");
  const store = MongoStore.create({
    client: mongoose.connection.getClient(),
    collectionName: "sessions",
    ttl: config.sessionMaxAgeMs / 1000,
    touchAfter: 0,
  });
  store.on("error", () =>
    console.error("Session persistence failed. Check MongoDB availability."),
  );
  app.use(
    session({
      name: cookieName,
      secret: config.sessionSecret,
      store,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: { ...cookieOptions(config), maxAge: config.sessionMaxAgeMs },
    }),
  );
  return store;
}
