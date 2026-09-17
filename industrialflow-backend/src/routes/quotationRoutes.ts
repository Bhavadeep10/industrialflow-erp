import express from "express";
import {
  createQuotation,
  getQuotations,
  getQuotationById,
  updateQuotationStatus,
} from "../controllers/quotationController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = express.Router();

// Create quotation
router.post("/", authenticateToken, createQuotation);

// Get all quotations
router.get("/", authenticateToken, getQuotations);

// Get quotation by ID
router.get("/:id", authenticateToken, getQuotationById);

// Update quotation status
router.patch(
  "/:id/status",
  authenticateToken,
  updateQuotationStatus,
);

export default router;