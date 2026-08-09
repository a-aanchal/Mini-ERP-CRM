import { Router } from 'express';
import {
  getProducts,
  createProduct,
  getProductById,
  updateProduct,
} from '../controllers/productController';
import { requireAuth, requireRole } from '../middleware/authMiddleware';
import { Role } from '../types';

const router = Router();

router.use(requireAuth);

// GET /api/products - ADMIN, SALES, WAREHOUSE, ACCOUNTS
router.get('/', requireRole(Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS), getProducts);

// POST /api/products - ADMIN, WAREHOUSE
router.post('/', requireRole(Role.ADMIN, Role.WAREHOUSE), createProduct);

// GET /api/products/:id - ADMIN, SALES, WAREHOUSE, ACCOUNTS
router.get('/:id', requireRole(Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS), getProductById);

// PUT /api/products/:id - ADMIN, WAREHOUSE
router.put('/:id', requireRole(Role.ADMIN, Role.WAREHOUSE), updateProduct);

export default router;
