import crypto from 'crypto';
import bcrypt from 'bcrypt';
import db from '../config/db.js';
import { sendPasswordResetEmail } from '../services/emailService.js';

export const forgotPassword = async (req, res) => {
  const { email, type } = req.body;
  
  if (!email || !type || !['user', 'partner'].includes(type)) {
    return res.status(400).json({ status: 'error', message: 'Valid email and type are required' });
  }

  try {
    const tableName = type === 'partner' ? 'partners' : 'users';
    
    // 1. Check if user exists
    const [rows] = await db.execute(`SELECT * FROM ${tableName} WHERE email = ?`, [email]);
    if (rows.length === 0) {
      // Return success even if not found to prevent email enumeration
      return res.status(200).json({ status: 'success', message: 'If an account exists, a password reset link has been sent.' });
    }

    const user = rows[0];

    // 2. Generate a secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // 3. Save token in database
    await db.execute(
      'INSERT INTO password_resets (email, token, user_type, expires_at) VALUES (?, ?, ?, ?)',
      [email, token, type, expiresAt]
    );

    // 4. Send email
    const resetLink = `http://localhost:5173/reset-password?token=${token}&type=${type}`;
    await sendPasswordResetEmail(email, user.name || user.company || 'User', resetLink, type);

    return res.status(200).json({ status: 'success', message: 'If an account exists, a password reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ status: 'error', message: 'An error occurred. Please try again.' });
  }
};

export const resetPassword = async (req, res) => {
  const { token, type, newPassword } = req.body;

  if (!token || !type || !newPassword || !['user', 'partner'].includes(type)) {
    return res.status(400).json({ status: 'error', message: 'Token, type, and new password are required' });
  }

  try {
    // 1. Verify token exists and hasn't expired
    const [resetRows] = await db.execute(
      'SELECT * FROM password_resets WHERE token = ? AND user_type = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [token, type]
    );

    if (resetRows.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Invalid or expired password reset token' });
    }

    const resetRecord = resetRows[0];
    const email = resetRecord.email;

    // 2. Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // 3. Update password in corresponding table
    const tableName = type === 'partner' ? 'partners' : 'users';
    await db.execute(`UPDATE ${tableName} SET password = ? WHERE email = ?`, [hashedPassword, email]);

    // 4. Delete used token
    await db.execute('DELETE FROM password_resets WHERE email = ? AND user_type = ?', [email, type]);

    return res.status(200).json({ status: 'success', message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ status: 'error', message: 'An error occurred while resetting the password.' });
  }
};
