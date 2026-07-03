import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import db from '../config/db.js';

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
    return res.status(200).json({ status: 'success', message: 'User status updated successfully' });
  } catch (error) {
    console.error('Error updating user status:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to update user status' });
  }
};

export const getPartners = async (req, res) => {
  try {
    const [partners] = await db.execute('SELECT id, company, name, email, phone, status, created_at FROM partners ORDER BY created_at DESC');
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
    return res.status(200).json({ status: 'success', message: 'Partner status updated successfully' });
  } catch (error) {
    console.error('Error updating partner status:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to update partner status' });
  }
};
