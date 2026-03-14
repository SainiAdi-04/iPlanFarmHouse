import { verifyToken } from "../utils/jwt.js";
import { AppError } from "../utils/errors.js";
import prisma from "../config/prisma.js";

export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Authentication required. No token provided.", 401);
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    throw new AppError("Authentication required. Malformed token.", 401);
  }

  const decoded = verifyToken(token);

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  if (!user) {
    throw new AppError("User belonging to this token no longer exists", 401);
  }

  req.user = user;
  next();
};
