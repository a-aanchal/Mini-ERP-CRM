import { Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { productSchema, productUpdateSchema } from '../validators';
import { AuthRequest } from '../middleware/authMiddleware';

export const getProducts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const category = (req.query.category as string) || '';
    const lowStock = req.query.lowStock === 'true';

    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { productName: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = { equals: category, mode: 'insensitive' };
    }

    if (lowStock) {
      // Prisma filter: currentStock <= minimumStock
      // In raw Prisma, compare fields or fetch all matching lowStock
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    // Apply low stock filter in JS if required
    let filteredProducts = products;
    if (lowStock) {
      filteredProducts = products.filter((p) => p.currentStock <= p.minimumStock);
    }

    return res.status(200).json({
      success: true,
      data: filteredProducts,
      pagination: {
        page,
        limit,
        total: lowStock ? filteredProducts.length : total,
        totalPages: Math.ceil((lowStock ? filteredProducts.length : total) / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validated = productSchema.parse(req.body);

    const existingSku = await prisma.product.findUnique({
      where: { sku: validated.sku },
    });

    if (existingSku) {
      return res.status(409).json({
        success: false,
        message: `Product SKU '${validated.sku}' already exists. SKU must be unique.`,
      });
    }

    const newProduct = await prisma.product.create({
      data: validated,
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: newProduct,
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

export const getProductById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(paramId, 10);
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stockMovements: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { createdBy: { select: { name: true, role: true } } },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${id} not found`,
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(paramId, 10);
    const validated = productUpdateSchema.parse(req.body);

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${id} not found`,
      });
    }

    if (validated.sku && validated.sku !== existing.sku) {
      const duplicate = await prisma.product.findUnique({
        where: { sku: validated.sku },
      });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: `Product SKU '${validated.sku}' is already taken.`,
        });
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: validated,
    });

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct,
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
