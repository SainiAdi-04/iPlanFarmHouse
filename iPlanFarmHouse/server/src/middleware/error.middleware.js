export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational || false;

  console.error(`[ERROR] ${err.message}`, {
    statusCode,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
  });

  // Prisma unique constraint violation
  if (err.code === "P2002") {
    return res.status(409).json({
      success: false,
      message: "A record with this value already exists",
    });
  }

  // Zod validation errors (fallback if thrown outside validate middleware)
  if (err.name === "ZodError" && err.issues) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }

  // Operational errors (AppError instances)
  if (isOperational) {
    return res.status(statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Programming/unknown errors - never leak details
  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
