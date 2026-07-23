import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function addTables() {
  console.log('Connecting to database...');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log('Creating `store_contact_messages` table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS store_contact_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        partner_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'unread',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
      )
    `);

    console.log('Creating `bulk_orders` table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS bulk_orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        partner_id INT NOT NULL,
        product_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        quantity INT NOT NULL,
        message TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ Tables added successfully.');
  } catch (error) {
    console.error('❌ Error adding tables:', error);
  } finally {
    await connection.end();
  }
}

addTables();
