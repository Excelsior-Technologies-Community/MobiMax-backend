import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import db from '../config/db.js';
import { getIO } from '../socket.js';
import { sendSuspensionEmail, sendPartnerApprovalEmail } from '../services/emailService.js';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

export const loginAdmin = async (req, res) => {
  const { id, email, password } = req.body;
  const loginIdentifier = id || email;

  try {
    // 1. Find user in the database
    // We check both admin_id and email to be flexible
    const [rows] = await db.execute(
      'SELECT * FROM admins WHERE admin_id = ? OR email = ?',
      [loginIdentifier, loginIdentifier]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials. Please check your ID and Password.'
      });
    }

    const adminUser = rows[0];

    // 2. Compare passwords using bcrypt
    const isPasswordValid = await bcrypt.compare(password, adminUser.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials. Please check your ID and Password.'
      });
    }

    // 3. Generate JWT
    const adminPayload = {
      id: adminUser.id,
      name: adminUser.name,
      email: adminUser.admin_id
    };

    const token = jwt.sign(
      adminPayload,
      process.env.JWT_SECRET || 'fallback_super_secret_key_123',
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      status: 'success',
      message: 'Login successful',
      token: token,
      admin: adminPayload
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred during authentication. Please try again.'
    });
  }
};

export const getUsers = async (req, res) => {
  try {
    const [users] = await db.execute('SELECT id, name, email, status, created_at FROM users ORDER BY created_at DESC');
    return res.status(200).json({ status: 'success', data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch users' });
  }
};

export const updateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await db.execute('UPDATE users SET status = ? WHERE id = ?', [status, id]);
    getIO().emit('user_status_updated', { id: parseInt(id), status });
    
    if (status === 'suspended') {
      const [users] = await db.execute('SELECT name, email FROM users WHERE id = ?', [id]);
      if (users.length > 0) {
        sendSuspensionEmail(users[0].email, users[0].name, 'user');
      }
    }
    
    return res.status(200).json({ status: 'success', message: 'User status updated successfully' });
  } catch (error) {
    console.error('Error updating user status:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to update user status' });
  }
};

export const getPartners = async (req, res) => {
  try {
    const [partners] = await db.execute('SELECT id, company, name, email, phone, status, aadhar_card, pan_card, partner_photo, store_name, store_category, store_address, store_country, store_state, store_city, store_pincode, aadhar_number, pan_number, store_logo, created_at FROM partners ORDER BY created_at DESC');
    return res.status(200).json({ status: 'success', data: partners });
  } catch (error) {
    console.error('Error fetching partners:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch partners' });
  }
};

export const updatePartnerStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await db.execute('UPDATE partners SET status = ? WHERE id = ?', [status, id]);
    getIO().emit('partner_status_updated', { id: parseInt(id), status });
    
    if (status === 'suspended') {
      const [partners] = await db.execute('SELECT name, email FROM partners WHERE id = ?', [id]);
      if (partners.length > 0) {
        sendSuspensionEmail(partners[0].email, partners[0].name, 'partner');
      }
    } else if (status === 'active') {
      const [partners] = await db.execute('SELECT name, email FROM partners WHERE id = ?', [id]);
      if (partners.length > 0) {
        sendPartnerApprovalEmail(partners[0].email, partners[0].name);
      }
    }
    
    return res.status(200).json({ status: 'success', message: 'Partner status updated successfully' });
  } catch (error) {
    console.error('Error updating partner status:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to update partner status' });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.execute('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    getIO().emit('user_deleted', { id: parseInt(id) });
    return res.status(200).json({ status: 'success', message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to delete user' });
  }
};

export const deletePartner = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.execute('DELETE FROM partners WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'Partner not found' });
    }
    getIO().emit('partner_deleted', { id: parseInt(id) });
    return res.status(200).json({ status: 'success', message: 'Partner deleted successfully' });
  } catch (error) {
    console.error('Error deleting partner:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to delete partner' });
  }
};

// --- Advertisements ---

