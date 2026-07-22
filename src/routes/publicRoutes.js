import express from 'express';
import { getPublicAdvertisements, getPublicProducts, getStoresByCategory, getStoreProductsByCategory } from '../controllers/publicController.js';
import { submitContactForm } from '../controllers/contactController.js';

const router = express.Router();

router.get('/advertisements', getPublicAdvertisements);
router.post('/contact', submitContactForm);
router.get('/products', getPublicProducts);
router.get('/stores/category/:categoryName', getStoresByCategory);
router.get('/store/:storeId/products/:categoryName', getStoreProductsByCategory);

export default router;
