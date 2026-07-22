import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import db from '../config/db.js';
import { sendWelcomeEmail } from '../services/emailService.js';
import { getIO } from '../socket.js';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';


export const registerPartner = async (req, res) => {
  const { company, name, email, phone, password } = req.body;

  try {
    // Check if partner already exists
    const [existingPartners] = await db.execute('SELECT * FROM partners WHERE email = ?', [email]);
    if (existingPartners.length > 0) {
      return res.status(400).json({ status: 'error', message: 'Partner already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert partner
    const [result] = await db.execute(
      'INSERT INTO partners (company, name, email, phone, password) VALUES (?, ?, ?, ?, ?)',
      [company, name, email, phone, hashedPassword]
    );

    // Generate JWT
    const payload = { id: result.insertId, company, name, email, role: 'partner', status: 'pending' };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_super_secret_key_123', { expiresIn: '24h' });

    // Send Welcome Email asynchronously
    sendWelcomeEmail(email, name, 'partner');

    // Emit socket event
    getIO().emit('partner_registered', {
      id: result.insertId,
      company,
      name,
      email,
      phone,
      status: 'pending',
      created_at: new Date().toISOString()
    });

    res.status(201).json({ status: 'success', message: 'Partner registered successfully', token, partner: payload });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ status: 'error', message: 'An error occurred during registration' });
  }
};

export const loginPartner = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [partners] = await db.execute('SELECT * FROM partners WHERE email = ?', [email]);
    if (partners.length === 0) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    const partner = partners[0];

    if (partner.status === 'suspended') {
      return res.status(403).json({ status: 'error', message: 'Account is suspended' });
    }
    
    if (partner.status === 'pending' || partner.status === 'under_review') {
      return res.status(403).json({ status: 'error', message: 'Your application is currently under review by the administrator.' });
    }

    const isPasswordValid = await bcrypt.compare(password, partner.password);

    if (!isPasswordValid) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    // Generate JWT
    const payload = { id: partner.id, company: partner.company, name: partner.name, email: partner.email, role: 'partner', status: partner.status };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_super_secret_key_123', { expiresIn: '24h' });

    res.status(200).json({ status: 'success', message: 'Login successful', token, partner: payload });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ status: 'error', message: 'An error occurred during login' });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    // Optionally verify token if provided in header
    let partnerId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_super_secret_key_123');
        partnerId = decoded.id;
      } catch (err) {
        console.error('Invalid token', err);
      }
    }

    // Return simulated dynamic data
    // Randomize slightly so it looks dynamic on refresh
    const randomEarnings = (Math.random() * 500 + 100).toFixed(2);
    const randomOrders = Math.floor(Math.random() * 20) + 5;
    
    const simulatedData = {
      todayEarnings: randomEarnings,
      earningsGrowth: 14.5, // static for now
      activeOrders: randomOrders,
      newOrdersCount: 2,
      rating: 4.8,
      recentActivity: [
        {
          id: 1,
          type: 'new_order',
          title: 'New Order #8924',
          description: 'Spicy Chicken Wrap, Fries x2',
          time: '2 mins ago'
        },
        {
          id: 2,
          type: 'completed',
          title: 'Order #8923 Completed',
          description: 'Picked up by rider',
          time: '15 mins ago'
        }
      ]
    };

    res.status(200).json({ status: 'success', data: simulatedData });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ status: 'error', message: 'An error occurred while fetching stats' });
  }
};

export const getPartnerMe = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_super_secret_key_123');
    
    const [partners] = await db.execute('SELECT id, company, name, email, phone, status, aadhar_card, pan_card, partner_photo, store_name, store_category, store_address, store_country, store_state, store_city, store_pincode, aadhar_number, pan_number, store_logo FROM partners WHERE id = ?', [decoded.id]);
    
    if (partners.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Partner not found' });
    }
    
    res.status(200).json({ status: 'success', partner: partners[0] });
  } catch (error) {
    console.error('getPartnerMe error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch partner data' });
  }
};

