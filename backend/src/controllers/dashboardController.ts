import { Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { ChallanStatus } from '../types';

export const getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [
      totalCustomers,
      totalProducts,
      totalChallans,
      draftChallans,
      confirmedChallans,
      allProducts,
      recentChallans,
      recentStockMovements,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.product.count(),
      prisma.challan.count(),
      prisma.challan.count({ where: { status: ChallanStatus.DRAFT } }),
      prisma.challan.count({ where: { status: ChallanStatus.CONFIRMED } }),
      prisma.product.findMany(),
      prisma.challan.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { customerName: true, businessName: true } },
          createdBy: { select: { name: true } },
        },
      }),
      prisma.stockMovement.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { productName: true, sku: true } },
          createdBy: { select: { name: true } },
        },
      }),
    ]);

    const lowStockProducts = allProducts.filter((p) => p.currentStock <= p.minimumStock);

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalCustomers,
          totalProducts,
          lowStockProductsCount: lowStockProducts.length,
          totalChallans,
          draftChallans,
          confirmedChallans,
        },
        lowStockProducts: lowStockProducts.slice(0, 5),
        recentChallans,
        recentStockMovements,
      },
    });
  } catch (error) {
    next(error);
  }
};
