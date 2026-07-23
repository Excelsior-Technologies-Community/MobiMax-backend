import express from 'express';
import { getPublicAdvertisements, getPublicProducts, getStoresByCategory, getStoreProductsByCategory, getPublicProductById, submitStoreContact, submitBulkOrder } from '../controllers/publicController.js';
import { submitContactForm } from '../controllers/contactController.js';

const router = express.Router();

router.get('/advertisements', getPublicAdvertisements);
router.post('/contact', submitContactForm);
router.get('/products', getPublicProducts);
router.get('/stores/category/:categoryName', getStoresByCategory);
router.get('/store/:storeId/products/:categoryName', getStoreProductsByCategory);
router.get('/product/:id', getPublicProductById);
router.post('/store/:partnerId/contact', submitStoreContact);
router.post('/product/:id/bulk-order', submitBulkOrder);

export default router;
