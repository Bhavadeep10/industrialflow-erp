import "dotenv/config";
import express from "express";

import authRoutes from "./routes/authRoutes";
import protectedRoutes from "./routes/protectedRoutes";
import customerRoutes from "./routes/customerRoutes";
import enquiryRoutes from "./routes/enquiryRoutes";
import quotationRoutes from "./routes/quotationRoutes";
import salesOrderRoutes from "./routes/salesOrderRoutes";
import inventoryRoutes from "./routes/inventoryRoutes";
import dispatchRoutes from "./routes/dispatchRoutes";

const app = express();

app.use(express.json());

// Authentication routes
app.use("/api/auth", authRoutes);

// Protected test routes
app.use("/api/protected", protectedRoutes);

// Customer routes
app.use("/api/customers", customerRoutes);

// Enquiry routes
app.use("/api/enquiries", enquiryRoutes);

// Quotation routes
app.use("/api/quotations", quotationRoutes);

// Sales Order routes
app.use("/api/sales-orders", salesOrderRoutes);

// Inventory routes
app.use("/api/inventory", inventoryRoutes);

// Dispatch routes
app.use("/api/dispatches", dispatchRoutes);

// Health check
app.get("/", (_req, res) => {
  res.json({
    message: "IndustrialFlow ERP API is running",
  });
});

export default app;