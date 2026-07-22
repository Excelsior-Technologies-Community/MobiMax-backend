import express from 'express';
import multer from 'multer';
import path from 'path';
import { registerPartner, loginPartner, getDashboardStats, getPartnerMe, uploadPartnerDocs, addProduct, getProducts, deleteProduct, toggleProductStock } from '../controllers/partnerController.js';

const router = express.Router();

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

router.post('/signup', registerPartner);
router.post('/login', loginPartner);
router.get('/dashboard-stats', getDashboardStats);

router.get('/me', getPartnerMe);
router.post('/upload-docs', upload.fields([
  { name: 'store_logo', maxCount: 1 },
  { name: 'aadhar_card', maxCount: 1 },
  { name: 'pan_card', maxCount: 1 },
  { name: 'partner_photo', maxCount: 1 }
]), uploadPartnerDocs);

router.post('/products', upload.array('product_images', 5), addProduct);
router.get('/products', getProducts);
router.delete('/products/:id', deleteProduct);
router.patch('/products/:id/toggle-stock', toggleProductStock);

export default router;
