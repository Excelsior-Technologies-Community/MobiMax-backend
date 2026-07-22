import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function addProductsTable() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'mobimax'
    });

    console.log('Creating products table if it does not exist...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        partner_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        oldPrice DECIMAL(10, 2) DEFAULT NULL,
        image_url VARCHAR(500) NOT NULL,
        images_json TEXT DEFAULT NULL,
        category VARCHAR(100) NOT NULL,
        rating INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        in_stock BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ `products` table created successfully!');

  } catch (error) {
    console.error('❌ Error creating products table:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
    process.exit(0);
  }
}

addProductsTable();
