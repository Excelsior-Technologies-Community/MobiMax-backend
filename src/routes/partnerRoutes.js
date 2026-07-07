import express from 'express';
import { registerPartner, loginPartner, getDashboardStats } from '../controllers/partnerController.js';

const router = express.Router();

router.post('/signup', registerPartner);
router.post('/login', loginPartner);
router.get('/dashboard-stats', getDashboardStats);

export default router;
