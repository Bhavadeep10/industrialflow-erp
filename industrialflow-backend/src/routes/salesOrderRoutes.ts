import express from "express";
import {
  createSalesOrder,
  getSalesOrders,
  getSalesOrderById,
  updateSalesOrderStatus,
} from "../controllers/salesOrderController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = express.Router();

// Create sales order from accepted quotation
router.post("/", authenticateToken, createSalesOrder);

// Get all sales orders
router.get("/", authenticateToken, getSalesOrders);

// Get sales order by ID
router.get("/:id", authenticateToken, getSalesOrderById);

// Update sales order status
router.patch(
  "/:id/status",
  authenticateToken,
  updateSalesOrderStatus,
);

export default router;