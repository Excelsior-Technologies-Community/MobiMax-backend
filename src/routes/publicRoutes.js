import express from 'express';
import { getPublicAdvertisements } from '../controllers/publicController.js';

const router = express.Router();

router.get('/advertisements', getPublicAdvertisements);

export default router;
