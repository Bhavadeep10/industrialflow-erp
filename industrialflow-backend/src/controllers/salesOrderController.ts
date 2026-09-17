import { Response } from "express";
import { PrismaClient, SalesOrderStatus } from "@prisma/client";
import { AuthRequest } from "../middleware/authMiddleware";

const prisma = new PrismaClient();

// Create sales order from an accepted quotation
export const createSalesOrder = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const { quotationId } = req.body;

    if (!quotationId) {
      return res.status(400).json({
        message: "quotationId is required",
      });
    }

    const parsedQuotationId = Number(quotationId);

    if (
      !Number.isInteger(parsedQuotationId) ||
      parsedQuotationId <= 0
    ) {
      return res.status(400).json({
        message: "Invalid quotation ID",
      });
    }

    /*
     * Use a transaction so quotation validation and
     * sales-order creation happen together.
     */
    const salesOrder = await prisma.$transaction(async (tx) => {
      // Get quotation with all required relationships
      const quotation = await tx.quotation.findUnique({
        where: {
          id: parsedQuotationId,
        },
        include: {
          items: true,
          salesOrder: true,
        },
      });

      if (!quotation) {
        throw new Error("QUOTATION_NOT_FOUND");
      }

      // Only accepted quotations can become sales orders
      if (quotation.status !== "ACCEPTED") {
        throw new Error("QUOTATION_NOT_ACCEPTED");
      }

      // Database unique constraint also protects against duplicates
      if (quotation.salesOrder) {
        throw new Error("SALES_ORDER_ALREADY_EXISTS");
      }

      if (quotation.items.length === 0) {
        throw new Error("QUOTATION_HAS_NO_ITEMS");
      }

      // Generate order number
      const orderNumber = `SO-${Date.now()}`;

      // Create sales order using quotation data
      const createdOrder = await tx.salesOrder.create({
        data: {
          orderNumber,
          customerId: quotation.customerId,
          quotationId: quotation.id,
          totalAmount: quotation.grandTotal,
          status: SalesOrderStatus.PENDING,
          items: {
            create: quotation.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          },
        },
        include: {
          customer: true,
          quotation: {
            include: {
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

      return createdOrder;
    });

    return res.status(201).json({
      message: "Sales order created successfully",
      salesOrder,
    });
  } catch (error) {
    console.error("Create sales order error:", error);

    if (error instanceof Error) {
      if (error.message === "QUOTATION_NOT_FOUND") {
        return res.status(404).json({
          message: "Quotation not found",
        });
      }

      if (error.message === "QUOTATION_NOT_ACCEPTED") {
        return res.status(400).json({
          message:
            "Sales order can only be created from an accepted quotation",
        });
      }

      if (error.message === "SALES_ORDER_ALREADY_EXISTS") {
        return res.status(409).json({
          message:
            "A sales order already exists for this quotation",
        });
      }

      if (error.message === "QUOTATION_HAS_NO_ITEMS") {
        return res.status(400).json({
          message: "Quotation must contain at least one item",
        });
      }
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Get all sales orders
export const getSalesOrders = async (
  _req: AuthRequest,
  res: Response,
) => {
  try {
    const salesOrders = await prisma.salesOrder.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        customer: true,
        quotation: true,
        items: {
          include: {
            product: true,
          },
        },
        dispatches: true,
      },
    });

    return res.status(200).json({
      salesOrders,
    });
  } catch (error) {
    console.error("Get sales orders error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Get sales order by ID
export const getSalesOrderById = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const salesOrderId = Number(req.params.id);

    if (
      !Number.isInteger(salesOrderId) ||
      salesOrderId <= 0
    ) {
      return res.status(400).json({
        message: "Invalid sales order ID",
      });
    }

    const salesOrder = await prisma.salesOrder.findUnique({
      where: {
        id: salesOrderId,
      },
      include: {
        customer: true,
        quotation: {
          include: {
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
        dispatches: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!salesOrder) {
      return res.status(404).json({
        message: "Sales order not found",
      });
    }

    return res.status(200).json({
      salesOrder,
    });
  } catch (error) {
    console.error("Get sales order error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Update sales order status
export const updateSalesOrderStatus = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const salesOrderId = Number(req.params.id);
    const { status } = req.body;

    if (
      !Number.isInteger(salesOrderId) ||
      salesOrderId <= 0
    ) {
      return res.status(400).json({
        message: "Invalid sales order ID",
      });
    }

    const allowedStatuses = Object.values(SalesOrderStatus);

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid sales order status",
      });
    }

    const existingOrder = await prisma.salesOrder.findUnique({
      where: {
        id: salesOrderId,
      },
    });

    if (!existingOrder) {
      return res.status(404).json({
        message: "Sales order not found",
      });
    }

    const salesOrder = await prisma.salesOrder.update({
      where: {
        id: salesOrderId,
      },
      data: {
        status,
      },
      include: {
        customer: true,
        quotation: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return res.status(200).json({
      message: "Sales order status updated successfully",
      salesOrder,
    });
  } catch (error) {
    console.error("Update sales order status error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};