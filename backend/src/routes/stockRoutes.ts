import { Router } from 'express';
import { getStockMovements, createStockMovement } from '../controllers/stockController';
import { requireAuth, requireRole } from '../middleware/authMiddleware';
import { Role } from '../types';

const router = Router();

router.use(requireAuth);

// GET /api/stock/movements - ADMIN, WAREHOUSE, ACCOUNTS
router.get('/movements', requireRole(Role.ADMIN, Role.WAREHOUSE, Role.ACCOUNTS), getStockMovements);

// POST /api/stock/movements - ADMIN, WAREHOUSE
router.post('/movements', requireRole(Role.ADMIN, Role.WAREHOUSE), createStockMovement);

export default router;
