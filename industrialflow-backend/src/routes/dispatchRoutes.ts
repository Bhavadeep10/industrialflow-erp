import express from "express";

import {
  createDispatch,
  getDispatches,
  getDispatchById,
} from "../controllers/dispatchController";

import { authenticateToken } from "../middleware/authMiddleware";

const router = express.Router();

// Create dispatch
router.post(
  "/",
  authenticateToken,
  createDispatch,
);

// Get all dispatches
router.get(
  "/",
  authenticateToken,
  getDispatches,
);

// Get dispatch by ID
router.get(
  "/:id",
  authenticateToken,
  getDispatchById,
);

export default router;