import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/authMiddleware";

const prisma = new PrismaClient();

// Get inventory for all products
export const getInventory = async (
  _req: AuthRequest,
  res: Response,
) => {
  try {
    const inventory = await prisma.inventory.findMany({
      orderBy: {
        productId: "asc",
      },
      include: {
        product: true,
      },
    });

    const inventoryWithAvailable = inventory.map((item) => ({
      ...item,
      availableQuantity:
        item.physicalQuantity - item.reservedQuantity,
    }));

    return res.status(200).json({
      inventory: inventoryWithAvailable,
    });
  } catch (error) {
    console.error("Get inventory error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Get inventory for one product
export const getInventoryByProduct = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const productId = Number(req.params.productId);

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    const inventory = await prisma.inventory.findUnique({
      where: {
        productId,
      },
      include: {
        product: true,
      },
    });

    if (!inventory) {
      return res.status(404).json({
        message: "Inventory record not found",
      });
    }

    return res.status(200).json({
      inventory: {
        ...inventory,
        availableQuantity:
          inventory.physicalQuantity -
          inventory.reservedQuantity,
      },
    });
  } catch (error) {
    console.error("Get inventory by product error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Reserve inventory for a confirmed sales order
export const reserveInventory = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const { salesOrderId } = req.body;

    if (!salesOrderId) {
      return res.status(400).json({
        message: "salesOrderId is required",
      });
    }

    const parsedSalesOrderId = Number(salesOrderId);

    if (
      !Number.isInteger(parsedSalesOrderId) ||
      parsedSalesOrderId <= 0
    ) {
      return res.status(400).json({
        message: "Invalid sales order ID",
      });
    }

    const result = await prisma.$transaction(
      async (tx) => {
        // Get the sales order and its items
        const salesOrder = await tx.salesOrder.findUnique({
          where: {
            id: parsedSalesOrderId,
          },
          include: {
            items: true,
          },
        });

        if (!salesOrder) {
          throw new Error("SALES_ORDER_NOT_FOUND");
        }

        if (salesOrder.status === "CANCELLED") {
          throw new Error("SALES_ORDER_CANCELLED");
        }

        if (salesOrder.status !== "CONFIRMED") {
          throw new Error("SALES_ORDER_NOT_CONFIRMED");
        }

        if (salesOrder.items.length === 0) {
          throw new Error("SALES_ORDER_HAS_NO_ITEMS");
        }

        /*
         * Lock inventory rows before checking availability.
         *
         * PostgreSQL SELECT ... FOR UPDATE ensures that
         * simultaneous reservation requests for the same
         * product cannot both modify the stock at the same time.
         */
        const reservedItems: {
          productId: number;
          quantity: number;
          availableBefore: number;
          availableAfter: number;
        }[] = [];

        for (const orderItem of salesOrder.items) {
          const inventoryRows =
            await tx.$queryRaw<
              {
                id: number;
                productId: number;
                physicalQuantity: number;
                reservedQuantity: number;
              }[]
            >`
              SELECT
                id,
                "productId",
                "physicalQuantity",
                "reservedQuantity"
              FROM "Inventory"
              WHERE "productId" = ${orderItem.productId}
              FOR UPDATE
            `;

          if (inventoryRows.length === 0) {
            throw new Error(
              `INVENTORY_NOT_FOUND:${orderItem.productId}`,
            );
          }

          const inventory = inventoryRows[0];

          const availableBefore =
            inventory.physicalQuantity -
            inventory.reservedQuantity;

          if (orderItem.quantity > availableBefore) {
            throw new Error(
              `INSUFFICIENT_STOCK:${orderItem.productId}:${availableBefore}`,
            );
          }

          reservedItems.push({
            productId: orderItem.productId,
            quantity: orderItem.quantity,
            availableBefore,
            availableAfter:
              availableBefore - orderItem.quantity,
          });
        }

        // All items have enough stock.
        // Now increase reserved quantity atomically.
        for (const item of reservedItems) {
          await tx.inventory.update({
            where: {
              productId: item.productId,
            },
            data: {
              reservedQuantity: {
                increment: item.quantity,
              },
            },
          });
        }

        return reservedItems;
      },
      {
        isolationLevel: "Serializable",
      },
    );

    return res.status(200).json({
      message: "Inventory reserved successfully",
      salesOrderId: parsedSalesOrderId,
      reservedItems: result,
    });
  } catch (error) {
    console.error("Reserve inventory error:", error);

    if (error instanceof Error) {
      if (error.message === "SALES_ORDER_NOT_FOUND") {
        return res.status(404).json({
          message: "Sales order not found",
        });
      }

      if (error.message === "SALES_ORDER_CANCELLED") {
        return res.status(400).json({
          message:
            "Inventory cannot be reserved for a cancelled sales order",
        });
      }

      if (error.message === "SALES_ORDER_NOT_CONFIRMED") {
        return res.status(400).json({
          message:
            "Inventory can only be reserved for a confirmed sales order",
        });
      }

      if (error.message === "SALES_ORDER_HAS_NO_ITEMS") {
        return res.status(400).json({
          message: "Sales order must contain at least one item",
        });
      }

      if (error.message.startsWith("INVENTORY_NOT_FOUND:")) {
        const productId =
          error.message.split(":")[1];

        return res.status(404).json({
          message:
            `Inventory record not found for product ${productId}`,
        });
      }

      if (error.message.startsWith("INSUFFICIENT_STOCK:")) {
        const parts = error.message.split(":");
        const productId = parts[1];
        const availableQuantity = parts[2];

        return res.status(409).json({
          message:
            `Insufficient available stock for product ${productId}`,
          availableQuantity: Number(availableQuantity),
        });
      }

      // PostgreSQL/Prisma serialization conflict
      if (
        error.message.includes(
          "Transaction failed due to a write conflict",
        ) ||
        error.message.includes(
          "could not serialize access",
        )
      ) {
        return res.status(409).json({
          message:
            "Inventory reservation conflict. Please retry the reservation.",
        });
      }
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};