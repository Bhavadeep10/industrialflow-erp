import express from "express";
import {
  createEnquiry,
  getEnquiries,
  getEnquiryById,
  updateEnquiryStatus,
} from "../controllers/enquiryController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = express.Router();

// Create enquiry
router.post("/", authenticateToken, createEnquiry);

// Get all enquiries
router.get("/", authenticateToken, getEnquiries);

// Get enquiry by ID
router.get("/:id", authenticateToken, getEnquiryById);

// Update enquiry status
router.patch(
  "/:id/status",
  authenticateToken,
  updateEnquiryStatus,
);

export default router;