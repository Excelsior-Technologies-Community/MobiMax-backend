import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import db from '../config/db.js';
import { sendWelcomeEmail } from '../services/emailService.js';
import { getIO } from '../socket.js';

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
