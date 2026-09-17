import express from "express";
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
} from "../controllers/customerController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = express.Router();

// Create customer
router.post("/", authenticateToken, createCustomer);

// Get all customers
router.get("/", authenticateToken, getCustomers);

// Get customer by ID
router.get("/:id", authenticateToken, getCustomerById);

// Update customer
router.put("/:id", authenticateToken, updateCustomer);

export default router;