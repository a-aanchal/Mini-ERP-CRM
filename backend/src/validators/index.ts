import { z } from 'zod';
import { CustomerType, CustomerStatus, MovementType, ChallanStatus, Role } from '../types';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.nativeEnum(Role).default(Role.SALES),
});

export const customerSchema = z.object({
  customerName: z.string().min(2, 'Customer name must be at least 2 characters'),
  mobileNumber: z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid mobile number format (10-15 digits required)'),
  email: z.string().email('Invalid email address format'),
  businessName: z.string().min(2, 'Business name is required'),
  gstNumber: z.string().optional().nullable(),
  customerType: z.nativeEnum(CustomerType).default(CustomerType.RETAIL),
  address: z.string().min(3, 'Address is required'),
  status: z.nativeEnum(CustomerStatus).default(CustomerStatus.LEAD),
  followUpDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const followUpSchema = z.object({
  notes: z.string().min(2, 'Follow-up note content is required'),
  followUpDate: z.string().optional().nullable(),
});

export const productSchema = z.object({
  productName: z.string().min(2, 'Product name is required'),
  sku: z.string().min(2, 'SKU code is required'),
  category: z.string().min(2, 'Category is required'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
  currentStock: z.number().int().min(0, 'Stock cannot be negative').default(0),
  minimumStock: z.number().int().min(0, 'Minimum stock cannot be negative').default(5),
  warehouseLocation: z.string().min(1, 'Warehouse location is required'),
});

export const productUpdateSchema = productSchema.partial();

export const stockMovementSchema = z.object({
  productId: z.number().int().positive('Valid Product ID is required'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  movementType: z.nativeEnum(MovementType),
  reason: z.string().min(2, 'Reason for movement is required'),
});

export const challanItemSchema = z.object({
  productId: z.number().int().positive('Product ID is required'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
});

export const challanCreateSchema = z.object({
  customerId: z.number().int().positive('Customer ID is required'),
  items: z.array(challanItemSchema).min(1, 'Challan must contain at least one item'),
  status: z.nativeEnum(ChallanStatus).default(ChallanStatus.DRAFT),
});

export const challanUpdateSchema = z.object({
  customerId: z.number().int().positive('Customer ID is required').optional(),
  items: z.array(challanItemSchema).min(1, 'Challan must contain at least one item').optional(),
  status: z.nativeEnum(ChallanStatus).optional(),
});
