import pool from '../config/db.js';
import { GoogleGenAI } from '@google/genai';

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
    const contactMessageId = result.insertId;

    // Async AI generation and reply
    try {
      if (process.env.GEMINI_API_KEY) {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `You are a helpful customer support agent for MobiMax, a premium e-commerce platform.
A user named "${name}" just submitted the following message via our contact form:
"${message}"

Write a polite, professional, and helpful email reply to this user. 
Do not include subject lines. Address them directly by name.
Keep it concise, friendly, and sign off as "The MobiMax Team". Do not leave any placeholders like [Your Name].`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });
        const aiReplyText = response.text;

        // Send Email
        const { sendContactReplyEmail } = await import('../services/emailService.js');
        await sendContactReplyEmail(email, name, aiReplyText, message);

        // Update Database
        await pool.query('UPDATE contact_messages SET reply = ?, status = ? WHERE id = ?', [aiReplyText, 'replied', contactMessageId]);
        console.log(`AI automatically replied to message ID: ${contactMessageId}`);
      } else {
        console.warn('GEMINI_API_KEY is not set. Skipping automated AI reply.');
      }
    } catch (aiError) {
      console.error('Error generating or sending AI reply:', aiError);
      // We do not fail the request if the AI fails; the message was saved successfully.
    }

    res.status(201).json({
      message: 'Contact form submitted successfully',
      contactMessageId
    });
  } catch (error) {
    console.error('Error in submitContactForm:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

