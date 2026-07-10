import pool from '../config/db.js';

export const submitContactForm = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const [result] = await pool.query(
      'INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)',
      [name, email, message]
    );

    res.status(201).json({
      message: 'Contact form submitted successfully',
      contactMessageId: result.insertId
    });
  } catch (error) {
    console.error('Error in submitContactForm:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
