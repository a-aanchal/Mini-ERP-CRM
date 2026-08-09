import { Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { stockMovementSchema } from '../validators';
import { AuthRequest } from '../middleware/authMiddleware';
import { MovementType } from '../types';

export const getStockMovements = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const productId = req.query.productId ? parseInt(req.query.productId as string, 10) : undefined;
    const type = req.query.type as MovementType | undefined;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (productId) {
      where.productId = productId;
    }

    if (type) {
      where.movementType = type;
    }

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { id: true, productName: true, sku: true, currentStock: true },
          },
          createdBy: {
            select: { id: true, name: true, role: true },
          },
        },
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: movements,
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

export const createStockMovement = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const validated = stockMovementSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: validated.productId },
      });

      if (!product) {
        return { error: `Product with ID ${validated.productId} not found`, status: 404 };
      }

      if (validated.movementType === MovementType.OUT) {
        if (product.currentStock < validated.quantity) {
          return {
            error: `Insufficient stock for ${product.productName}`,
            status: 400,
            available: product.currentStock,
            requested: validated.quantity,
          };
        }

        await tx.product.update({
          where: { id: validated.productId },
          data: { currentStock: { decrement: validated.quantity } },
        });
      } else {
        // IN Movement
        await tx.product.update({
          where: { id: validated.productId },
          data: { currentStock: { increment: validated.quantity } },
        });
      }

      const movement = await tx.stockMovement.create({
        data: {
          productId: validated.productId,
          quantity: validated.quantity,
          movementType: validated.movementType,
          reason: validated.reason,
          createdById: userId,
        },
        include: {
          product: { select: { id: true, productName: true, sku: true, currentStock: true } },
          createdBy: { select: { id: true, name: true, role: true } },
        },
      });

      return { movement };
    });

    if (result.error) {
      return res.status(result.status || 400).json({
        success: false,
        message: result.error,
        ...(result.available !== undefined && { available: result.available, requested: result.requested }),
      });
    }

    return res.status(201).json({
      success: true,
      message: `Stock ${validated.movementType === 'IN' ? 'added' : 'removed'} successfully`,
      data: result.movement,
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
