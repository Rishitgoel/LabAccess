import { User, publicUser } from "../modules/auth/user.model.js";
import { ApiError } from "./errors.js";
export async function requireAuth(req, _res, next) {
  if (!req.session?.userId)
    throw new ApiError(401, "UNAUTHENTICATED", "Sign in to continue.");
  const user = await User.findById(req.session.userId);
  if (!user) throw new ApiError(401, "UNAUTHENTICATED", "Sign in to continue.");
  req.user = publicUser(user);
  next();
}
export const requireRole = (role) => (req, _res, next) => {
  if (req.user?.role !== role)
    throw new ApiError(
      403,
      "FORBIDDEN",
      "You do not have access to this page.",
    );
  next();
};
