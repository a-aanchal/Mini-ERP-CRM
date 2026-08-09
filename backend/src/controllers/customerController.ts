import { Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { customerSchema, followUpSchema } from '../validators';
import { AuthRequest } from '../middleware/authMiddleware';
import { CustomerType, CustomerStatus } from '../types';

export const getCustomers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const type = req.query.type as CustomerType | undefined;
    const status = req.query.status as CustomerStatus | undefined;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { mobileNumber: { contains: search, mode: 'insensitive' } },
        { businessName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.customerType = type;
    }

    if (status) {
      where.status = status;
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { challans: true, followUps: true } },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validated = customerSchema.parse(req.body);

    const newCustomer = await prisma.customer.create({
      data: {
        ...validated,
        followUpDate: validated.followUpDate ? new Date(validated.followUpDate) : null,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: newCustomer,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    next(error);
  }
};

export const getCustomerById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(paramId, 10);
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        followUps: {
          orderBy: { createdAt: 'desc' },
          include: { createdBy: { select: { name: true, role: true } } },
        },
        challans: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: `Customer with ID ${id} not found`,
      });
    }

    return res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(paramId, 10);
    const validated = customerSchema.partial().parse(req.body);

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Customer with ID ${id} not found`,
      });
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        ...validated,
        ...(validated.followUpDate !== undefined && {
          followUpDate: validated.followUpDate ? new Date(validated.followUpDate) : null,
        }),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: updatedCustomer,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    next(error);
  }
};

export const deleteCustomer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(paramId, 10);
    const existing = await prisma.customer.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Customer with ID ${id} not found`,
      });
    }

    await prisma.customer.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getFollowUps = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const customerId = parseInt(paramId, 10);
    const followUps = await prisma.followUp.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
      },
    });

    return res.status(200).json({
      success: true,
      data: followUps,
    });
  } catch (error) {
    next(error);
  }
};

export const createFollowUp = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const customerId = parseInt(paramId, 10);
    const userId = req.user!.id;
    const validated = followUpSchema.parse(req.body);

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: `Customer with ID ${customerId} not found`,
      });
    }

    const followUp = await prisma.followUp.create({
      data: {
        customerId,
        notes: validated.notes,
        followUpDate: validated.followUpDate ? new Date(validated.followUpDate) : null,
        createdById: userId,
      },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
      },
    });

    // Optionally update customer followUpDate if provided
    if (validated.followUpDate) {
      await prisma.customer.update({
        where: { id: customerId },
        data: { followUpDate: new Date(validated.followUpDate) },
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Follow-up note added successfully',
      data: followUp,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    next(error);
  }
};
