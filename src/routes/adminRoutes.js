import express from 'express';
import multer from 'multer';
import path from 'path';
import { 
  loginAdmin, 
  getUsers, 
  getPartners, 
  updateUserStatus, 
  updatePartnerStatus, 
  deleteUser, 
  deletePartner,
  getAdvertisements,
  addAdvertisement,
  updateAdvertisementStatus,
  deleteAdvertisement,
  getSettings,
  updateSettings,
  uploadImage
} from '../controllers/adminController.js';

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

// @route   POST /api/admin/login
// @desc    Authenticate master admin
router.post('/login', loginAdmin);

// User Management
router.get('/users', getUsers);
router.put('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

// Partner Management
router.get('/partners', getPartners);
router.put('/partners/:id/status', updatePartnerStatus);
router.delete('/partners/:id', deletePartner);

// Advertisement Management
router.get('/advertisements', getAdvertisements);
router.post('/advertisements', addAdvertisement);
router.put('/advertisements/:id/status', updateAdvertisementStatus);
router.delete('/advertisements/:id', deleteAdvertisement);

// Settings Management
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// Image Upload
router.post('/upload', upload.single('image'), uploadImage);

export default router;
