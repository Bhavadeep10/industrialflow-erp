import { Response } from "express";
import { PrismaClient, EnquiryStatus } from "@prisma/client";
import { AuthRequest } from "../middleware/authMiddleware";

const prisma = new PrismaClient();

// Create enquiry
export const createEnquiry = async (
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
      customerId,
      requiredDate,
      notes,
      items,
    } = req.body;

    // Validate required fields
    if (
      !customerId ||
      !requiredDate ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        message:
          "customerId, requiredDate and at least one item are required",
      });
    }

    const parsedCustomerId = Number(customerId);

    if (
      !Number.isInteger(parsedCustomerId) ||
      parsedCustomerId <= 0
    ) {
      return res.status(400).json({
        message: "Invalid customer ID",
      });
    }

    const parsedRequiredDate = new Date(requiredDate);

    if (Number.isNaN(parsedRequiredDate.getTime())) {
      return res.status(400).json({
        message: "Invalid requiredDate",
      });
    }

    // Check customer exists
    const customer = await prisma.customer.findUnique({
      where: {
        id: parsedCustomerId,
      },
    });

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    // Validate enquiry items
    const validatedItems: {
      productId: number;
      quantity: number;
    }[] = [];

    const productIds = new Set<number>();

    for (const item of items) {
      const productId = Number(item.productId);
      const quantity = Number(item.quantity);

      if (
        !Number.isInteger(productId) ||
        productId <= 0 ||
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        return res.status(400).json({
          message:
            "Each item must have a valid productId and positive integer quantity",
        });
      }

      if (productIds.has(productId)) {
        return res.status(400).json({
          message:
            "The same product cannot be added more than once",
        });
      }

      productIds.add(productId);

      validatedItems.push({
        productId,
        quantity,
      });
    }

    // Verify all products exist
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: Array.from(productIds),
        },
      },
      select: {
        id: true,
        productCode: true,
        productName: true,
      },
    });

    if (products.length !== validatedItems.length) {
      return res.status(400).json({
        message: "One or more products do not exist",
      });
    }

    // Generate enquiry number
    const enquiryNumber = `ENQ-${Date.now()}`;

    // Create enquiry and items in one transaction
    const enquiry = await prisma.$transaction(async (tx) => {
      return tx.enquiry.create({
        data: {
          enquiryNumber,
          customerId: parsedCustomerId,
          createdById: req.user!.userId,
          enquiryDate: new Date(),
          requiredDate: parsedRequiredDate,
          notes: notes || null,
          status: EnquiryStatus.NEW,
          items: {
            create: validatedItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          },
        },
        include: {
          customer: true,
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
    });

    return res.status(201).json({
      message: "Enquiry created successfully",
      enquiry,
    });
  } catch (error) {
    console.error("Create enquiry error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Get all enquiries
export const getEnquiries = async (
  _req: AuthRequest,
  res: Response,
) => {
  try {
    const enquiries = await prisma.enquiry.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        customer: true,
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
      enquiries,
    });
  } catch (error) {
    console.error("Get enquiries error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Get enquiry by ID
export const getEnquiryById = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const enquiryId = Number(req.params.id);

    if (!Number.isInteger(enquiryId) || enquiryId <= 0) {
      return res.status(400).json({
        message: "Invalid enquiry ID",
      });
    }

    const enquiry = await prisma.enquiry.findUnique({
      where: {
        id: enquiryId,
      },
      include: {
        customer: true,
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

    if (!enquiry) {
      return res.status(404).json({
        message: "Enquiry not found",
      });
    }

    return res.status(200).json({
      enquiry,
    });
  } catch (error) {
    console.error("Get enquiry error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Update enquiry status
export const updateEnquiryStatus = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const enquiryId = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(enquiryId) || enquiryId <= 0) {
      return res.status(400).json({
        message: "Invalid enquiry ID",
      });
    }

    const allowedStatuses = Object.values(EnquiryStatus);

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid enquiry status",
      });
    }

    const existingEnquiry = await prisma.enquiry.findUnique({
      where: {
        id: enquiryId,
      },
    });

    if (!existingEnquiry) {
      return res.status(404).json({
        message: "Enquiry not found",
      });
    }

    const enquiry = await prisma.enquiry.update({
      where: {
        id: enquiryId,
      },
      data: {
        status,
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return res.status(200).json({
      message: "Enquiry status updated successfully",
      enquiry,
    });
  } catch (error) {
    console.error("Update enquiry status error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};