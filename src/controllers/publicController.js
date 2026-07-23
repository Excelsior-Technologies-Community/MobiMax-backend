import db from '../config/db.js';

export const getPublicAdvertisements = async (req, res) => {
  try {
    // 1. Fetch active ads
    const [ads] = await db.execute('SELECT image_url, link_url FROM advertisements WHERE is_active = 1 ORDER BY sort_order ASC, created_at DESC');
    
    // 2. Fetch global settings
    const [settingRows] = await db.execute('SELECT * FROM settings WHERE setting_key IN ("ad_duration", "ad_shuffle", "popup_enabled", "popup_delay", "popup_frequency")');
    const settings = {
      ad_duration: 5000,
      ad_shuffle: 'false',
      popup_enabled: 'true',
      popup_delay: 1000,
      popup_frequency: 'session'
    };
    
    settingRows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });

    return res.status(200).json({ 
      status: 'success', 
      data: {
        advertisements: ads,
        settings: {
          duration: parseInt(settings.ad_duration) || 5000,
          shuffle: settings.ad_shuffle === 'true',
          popup_enabled: settings.popup_enabled,
          popup_delay: parseInt(settings.popup_delay) || 1000,
          popup_frequency: settings.popup_frequency
        }
      } 
    });
  } catch (error) {
    console.error('Error fetching public advertisements:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch advertisements' });
  }
};

export const getPublicProducts = async (req, res) => {
  try {
    const [products] = await db.execute(`
      SELECT p.*, pt.company as partner_name, pt.store_name 
      FROM products p 
      JOIN partners pt ON p.partner_id = pt.id 
      WHERE p.status = 'active' AND pt.status = 'active' AND (pt.is_paused = 0 OR pt.is_paused IS NULL)
      ORDER BY p.created_at DESC
    `);
    
    return res.status(200).json({ status: 'success', data: products });
  } catch (error) {
    console.error('Error fetching public products:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch products' });
  }
};

export const getStoresByCategory = async (req, res) => {
  try {
    const { categoryName } = req.params;
    const [stores] = await db.execute(`
      SELECT DISTINCT pt.id, pt.company, pt.store_name, pt.store_logo, pt.store_city as city, pt.store_address 
      FROM partners pt 
      JOIN products p ON pt.id = p.partner_id 
      WHERE pt.status = 'active' AND (pt.is_paused = 0 OR pt.is_paused IS NULL) AND p.status = 'active' AND p.category = ?
    `, [categoryName]);
    
    return res.status(200).json({ status: 'success', data: stores });
  } catch (error) {
    console.error('Error fetching stores by category:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch stores' });
  }
};

export const getStoreProductsByCategory = async (req, res) => {
  try {
    const { storeId, categoryName } = req.params;
    
    // Get store info
    const [storeInfo] = await db.execute(`
      SELECT id, company, store_name, store_logo, store_city as city 
      FROM partners 
      WHERE id = ? AND status = 'active' AND (is_paused = 0 OR is_paused IS NULL)
    `, [storeId]);

    if (storeInfo.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Store not found' });
    }

    // Get products
    const [products] = await db.execute(`
      SELECT * 
      FROM products 
      WHERE partner_id = ? AND category = ? AND status = 'active'
    `, [storeId, categoryName]);
    
    return res.status(200).json({ 
      status: 'success', 
      data: {
        store: storeInfo[0],
        products
      } 
    });
  } catch (error) {
    console.error('Error fetching store products:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch store products' });
  }
};

export const getPublicProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get product info
    const [products] = await db.execute(`
      SELECT p.*, pt.company as partner_name, pt.store_name, pt.store_logo, pt.store_city, pt.email as partner_email
      FROM products p 
      JOIN partners pt ON p.partner_id = pt.id 
      WHERE p.id = ? AND p.status = 'active' AND pt.status = 'active' AND (pt.is_paused = 0 OR pt.is_paused IS NULL)
    `, [id]);
    
    if (products.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Product not found or unavailable' });
    }
    
    return res.status(200).json({ status: 'success', data: products[0] });
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch product details' });
  }
};

import { getIO } from '../socket.js';

export const submitStoreContact = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { name, email, phone, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ status: 'error', message: 'Name, email, and message are required' });
    }
    
    const [result] = await db.execute(
      'INSERT INTO store_contact_messages (partner_id, name, email, phone, message) VALUES (?, ?, ?, ?, ?)',
      [partnerId, name, email, phone || null, message]
    );
    
    // Emit socket event to partner
    getIO().emit('new_store_contact', {
      id: result.insertId,
      partner_id: parseInt(partnerId, 10),
      name,
      email,
      phone,
      message,
      status: 'unread',
      created_at: new Date().toISOString()
    });
    
    return res.status(201).json({ status: 'success', message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error submitting store contact:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to send message' });
  }
};

export const submitBulkOrder = async (req, res) => {
  try {
    const { id } = req.params; // product_id
    const { name, email, phone, quantity, message } = req.body;
    
    if (!name || !email || !phone || !quantity) {
      return res.status(400).json({ status: 'error', message: 'Name, email, phone, and quantity are required' });
    }
    
    // Find the product and partner_id
    const [products] = await db.execute('SELECT partner_id FROM products WHERE id = ?', [id]);
    if (products.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }
    
    const partnerId = products[0].partner_id;
    
    const [result] = await db.execute(
      'INSERT INTO bulk_orders (partner_id, product_id, name, email, phone, quantity, message) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [partnerId, id, name, email, phone, quantity, message || null]
    );
    
    // Emit socket event to partner
    getIO().emit('new_bulk_order', {
      id: result.insertId,
      partner_id: partnerId,
      product_id: parseInt(id, 10),
      name,
      email,
      phone,
      quantity,
      message,
      status: 'pending',
      created_at: new Date().toISOString()
    });
    
    return res.status(201).json({ status: 'success', message: 'Bulk order requested successfully' });
  } catch (error) {
    console.error('Error submitting bulk order:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to submit bulk order' });
  }
};

