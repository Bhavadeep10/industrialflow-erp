import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/authMiddleware";

const prisma = new PrismaClient();

// Create dispatch for a sales order
export const createDispatch = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const {
      salesOrderId,
      vehicleNumber,
      driverName,
      items,
    } = req.body;

    if (
      !salesOrderId ||
      !vehicleNumber ||
      !driverName ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        message:
          "salesOrderId, vehicleNumber, driverName and at least one item are required",
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
        // Find sales order
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

        // Cancelled orders cannot be dispatched
        if (salesOrder.status === "CANCELLED") {
          throw new Error("SALES_ORDER_CANCELLED");
        }

        // Only confirmed or partially dispatched orders can be dispatched
        if (
          salesOrder.status !== "CONFIRMED" &&
          salesOrder.status !== "DISPATCHED"
        ) {
          throw new Error("SALES_ORDER_NOT_READY");
        }

        if (salesOrder.items.length === 0) {
          throw new Error("SALES_ORDER_HAS_NO_ITEMS");
        }

        // Validate dispatch items
        const validatedItems: {
          productId: number;
          quantity: number;
        }[] = [];

        const orderProductIds = new Set(
          salesOrder.items.map(
            (item) => item.productId,
          ),
        );

        const dispatchProductIds = new Set<number>();

        for (const item of items) {
          const productId = Number(item.productId);
          const quantity = Number(item.quantity);

          if (
            !Number.isInteger(productId) ||
            productId <= 0 ||
            !Number.isInteger(quantity) ||
            quantity <= 0
          ) {
            throw new Error("INVALID_DISPATCH_ITEM");
          }

          if (!orderProductIds.has(productId)) {
            throw new Error(
              `PRODUCT_NOT_IN_ORDER:${productId}`,
            );
          }

          if (dispatchProductIds.has(productId)) {
            throw new Error(
              "DUPLICATE_DISPATCH_PRODUCT",
            );
          }

          dispatchProductIds.add(productId);

          validatedItems.push({
            productId,
            quantity,
          });
        }

        // All products in the sales order must be included
        if (
          dispatchProductIds.size !==
          orderProductIds.size
        ) {
          throw new Error("MISSING_ORDER_PRODUCT");
        }

        const dispatchItems: {
          productId: number;
          quantity: number;
        }[] = [];

        // Lock inventory rows and validate reserved stock
        for (const item of validatedItems) {
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
              WHERE "productId" = ${item.productId}
              FOR UPDATE
            `;

          if (inventoryRows.length === 0) {
            throw new Error(
              `INVENTORY_NOT_FOUND:${item.productId}`,
            );
          }

          const inventory = inventoryRows[0];

          // Cannot dispatch more than reserved stock
          if (
            item.quantity >
            inventory.reservedQuantity
          ) {
            throw new Error(
              `INSUFFICIENT_RESERVED_STOCK:${item.productId}:${inventory.reservedQuantity}`,
            );
          }

          // Physical stock must also be sufficient
          if (
            item.quantity >
            inventory.physicalQuantity
          ) {
            throw new Error(
              `INSUFFICIENT_PHYSICAL_STOCK:${item.productId}:${inventory.physicalQuantity}`,
            );
          }

          dispatchItems.push({
            productId: item.productId,
            quantity: item.quantity,
          });
        }

        // Create dispatch number
        const dispatchNumber = `DSP-${Date.now()}`;

        // Create dispatch
        const dispatch = await tx.dispatch.create({
          data: {
            dispatchNumber,
            salesOrderId: salesOrder.id,
            vehicleNumber,
            driverName,
            items: {
              create: dispatchItems,
            },
          },
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        });

        // Update inventory
        for (const item of dispatchItems) {
          await tx.inventory.update({
            where: {
              productId: item.productId,
            },
            data: {
              physicalQuantity: {
                decrement: item.quantity,
              },
              reservedQuantity: {
                decrement: item.quantity,
              },
            },
          });
        }

        // Calculate total dispatched quantity
        // including the dispatch created above
        const totalDispatched =
          await tx.dispatchItem.groupBy({
            by: ["productId"],
            where: {
              dispatch: {
                salesOrderId: salesOrder.id,
              },
            },
            _sum: {
              quantity: true,
            },
          });

        // Check whether every order item has been fully dispatched
        const fullyDispatched =
          salesOrder.items.every(
            (orderItem) => {
              const dispatchedItem =
                totalDispatched.find(
                  (item) =>
                    item.productId ===
                    orderItem.productId,
                );

              const dispatchedQuantity =
                dispatchedItem?._sum.quantity ?? 0;

              return (
                dispatchedQuantity >=
                orderItem.quantity
              );
            },
          );

        // Update sales order status
        const updatedSalesOrder =
          await tx.salesOrder.update({
            where: {
              id: salesOrder.id,
            },
            data: {
              status: fullyDispatched
                ? "DISPATCHED"
                : "CONFIRMED",
            },
          });

        return {
          dispatch,
          salesOrder: updatedSalesOrder,
        };
      },
      {
        isolationLevel: "Serializable",
      },
    );

    return res.status(201).json({
      message: "Dispatch created successfully",
      dispatch: result.dispatch,
      salesOrder: result.salesOrder,
    });
  } catch (error) {
    console.error("Create dispatch error:", error);

    if (error instanceof Error) {
      if (error.message === "SALES_ORDER_NOT_FOUND") {
        return res.status(404).json({
          message: "Sales order not found",
        });
      }

      if (error.message === "SALES_ORDER_CANCELLED") {
        return res.status(400).json({
          message:
            "Cancelled sales orders cannot be dispatched",
        });
      }

      if (error.message === "SALES_ORDER_NOT_READY") {
        return res.status(400).json({
          message:
            "Sales order must be confirmed before dispatch",
        });
      }

      if (
        error.message ===
        "SALES_ORDER_HAS_NO_ITEMS"
      ) {
        return res.status(400).json({
          message:
            "Sales order must contain at least one item",
        });
      }

      if (
        error.message === "INVALID_DISPATCH_ITEM"
      ) {
        return res.status(400).json({
          message:
            "Each dispatch item must have a valid productId and positive integer quantity",
        });
      }

      if (
        error.message.startsWith(
          "PRODUCT_NOT_IN_ORDER:",
        )
      ) {
        return res.status(400).json({
          message:
            "One or more products are not part of the sales order",
        });
      }

      if (
        error.message ===
        "DUPLICATE_DISPATCH_PRODUCT"
      ) {
        return res.status(400).json({
          message:
            "The same product cannot be added more than once",
        });
      }

      if (
        error.message ===
        "MISSING_ORDER_PRODUCT"
      ) {
        return res.status(400).json({
          message:
            "Dispatch must include all products from the sales order",
        });
      }

      if (
        error.message.startsWith(
          "INVENTORY_NOT_FOUND:",
        )
      ) {
        const productId =
          error.message.split(":")[1];

        return res.status(404).json({
          message:
            `Inventory record not found for product ${productId}`,
        });
      }

      if (
        error.message.startsWith(
          "INSUFFICIENT_RESERVED_STOCK:",
        )
      ) {
        const parts =
          error.message.split(":");

        return res.status(409).json({
          message:
            `Cannot dispatch more than reserved stock for product ${parts[1]}`,
          reservedQuantity: Number(parts[2]),
        });
      }

      if (
        error.message.startsWith(
          "INSUFFICIENT_PHYSICAL_STOCK:",
        )
      ) {
        const parts =
          error.message.split(":");

        return res.status(409).json({
          message:
            `Insufficient physical stock for product ${parts[1]}`,
          physicalQuantity: Number(parts[2]),
        });
      }

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
            "Dispatch transaction conflict. Please retry.",
        });
      }
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Get all dispatches
export const getDispatches = async (
  _req: AuthRequest,
  res: Response,
) => {
  try {
    const dispatches =
      await prisma.dispatch.findMany({
        orderBy: {
          createdAt: "desc",
        },
        include: {
          salesOrder: {
            include: {
              customer: true,
            },
          },
          items: {
            include: {
              product: true,
            },
          },
        },
      });

    return res.status(200).json({
      dispatches,
    });
  } catch (error) {
    console.error(
      "Get dispatches error:",
      error,
    );

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Get dispatch by ID
export const getDispatchById = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const dispatchId = Number(req.params.id);

    if (
      !Number.isInteger(dispatchId) ||
      dispatchId <= 0
    ) {
      return res.status(400).json({
        message: "Invalid dispatch ID",
      });
    }

    const dispatch =
      await prisma.dispatch.findUnique({
        where: {
          id: dispatchId,
        },
        include: {
          salesOrder: {
            include: {
              customer: true,
              items: {
                include: {
                  product: true,
                },
              },
            },
          },
          items: {
            include: {
              product: true,
            },
          },
        },
      });

    if (!dispatch) {
      return res.status(404).json({
        message: "Dispatch not found",
      });
    }

    return res.status(200).json({
      dispatch,
    });
  } catch (error) {
    console.error(
      "Get dispatch error:",
      error,
    );

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};