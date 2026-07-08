import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function migratePartnersStoreFields() {
  console.log('Starting partners table migration for store fields...');
  
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'mobimax',
    });

    console.log('Connected to database. Altering partners table...');

    const queries = [
      "ALTER TABLE partners ADD COLUMN store_name VARCHAR(255) DEFAULT NULL;",
      "ALTER TABLE partners ADD COLUMN store_address TEXT DEFAULT NULL;",
      "ALTER TABLE partners ADD COLUMN store_logo VARCHAR(500) DEFAULT NULL;"
    ];

    for (const query of queries) {
      try {
        await connection.query(query);
        console.log(`Executed: ${query}`);
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log(`Column already exists, skipping: ${query}`);
        } else {
          throw err;
        }
      }
    }
    
    console.log('Migration completed successfully.');

  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
    process.exit(0);
  }
}

migratePartnersStoreFields();
