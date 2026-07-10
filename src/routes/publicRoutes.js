import express from 'express';
import { getPublicAdvertisements } from '../controllers/publicController.js';
import { submitContactForm } from '../controllers/contactController.js';

const router = express.Router();

router.get('/advertisements', getPublicAdvertisements);
router.post('/contact', submitContactForm);

export default router;
