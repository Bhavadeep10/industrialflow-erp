import "dotenv/config";
import express from "express";
import authRoutes from "./routes/authRoutes";
import protectedRoutes from "./routes/protectedRoutes";

const app = express();

app.use(express.json());

// Authentication routes
app.use("/api/auth", authRoutes);

// Protected routes
app.use("/api/protected", protectedRoutes);

// Health check
app.get("/", (_req, res) => {
  res.json({
    message: "IndustrialFlow ERP API is running",
  });
});

export default app;