export const uploadPartnerDocs = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_super_secret_key_123');
    const partnerId = decoded.id;

    const { store_name, store_category, store_address, store_country, store_state, store_city, store_pincode, aadhar_number, pan_number } = req.body;

    if (!req.files || !req.files.aadhar_card || !req.files.pan_card || !req.files.partner_photo || !req.files.store_logo) {
      return res.status(400).json({ status: 'error', message: 'All 4 documents (including store logo) are required' });
    }

    if (!store_name || !store_category || !store_address || !store_country || !store_state || !store_city || !store_pincode || !aadhar_number || !pan_number) {
      return res.status(400).json({ status: 'error', message: 'All store and owner details are required' });
    }

    const uploadToCloudinary = async (fileArray, folder) => {
      if (!fileArray || fileArray.length === 0) return null;
      const file = fileArray[0];
      try {
        const result = await cloudinary.uploader.upload(file.path, { folder });
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        return result.secure_url;
      } catch (err) {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        throw err;
      }
    };

    const aadharUrl = await uploadToCloudinary(req.files.aadhar_card, 'mobimax_partner_docs');
    const panUrl = await uploadToCloudinary(req.files.pan_card, 'mobimax_partner_docs');
    const photoUrl = await uploadToCloudinary(req.files.partner_photo, 'mobimax_partner_docs');
    const logoUrl = await uploadToCloudinary(req.files.store_logo, 'mobimax_partner_docs');

    await db.execute(
      'UPDATE partners SET aadhar_card = ?, pan_card = ?, partner_photo = ?, store_name = ?, store_category = ?, store_address = ?, store_country = ?, store_state = ?, store_city = ?, store_pincode = ?, aadhar_number = ?, pan_number = ?, store_logo = ?, status = ? WHERE id = ?',
      [aadharUrl, panUrl, photoUrl, store_name, store_category, store_address, store_country, store_state, store_city, store_pincode, aadhar_number, pan_number, logoUrl, 'under_review', partnerId]
    );

    getIO().emit('partner_status_updated', { 
      id: partnerId, 
      status: 'under_review',
      store_name,
      store_category,
      store_address,
      store_country,
      store_state,
      store_city,
      store_pincode,
      aadhar_number,
      pan_number,
      store_logo: logoUrl,
      aadhar_card: aadharUrl,
      pan_card: panUrl,
      partner_photo: photoUrl
    });

    res.status(200).json({ 
      status: 'success', 
      message: 'Documents uploaded successfully. Waiting for admin approval.',
      data: { status: 'under_review' }
    });

  } catch (error) {
    console.error('uploadPartnerDocs error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to upload documents' });
  }
};

export const addProduct = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_super_secret_key_123');
    const partnerId = decoded.id;

    const { title, description, price, oldPrice, category } = req.body;

    if (!title || !price || !category) {
      return res.status(400).json({ status: 'error', message: 'Title, price, and category are required' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ status: 'error', message: 'At least one product image is required' });
    }

    // Upload all files to Cloudinary
    const uploadPromises = req.files.map(file => {
      return cloudinary.uploader.upload(file.path, { folder: 'products' });
    });
    
    const uploadResults = await Promise.all(uploadPromises);
    const imageUrls = uploadResults.map(result => result.secure_url);
    
    // First image acts as primary cover image
    const primaryImageUrl = imageUrls[0];
    const imagesJson = JSON.stringify(imageUrls);

    // Clean up local temp files
    req.files.forEach(file => {
      fs.unlinkSync(file.path);
    });

    const [result] = await db.execute(
      `INSERT INTO products (partner_id, title, description, price, oldPrice, category, image_url, images_json) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        partnerId,
        title,
        description || '',
        parseFloat(price),
        oldPrice ? parseFloat(oldPrice) : null,
        category,
        primaryImageUrl,
        imagesJson
      ]
    );

    res.status(201).json({ status: 'success', message: 'Product added successfully', data: { id: result.insertId } });
  } catch (error) {
    console.error('addProduct error:', error);
    
    // Clean up local temp files if error occurs
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ status: 'error', message: 'Unauthorized: Invalid or expired token' });
    }
    res.status(500).json({ status: 'error', message: 'Failed to add product' });
  }
};

export const getProducts = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_super_secret_key_123');
    const partnerId = decoded.id;

    const [products] = await db.execute('SELECT * FROM products WHERE partner_id = ? ORDER BY created_at DESC', [partnerId]);
    
    res.status(200).json({ status: 'success', data: products });
  } catch (error) {
    console.error('getProducts error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ status: 'error', message: 'Unauthorized: Invalid or expired token' });
    }
    res.status(500).json({ status: 'error', message: 'Failed to fetch products' });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_super_secret_key_123');
    const partnerId = decoded.id;
    const productId = req.params.id;

    // Optional: check if the product belongs to the partner
    const [existing] = await db.execute('SELECT id FROM products WHERE id = ? AND partner_id = ?', [productId, partnerId]);
    if (existing.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Product not found or unauthorized' });
    }

    await db.execute('DELETE FROM products WHERE id = ? AND partner_id = ?', [productId, partnerId]);
    
    res.status(200).json({ status: 'success', message: 'Product deleted successfully' });
  } catch (error) {
    console.error('deleteProduct error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ status: 'error', message: 'Unauthorized: Invalid or expired token' });
    }
    res.status(500).json({ status: 'error', message: 'Failed to delete product' });
  }
};

export const toggleProductStock = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_super_secret_key_123');
    const partnerId = decoded.id;
    const productId = req.params.id;

    // First check if product belongs to partner
    const [existing] = await db.execute('SELECT id, in_stock FROM products WHERE id = ? AND partner_id = ?', [productId, partnerId]);
    if (existing.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Product not found or unauthorized' });
    }

    const currentStockStatus = existing[0].in_stock;
    const newStockStatus = currentStockStatus ? 0 : 1; // Toggle boolean

    await db.execute('UPDATE products SET in_stock = ? WHERE id = ?', [newStockStatus, productId]);
    
    res.status(200).json({ status: 'success', message: 'Stock status updated successfully', in_stock: newStockStatus === 1 });
  } catch (error) {
    console.error('toggleProductStock error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ status: 'error', message: 'Unauthorized: Invalid or expired token' });
    }
    res.status(500).json({ status: 'error', message: 'Failed to update stock status' });
  }
};