export const getAdvertisements = async (req, res) => {
  try {
    const [ads] = await db.execute('SELECT * FROM advertisements ORDER BY sort_order ASC, created_at DESC');
    return res.status(200).json({ status: 'success', data: ads });
  } catch (error) {
    console.error('Error fetching advertisements:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch advertisements' });
  }
};

export const addAdvertisement = async (req, res) => {
  const { image_url, link_url, sort_order } = req.body;
  if (!image_url) {
    return res.status(400).json({ status: 'error', message: 'Image URL is required' });
  }
  
  try {
    const [result] = await db.execute(
      'INSERT INTO advertisements (image_url, link_url, sort_order) VALUES (?, ?, ?)',
      [image_url, link_url || '', sort_order || 0]
    );
    return res.status(201).json({ 
      status: 'success', 
      message: 'Advertisement added successfully',
      data: { id: result.insertId, image_url, link_url, is_active: 1, sort_order: sort_order || 0 }
    });
  } catch (error) {
    console.error('Error adding advertisement:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to add advertisement' });
  }
};

export const updateAdvertisementStatus = async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;
  try {
    await db.execute('UPDATE advertisements SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, id]);
    return res.status(200).json({ status: 'success', message: 'Advertisement status updated' });
  } catch (error) {
    console.error('Error updating advertisement status:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to update advertisement status' });
  }
};

export const deleteAdvertisement = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.execute('DELETE FROM advertisements WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'Advertisement not found' });
    }
    return res.status(200).json({ status: 'success', message: 'Advertisement deleted successfully' });
  } catch (error) {
    console.error('Error deleting advertisement:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to delete advertisement' });
  }
};

// --- Settings ---

export const getSettings = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM settings');
    const settings = {};
    rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    return res.status(200).json({ status: 'success', data: settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch settings' });
  }
};

export const updateSettings = async (req, res) => {
  const { settings } = req.body;
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ status: 'error', message: 'Invalid settings data' });
  }
  
  try {
    for (const [key, value] of Object.entries(settings)) {
      await db.execute(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, String(value), String(value)]
      );
    }
    return res.status(200).json({ status: 'success', message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to update settings' });
  }
};

// --- Uploads ---

export const uploadImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: 'error', message: 'No file uploaded' });
  }
  
  try {
    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'mobimax_advertisements', // Optional: organized folder in Cloudinary
    });

    // Delete the local file after successful upload
    fs.unlinkSync(req.file.path);
    
    return res.status(200).json({ 
      status: 'success', 
      message: 'File uploaded to Cloudinary successfully',
      data: { url: result.secure_url }
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    
    // Attempt to cleanup local file if Cloudinary upload fails
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    return res.status(500).json({ 
      status: 'error', 
      message: 'Failed to upload image to Cloudinary' 
    });
  }
};

// --- Contact Messages ---

export const getContactMessages = async (req, res) => {
  try {
    const [messages] = await db.execute('SELECT * FROM contact_messages ORDER BY created_at DESC');
    return res.status(200).json({ status: 'success', data: messages });
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch contact messages' });
  }
};

export const updateContactMessageStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await db.execute('UPDATE contact_messages SET status = ? WHERE id = ?', [status, id]);
    return res.status(200).json({ status: 'success', message: 'Contact message status updated' });
  } catch (error) {
    console.error('Error updating contact message status:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to update contact message status' });
  }
};

export const replyToContactMessage = async (req, res) => {
  const { id } = req.params;
  const { replyMessage } = req.body;
  
  if (!replyMessage) {
    return res.status(400).json({ status: 'error', message: 'Reply message is required' });
  }

  try {
    const [messages] = await db.execute('SELECT * FROM contact_messages WHERE id = ?', [id]);
    if (messages.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Contact message not found' });
    }
    const msg = messages[0];

    // Send email
    const { sendContactReplyEmail } = await import('../services/emailService.js');
    await sendContactReplyEmail(msg.email, msg.name, replyMessage, msg.message);

    // Update DB
    await db.execute('UPDATE contact_messages SET reply = ?, status = ? WHERE id = ?', [replyMessage, 'replied', id]);

    return res.status(200).json({ status: 'success', message: 'Reply sent successfully' });
  } catch (error) {
    console.error('Error replying to contact message:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to send reply' });
  }
};


