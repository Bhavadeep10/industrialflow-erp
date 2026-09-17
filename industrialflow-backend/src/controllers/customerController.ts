import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Create customer
export const createCustomer = async (req: Request, res: Response) => {
  try {
    const {
      companyName,
      contactPerson,
      mobile,
      email,
      city,
    } = req.body;

    if (
      !companyName ||
      !contactPerson ||
      !mobile ||
      !email ||
      !city
    ) {
      return res.status(400).json({
        message:
          "companyName, contactPerson, mobile, email and city are required",
      });
    }

    const customer = await prisma.customer.create({
      data: {
        companyName,
        contactPerson,
        mobile,
        email,
        city,
      },
    });

    return res.status(201).json({
      message: "Customer created successfully",
      customer,
    });
  } catch (error) {
    console.error("Create customer error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Get all customers
export const getCustomers = async (_req: Request, res: Response) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      customers,
    });
  } catch (error) {
    console.error("Get customers error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Get customer by ID
export const getCustomerById = async (
  req: Request,
  res: Response,
) => {
  try {
    const customerId = Number(req.params.id);

    if (!Number.isInteger(customerId) || customerId <= 0) {
      return res.status(400).json({
        message: "Invalid customer ID",
      });
    }

    const customer = await prisma.customer.findUnique({
      where: {
        id: customerId,
      },
    });

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      customer,
    });
  } catch (error) {
    console.error("Get customer error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Update customer
export const updateCustomer = async (
  req: Request,
  res: Response,
) => {
  try {
    const customerId = Number(req.params.id);

    if (!Number.isInteger(customerId) || customerId <= 0) {
      return res.status(400).json({
        message: "Invalid customer ID",
      });
    }

    const {
      companyName,
      contactPerson,
      mobile,
      email,
      city,
    } = req.body;

    const existingCustomer = await prisma.customer.findUnique({
      where: {
        id: customerId,
      },
    });

    if (!existingCustomer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    const customer = await prisma.customer.update({
      where: {
        id: customerId,
      },
      data: {
        ...(companyName !== undefined && { companyName }),
        ...(contactPerson !== undefined && { contactPerson }),
        ...(mobile !== undefined && { mobile }),
        ...(email !== undefined && { email }),
        ...(city !== undefined && { city }),
      },
    });

    return res.status(200).json({
      message: "Customer updated successfully",
      customer,
    });
  } catch (error) {
    console.error("Update customer error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};