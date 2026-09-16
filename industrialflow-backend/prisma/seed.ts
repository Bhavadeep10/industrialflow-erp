import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seed...");

  // =========================
  // CREATE USERS
  // =========================

  const adminPassword = await bcrypt.hash("Admin@123", 10);
  const salesPassword = await bcrypt.hash("Sales@123", 10);

  const admin = await prisma.user.upsert({
    where: {
      email: "admin@industrialflow.com",
    },
    update: {},
    create: {
      name: "System Administrator",
      email: "admin@industrialflow.com",
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
    },
  });

  const salesUser = await prisma.user.upsert({
    where: {
      email: "sales@industrialflow.com",
    },
    update: {},
    create: {
      name: "Sales User",
      email: "sales@industrialflow.com",
      passwordHash: salesPassword,
      role: UserRole.SALES_USER,
    },
  });

  console.log(`Created/verified admin: ${admin.email}`);
  console.log(`Created/verified sales user: ${salesUser.email}`);

  // =========================
  // CREATE PRODUCTS
  // =========================

  const products = [
    {
      productCode: "IND-P001",
      productName: "Industrial Hydraulic Pump",
      category: "Hydraulic Equipment",
      unit: "PCS",
      basePrice: 25000,
      physicalQuantity: 200,
    },
    {
      productCode: "IND-P002",
      productName: "Heavy Duty Conveyor Belt",
      category: "Material Handling",
      unit: "MTR",
      basePrice: 3200,
      physicalQuantity: 500,
    },
    {
      productCode: "IND-P003",
      productName: "Industrial Gear Motor",
      category: "Power Transmission",
      unit: "PCS",
      basePrice: 18500,
      physicalQuantity: 120,
    },
    {
      productCode: "IND-P004",
      productName: "Pneumatic Control Valve",
      category: "Pneumatic Equipment",
      unit: "PCS",
      basePrice: 7800,
      physicalQuantity: 150,
    },
    {
      productCode: "IND-P005",
      productName: "Stainless Steel Storage Tank",
      category: "Industrial Storage",
      unit: "PCS",
      basePrice: 45000,
      physicalQuantity: 60,
    },
    {
      productCode: "IND-P006",
      productName: "Industrial Pressure Gauge",
      category: "Instrumentation",
      unit: "PCS",
      basePrice: 2800,
      physicalQuantity: 300,
    },
  ];

  // =========================
  // CREATE INVENTORY
  // =========================

  for (const item of products) {
    const product = await prisma.product.upsert({
      where: {
        productCode: item.productCode,
      },
      update: {
        productName: item.productName,
        category: item.category,
        unit: item.unit,
        basePrice: item.basePrice,
      },
      create: {
        productCode: item.productCode,
        productName: item.productName,
        category: item.category,
        unit: item.unit,
        basePrice: item.basePrice,
      },
    });

    await prisma.inventory.upsert({
      where: {
        productId: product.id,
      },
      update: {
        physicalQuantity: item.physicalQuantity,
      },
      create: {
        productId: product.id,
        physicalQuantity: item.physicalQuantity,
        reservedQuantity: 0,
      },
    });

    console.log(
      `Created/verified product: ${product.productCode} - ${product.productName}`,
    );
  }

  console.log("Database seed completed successfully.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });