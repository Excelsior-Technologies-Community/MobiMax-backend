import express from 'express';
import { registerPartner, loginPartner } from '../controllers/partnerController.js';

const router = express.Router();

router.post('/signup', registerPartner);
router.post('/login', loginPartner);

export default router;
