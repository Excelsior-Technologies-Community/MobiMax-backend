import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function testProducts() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'mobimax'
    });

    const [products] = await connection.execute('SELECT * FROM products WHERE partner_id = ? ORDER BY created_at DESC', [1]);
    console.log("Success! Products:", products);

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testProducts();
