import prisma from '../config/prisma';
import { ChallanStatus, MovementType } from '../types';
import { AppError } from '../middleware/errorHandler';

export async function generateChallanNumber(): Promise<string> {
  const lastChallan = await prisma.challan.findFirst({
    orderBy: { id: 'desc' },
    select: { id: true, challanNumber: true },
  });

  let nextId = 1;
  if (lastChallan) {
    const match = lastChallan.challanNumber.match(/CH-(\d+)/);
    if (match) {
      nextId = parseInt(match[1], 10) + 1;
    } else {
      nextId = lastChallan.id + 1;
    }
  }

  return `CH-${String(nextId).padStart(5, '0')}`;
}

export async function createChallan(
  userId: number,
  data: {
    customerId: number;
    items: { productId: number; quantity: number }[];
    status?: ChallanStatus;
  }
) {
  // Validate customer existence
  const customer = await prisma.customer.findUnique({
    where: { id: data.customerId },
  });
  if (!customer) {
    throw new AppError(`Customer with ID ${data.customerId} not found`, 404);
  }

  // Fetch products and prepare snapshots
  const productIds = data.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  const itemsToCreate: {
    productId: number;
    productNameSnapshot: string;
    skuSnapshot: string;
    unitPriceSnapshot: number;
    quantity: number;
  }[] = [];
  let totalQuantity = 0;

  for (const item of data.items) {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new AppError(`Product with ID ${item.productId} not found`, 404);
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

  const challanNumber = await generateChallanNumber();
  const requestedStatus = data.status || ChallanStatus.DRAFT;

  if (requestedStatus === ChallanStatus.CONFIRMED) {
    // If created directly as CONFIRMED, run transaction & stock checks
    return await prisma.$transaction(async (tx) => {
      // Validate stock for all products
      for (const item of data.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new AppError(`Product with ID ${item.productId} not found`, 404);
        }

        if (product.currentStock < item.quantity) {
          const err = new AppError(
            `Insufficient stock for ${product.productName}`,
            400
          );
          (err as any).available = product.currentStock;
          (err as any).requested = item.quantity;
          throw err;
        }
      }

      // Create Challan
      const newChallan = await tx.challan.create({
        data: {
          challanNumber,
          customerId: data.customerId,
          totalQuantity,
          status: ChallanStatus.CONFIRMED,
          createdById: userId,
          items: {
            create: itemsToCreate,
          },
        },
        include: {
          customer: true,
          createdBy: { select: { id: true, name: true, email: true, role: true } },
          items: { include: { product: true } },
        },
      });

      // Deduct stock and create stock movement logs
      for (const item of data.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { decrement: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            movementType: MovementType.OUT,
            reason: `Sales Challan ${challanNumber}`,
            createdById: userId,
          },
        });
      }

      return newChallan;
    });
  } else {
    // Create DRAFT or CANCELLED challan without reducing stock
    const newChallan = await prisma.challan.create({
      data: {
        challanNumber,
        customerId: data.customerId,
        totalQuantity,
        status: requestedStatus,
        createdById: userId,
        items: {
          create: itemsToCreate,
        },
      },
      include: {
        customer: true,
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        items: { include: { product: true } },
      },
    });

    return newChallan;
  }
}

export async function confirmChallan(challanId: number, userId: number) {
  const existingChallan = await prisma.challan.findUnique({
    where: { id: challanId },
    include: { items: true },
  });

  if (!existingChallan) {
    throw new AppError(`Sales Challan #${challanId} not found`, 404);
  }

  if (existingChallan.status === ChallanStatus.CONFIRMED) {
    throw new AppError(`Challan ${existingChallan.challanNumber} is already confirmed`, 400);
  }

  if (existingChallan.status === ChallanStatus.CANCELLED) {
    throw new AppError(`Cancelled challan ${existingChallan.challanNumber} cannot be confirmed`, 400);
  }

  // Transaction for Stock Validation and Movement
  return await prisma.$transaction(async (tx) => {
    // 1. Fetch current stock & validate sufficiency for all items
    for (const item of existingChallan.items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new AppError(`Product ID ${item.productId} not found`, 404);
      }

      if (product.currentStock < item.quantity) {
        const err = new AppError(
          `Insufficient stock for ${product.productName}`,
          400
        );
        (err as any).available = product.currentStock;
        (err as any).requested = item.quantity;
        throw err;
      }
    }

    // 2. Reduce stock & record OUT movements
    for (const item of existingChallan.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { currentStock: { decrement: item.quantity } },
      });

      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          movementType: MovementType.OUT,
          reason: `Sales Challan ${existingChallan.challanNumber}`,
          createdById: userId,
        },
      });
    }

    // 3. Mark Challan as CONFIRMED
    const updatedChallan = await tx.challan.update({
      where: { id: challanId },
      data: { status: ChallanStatus.CONFIRMED },
      include: {
        customer: true,
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        items: { include: { product: true } },
      },
    });

    return updatedChallan;
  });
}
