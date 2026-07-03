import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import db from '../config/db.js';

export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if user already exists
    const [existingUsers] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ status: 'error', message: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await db.execute(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );

    // Generate JWT
    const payload = { id: result.insertId, name, email, role: 'user' };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_super_secret_key_123', { expiresIn: '24h' });

    res.status(201).json({ status: 'success', message: 'User registered successfully', token, user: payload });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ status: 'error', message: 'An error occurred during registration' });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    // Generate JWT
    const payload = { id: user.id, name: user.name, email: user.email, role: 'user' };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_super_secret_key_123', { expiresIn: '24h' });

    res.status(200).json({ status: 'success', message: 'Login successful', token, user: payload });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ status: 'error', message: 'An error occurred during login' });
  }
};
