import { Router } from 'express';
import {
  getCustomers,
  createCustomer,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getFollowUps,
  createFollowUp,
} from '../controllers/customerController';
import { requireAuth, requireRole } from '../middleware/authMiddleware';
import { Role } from '../types';

const router = Router();

router.use(requireAuth);

// GET /api/customers - ADMIN, SALES, ACCOUNTS
router.get('/', requireRole(Role.ADMIN, Role.SALES, Role.ACCOUNTS), getCustomers);

// POST /api/customers - ADMIN, SALES
router.post('/', requireRole(Role.ADMIN, Role.SALES), createCustomer);

// GET /api/customers/:id - ADMIN, SALES, ACCOUNTS
router.get('/:id', requireRole(Role.ADMIN, Role.SALES, Role.ACCOUNTS), getCustomerById);

// PUT /api/customers/:id - ADMIN, SALES
router.put('/:id', requireRole(Role.ADMIN, Role.SALES), updateCustomer);

// DELETE /api/customers/:id - ADMIN only
router.delete('/:id', requireRole(Role.ADMIN), deleteCustomer);

// GET /api/customers/:id/followups - ADMIN, SALES, ACCOUNTS
router.get('/:id/followups', requireRole(Role.ADMIN, Role.SALES, Role.ACCOUNTS), getFollowUps);

// POST /api/customers/:id/followups - ADMIN, SALES
router.post('/:id/followups', requireRole(Role.ADMIN, Role.SALES), createFollowUp);

export default router;
