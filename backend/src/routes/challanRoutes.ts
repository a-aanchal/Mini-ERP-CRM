import { Router } from 'express';
import {
  getChallans,
  postChallan,
  getChallanById,
  updateChallan,
  putConfirmChallan,
  putCancelChallan,
} from '../controllers/challanController';
import { requireAuth, requireRole } from '../middleware/authMiddleware';
import { Role } from '../types';

const router = Router();

router.use(requireAuth);

// GET /api/challans - ADMIN, SALES, WAREHOUSE, ACCOUNTS
router.get('/', requireRole(Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS), getChallans);

// POST /api/challans - ADMIN, SALES
router.post('/', requireRole(Role.ADMIN, Role.SALES), postChallan);

// GET /api/challans/:id - ADMIN, SALES, WAREHOUSE, ACCOUNTS
router.get('/:id', requireRole(Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS), getChallanById);

// PUT /api/challans/:id - ADMIN, SALES
router.put('/:id', requireRole(Role.ADMIN, Role.SALES), updateChallan);

// PUT /api/challans/:id/confirm - ADMIN, SALES
router.put('/:id/confirm', requireRole(Role.ADMIN, Role.SALES), putConfirmChallan);

// PUT /api/challans/:id/cancel - ADMIN, SALES
router.put('/:id/cancel', requireRole(Role.ADMIN, Role.SALES), putCancelChallan);

export default router;
