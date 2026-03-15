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
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      farmer: {
        select: {
          isAccepted: true,
        },
      },
      customer: {
        select: {
          isAccepted: true,
        },
      },
      expert: {
        select: {
          isAccepted: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError("User belonging to this token no longer exists", 401);
  }

  req.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isAccepted:
      user.role === "FARMER"
        ? user.farmer?.isAccepted ?? false
        : user.role === "EXPERT"
        ? user.expert?.isAccepted ?? false
        : user.role === "CUSTOMER"
        ? user.customer?.isAccepted ?? false
        : true,
    createdAt: user.createdAt,
  };
  next();
};
