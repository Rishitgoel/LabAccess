import argon2 from "argon2";
import { randomBytes } from "node:crypto";
import { ApiError } from "../../middleware/errors.js";
import { User, publicUser } from "./user.model.js";
const length = (value) => [...value].length;
export function validateCredentials(body, registration = false) {
  const fields = {};
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    fields.email = "Enter a valid email address.";
  if (
    typeof body.password !== "string" ||
    length(body.password) < 12 ||
    length(body.password) > 128
  )
    fields.password = "Use 12–128 characters.";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (registration && (length(name) < 2 || length(name) > 80))
    fields.name = "Use 2–80 characters.";
  if (Object.keys(fields).length)
    throw new ApiError(
      400,
      "VALIDATION_ERROR",
      "Check the highlighted fields.",
      fields,
    );
  return { email, password: body.password, name };
}
export const hashPassword = (password) =>
  argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  });
let dummyHash;
export async function register(credentials) {
  try {
    return publicUser(
      await User.create({
        name: credentials.name,
        email: credentials.email,
        passwordHash: await hashPassword(credentials.password),
        role: "learner",
      }),
    );
  } catch (error) {
    if (error.code === 11000)
      throw new ApiError(
        409,
        "EMAIL_EXISTS",
        "An account with that email already exists.",
        { email: "Use another email or sign in." },
      );
    throw error;
  }
}
export async function login({ email, password }) {
  const user = await User.findOne({ email }).select("+passwordHash");
  dummyHash ??= hashPassword(randomBytes(32).toString("hex"));
  const valid = await argon2.verify(
    user?.passwordHash ?? (await dummyHash),
    password,
  );
  if (!user || !valid)
    throw new ApiError(
      401,
      "INVALID_CREDENTIALS",
      "Email or password is incorrect.",
    );
  return publicUser(user);
}
