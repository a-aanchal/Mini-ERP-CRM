import { Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { challanCreateSchema, challanUpdateSchema } from '../validators';
import { AuthRequest } from '../middleware/authMiddleware';
import { createChallan, confirmChallan } from '../services/challanService';
import { ChallanStatus } from '../types';

export const getChallans = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const status = req.query.status as ChallanStatus | undefined;
    const customerId = req.query.customerId ? parseInt(req.query.customerId as string, 10) : undefined;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { challanNumber: { contains: search, mode: 'insensitive' } },
        { customer: { customerName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    const [challans, total] = await Promise.all([
      prisma.challan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, customerName: true, businessName: true, mobileNumber: true } },
          createdBy: { select: { id: true, name: true, role: true } },
          items: true,
        },
      }),
      prisma.challan.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: challans,
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

export const postChallan = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const validated = challanCreateSchema.parse(req.body);

    const newChallan = await createChallan(userId, validated);

    return res.status(201).json({
      success: true,
      message: `Sales Challan ${newChallan.challanNumber} created successfully (${newChallan.status})`,
      data: newChallan,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    if (error.available !== undefined) {
      return res.status(400).json({
        success: false,
        message: error.message,
        available: error.available,
        requested: error.requested,
      });
    }
    next(error);
  }
};

export const getChallanById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(paramId, 10);
    const challan = await prisma.challan.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        items: {
          include: {
            product: { select: { id: true, productName: true, sku: true, currentStock: true } },
          },
        },
      },
    });

    if (!challan) {
      return res.status(404).json({
        success: false,
        message: `Sales Challan #${id} not found`,
      });
    }

    return res.status(200).json({
      success: true,
      data: challan,
    });
  } catch (error) {
    next(error);
  }
};

export const updateChallan = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(paramId, 10);
    const validated = challanUpdateSchema.parse(req.body);

    const existing = await prisma.challan.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Sales Challan #${id} not found`,
      });
    }

    if (existing.status !== ChallanStatus.DRAFT) {
      return res.status(400).json({
        success: false,
        message: `Only DRAFT challans can be updated. Current status is ${existing.status}`,
      });
    }

    // If updating items in draft, rebuild items with fresh snapshots
    let updateData: any = {};
    if (validated.customerId) {
      updateData.customerId = validated.customerId;
    }

    if (validated.items && validated.items.length > 0) {
      const productIds = validated.items.map((i) => i.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));

      let totalQuantity = 0;
      const itemsToCreate = [];

      for (const item of validated.items) {
        const product = productMap.get(item.productId);
        if (!product) {
          return res.status(404).json({
            success: false,
            message: `Product ID ${item.productId} not found`,
          });
        }
        totalQuantity += item.quantity;
        itemsToCreate.push({
          productId: item.productId,
          productNameSnapshot: product.productName,
          skuSnapshot: product.sku,
          unitPriceSnapshot: product.unitPrice,
          quantity: item.quantity,
        });
      }

      updateData.totalQuantity = totalQuantity;

      // Delete old items and recreate
      await prisma.challanItem.deleteMany({ where: { challanId: id } });
      updateData.items = { create: itemsToCreate };
    }

    const updated = await prisma.challan.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        createdBy: { select: { id: true, name: true, role: true } },
        items: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Sales Challan ${updated.challanNumber} updated successfully`,
      data: updated,
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

export const putConfirmChallan = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(paramId, 10);
    const userId = req.user!.id;

    const confirmed = await confirmChallan(id, userId);

    return res.status(200).json({
      success: true,
      message: `Sales Challan ${confirmed.challanNumber} confirmed successfully. Stock deducted.`,
      data: confirmed,
    });
  } catch (error: any) {
    if (error.available !== undefined) {
      return res.status(400).json({
        success: false,
        message: error.message,
        available: error.available,
        requested: error.requested,
      });
    }
    next(error);
  }
};

export const putCancelChallan = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(paramId, 10);
    const existing = await prisma.challan.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Sales Challan #${id} not found`,
      });
    }

    if (existing.status === ChallanStatus.CONFIRMED) {
      return res.status(400).json({
        success: false,
        message: 'Confirmed challans cannot be cancelled directly.',
      });
    }

    const cancelled = await prisma.challan.update({
      where: { id },
      data: { status: ChallanStatus.CANCELLED },
      include: {
        customer: true,
        items: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Sales Challan ${cancelled.challanNumber} cancelled successfully`,
      data: cancelled,
    });
  } catch (error) {
    next(error);
  }
};
