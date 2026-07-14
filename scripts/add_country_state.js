import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function addFields() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log('Connected to the database.');

    try {
      await connection.query("ALTER TABLE partners ADD COLUMN store_country VARCHAR(100) DEFAULT NULL;");
      console.log('Added store_country column.');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('store_country column already exists.');
      } else {
        throw err;
      }
    }

    try {
      await connection.query("ALTER TABLE partners ADD COLUMN store_state VARCHAR(100) DEFAULT NULL;");
      console.log('Added store_state column.');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('store_state column already exists.');
      } else {
        throw err;
      }
    }

    await connection.end();
    console.log('Database updated successfully.');
  } catch (error) {
    console.error('Error updating database:', error);
  }
}

addFields();
