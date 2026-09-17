import { Response } from "express";
import { PrismaClient, QuotationStatus } from "@prisma/client";
import { AuthRequest } from "../middleware/authMiddleware";

const prisma = new PrismaClient();

// Create quotation from an enquiry
export const createQuotation = async (
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
      enquiryId,
      validUntil,
      items,
    } = req.body;

    // Validate required fields
    if (
      !enquiryId ||
      !validUntil ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        message:
          "enquiryId, validUntil and at least one item are required",
      });
    }

    const parsedEnquiryId = Number(enquiryId);

    if (
      !Number.isInteger(parsedEnquiryId) ||
      parsedEnquiryId <= 0
    ) {
      return res.status(400).json({
        message: "Invalid enquiry ID",
      });
    }

    const parsedValidUntil = new Date(validUntil);

    if (Number.isNaN(parsedValidUntil.getTime())) {
      return res.status(400).json({
        message: "Invalid validUntil date",
      });
    }

    // Get enquiry
    const enquiry = await prisma.enquiry.findUnique({
      where: {
        id: parsedEnquiryId,
      },
      include: {
        customer: true,
        items: true,
      },
    });

    if (!enquiry) {
      return res.status(404).json({
        message: "Enquiry not found",
      });
    }

    // Only NEW or QUOTED enquiries can receive quotations
    if (
      enquiry.status !== "NEW" &&
      enquiry.status !== "QUOTED"
    ) {
      return res.status(400).json({
        message:
          "Quotation can only be created for NEW or QUOTED enquiries",
      });
    }

    // Validate quotation items
    const validatedItems: {
      productId: number;
      quantity: number;
      unitPrice: number;
      discountPct: number;
      gstPct: number;
      lineAmount: number;
    }[] = [];

    const enquiryProductIds = new Set(
      enquiry.items.map((item) => item.productId),
    );

    const quotationProductIds = new Set<number>();

    for (const item of items) {
      const productId = Number(item.productId);
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      const discountPct =
        item.discountPct === undefined
          ? 0
          : Number(item.discountPct);
      const gstPct =
        item.gstPct === undefined
          ? 0
          : Number(item.gstPct);

      if (
        !Number.isInteger(productId) ||
        productId <= 0 ||
        !Number.isInteger(quantity) ||
        quantity <= 0 ||
        !Number.isFinite(unitPrice) ||
        unitPrice < 0 ||
        !Number.isFinite(discountPct) ||
        discountPct < 0 ||
        discountPct > 100 ||
        !Number.isFinite(gstPct) ||
        gstPct < 0 ||
        gstPct > 100
      ) {
        return res.status(400).json({
          message:
            "Each item must have valid productId, positive quantity, valid unitPrice, discountPct and gstPct",
        });
      }

      // Product must belong to the original enquiry
      if (!enquiryProductIds.has(productId)) {
        return res.status(400).json({
          message:
            `Product ${productId} is not part of the original enquiry`,
        });
      }

      // Prevent duplicate products
      if (quotationProductIds.has(productId)) {
        return res.status(400).json({
          message:
            "The same product cannot be added more than once",
        });
      }

      quotationProductIds.add(productId);

      // Backend calculates the quotation line amount
      const grossAmount = quantity * unitPrice;
      const discountAmount =
        grossAmount * (discountPct / 100);
      const taxableAmount = grossAmount - discountAmount;
      const gstAmount = taxableAmount * (gstPct / 100);
      const lineAmount = taxableAmount + gstAmount;

      validatedItems.push({
        productId,
        quantity,
        unitPrice,
        discountPct,
        gstPct,
        lineAmount: Number(lineAmount.toFixed(2)),
      });
    }

    // Ensure all enquiry products are included
    if (
      quotationProductIds.size !== enquiryProductIds.size
    ) {
      return res.status(400).json({
        message:
          "Quotation must include all products from the enquiry",
      });
    }

    // Calculate grand total on backend
    const grandTotal = Number(
      validatedItems
        .reduce((total, item) => total + item.lineAmount, 0)
        .toFixed(2),
    );

    // Generate quotation number
    const quotationNumber = `QUO-${Date.now()}`;

    // Create quotation and items in one transaction
    const quotation = await prisma.$transaction(async (tx) => {
      const createdQuotation = await tx.quotation.create({
        data: {
          quotationNumber,
          enquiryId: enquiry.id,
          customerId: enquiry.customerId,
          createdById: req.user!.userId,
          validUntil: parsedValidUntil,
          status: QuotationStatus.DRAFT,
          grandTotal,
          items: {
            create: validatedItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discountPct: item.discountPct,
              gstPct: item.gstPct,
              lineAmount: item.lineAmount,
            })),
          },
        },
        include: {
          customer: true,
          enquiry: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Move enquiry to QUOTED status
      await tx.enquiry.update({
        where: {
          id: enquiry.id,
        },
        data: {
          status: "QUOTED",
        },
      });

      return createdQuotation;
    });

    return res.status(201).json({
      message: "Quotation created successfully",
      quotation,
    });
  } catch (error) {
    console.error("Create quotation error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Get all quotations
export const getQuotations = async (
  _req: AuthRequest,
  res: Response,
) => {
  try {
    const quotations = await prisma.quotation.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        customer: true,
        enquiry: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
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
      quotations,
    });
  } catch (error) {
    console.error("Get quotations error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Get quotation by ID
export const getQuotationById = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const quotationId = Number(req.params.id);

    if (
      !Number.isInteger(quotationId) ||
      quotationId <= 0
    ) {
      return res.status(400).json({
        message: "Invalid quotation ID",
      });
    }

    const quotation = await prisma.quotation.findUnique({
      where: {
        id: quotationId,
      },
      include: {
        customer: true,
        enquiry: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
        salesOrder: true,
      },
    });

    if (!quotation) {
      return res.status(404).json({
        message: "Quotation not found",
      });
    }

    return res.status(200).json({
      quotation,
    });
  } catch (error) {
    console.error("Get quotation error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Update quotation status
export const updateQuotationStatus = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const quotationId = Number(req.params.id);
    const { status } = req.body;

    if (
      !Number.isInteger(quotationId) ||
      quotationId <= 0
    ) {
      return res.status(400).json({
        message: "Invalid quotation ID",
      });
    }

    const allowedStatuses = Object.values(QuotationStatus);

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid quotation status",
      });
    }

    const existingQuotation =
      await prisma.quotation.findUnique({
        where: {
          id: quotationId,
        },
      });

    if (!existingQuotation) {
      return res.status(404).json({
        message: "Quotation not found",
      });
    }

    const quotation = await prisma.quotation.update({
      where: {
        id: quotationId,
      },
      data: {
        status,
      },
      include: {
        customer: true,
        enquiry: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return res.status(200).json({
      message: "Quotation status updated successfully",
      quotation,
    });
  } catch (error) {
    console.error("Update quotation status error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};