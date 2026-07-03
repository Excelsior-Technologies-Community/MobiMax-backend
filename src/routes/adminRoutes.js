import express from 'express';
import { loginAdmin, getUsers, getPartners, updateUserStatus, updatePartnerStatus } from '../controllers/adminController.js';

const router = express.Router();

// @route   POST /api/admin/login
// @desc    Authenticate master admin
router.post('/login', loginAdmin);

// User Management
router.get('/users', getUsers);
router.put('/users/:id/status', updateUserStatus);

// Partner Management
router.get('/partners', getPartners);
router.put('/partners/:id/status', updatePartnerStatus);

export default router;
