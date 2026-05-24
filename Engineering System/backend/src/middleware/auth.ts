import { Request, Response, NextFunction } from "express";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // For MVP: allow all in development. In production, validate JWT.
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token && process.env.NODE_ENV === "production") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

