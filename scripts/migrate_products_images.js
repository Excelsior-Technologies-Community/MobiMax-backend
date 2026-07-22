import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function migrateProductsTable() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'mobimax'
    });

    console.log('Adding images_json column to products table...');
    await connection.query(`
      ALTER TABLE products
      ADD COLUMN images_json TEXT DEFAULT NULL AFTER image_url
    `);
    console.log('✅ `images_json` column added successfully!');

  } catch (error) {
    // Ignore duplicate column error (Error 1060: Duplicate column name)
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Column images_json already exists. Proceeding.');
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

migrateProductsTable();
