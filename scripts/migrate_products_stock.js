import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function migrateProductsStock() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'mobimax'
    });

    console.log('Adding in_stock column to products table...');
    await connection.query(`
      ALTER TABLE products
      ADD COLUMN in_stock BOOLEAN DEFAULT TRUE AFTER status
    `);
    console.log('✅ `in_stock` column added successfully!');

  } catch (error) {
    // Ignore duplicate column error (Error 1060: Duplicate column name)
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Column in_stock already exists. Proceeding.');
    } else {
      console.error('❌ Error updating products table:', error);
    }
  } finally {
    if (connection) {
      await connection.end();
    }
    process.exit(0);
  }
}

migrateProductsStock();
