import express from "express";
import {
  getInventory,
  getInventoryByProduct,
  reserveInventory,
} from "../controllers/inventoryController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = express.Router();

// Get all inventory
router.get("/", authenticateToken, getInventory);

// Get inventory for one product
router.get(
  "/product/:productId",
  authenticateToken,
  getInventoryByProduct,
);

// Reserve inventory for a confirmed sales order
router.post(
  "/reserve",
  authenticateToken,
  reserveInventory,
);

export default router;