import express, { Response } from "express";
import {
  authenticateToken,
  AuthRequest,
} from "../middleware/authMiddleware";
import { authorizeRoles } from "../middleware/roleMiddleware";

const router = express.Router();

// Any authenticated user
router.get(
  "/profile",
  authenticateToken,
  (req: AuthRequest, res: Response) => {
    res.status(200).json({
      message: "Protected route accessed successfully",
      user: req.user,
    });
  },
);

// ADMIN only
router.get(
  "/admin-test",
  authenticateToken,
  authorizeRoles("ADMIN"),
  (req: AuthRequest, res: Response) => {
    res.status(200).json({
      message: "Admin-only route accessed successfully",
      user: req.user,
    });
  },
);

export default router;