import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env relative to this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function initDatabase() {
  console.log('Starting database initialization...');
  
  let connection;
  try {
    // 1. Connect to MySQL without a specific database to create it if it doesn't exist
    console.log('Connecting to MySQL server...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    // 2. Create Database
    const dbName = process.env.DB_NAME || 'mobimax';
    console.log(`Creating database \`${dbName}\` if it doesn't exist...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    
    // Switch to the newly created database
    await connection.query(`USE \`${dbName}\``);

    // 3. Create Admins table
    console.log('Creating `admins` table if it doesn\'t exist...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_id VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'master-admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Create Users table
    console.log('Creating `users` table if it doesn\'t exist...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. Create Partners table
    console.log('Creating `partners` table if it doesn\'t exist...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS partners (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(50) NOT NULL,
        password VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 6. Seed the Master Admin user
    const adminId = 'admin@123';
    const rawPassword = 'admin123';
    
    // Check if the master admin already exists
    const [existingAdmins] = await connection.query('SELECT * FROM admins WHERE admin_id = ?', [adminId]);
    
    if (existingAdmins.length === 0) {
      console.log(`Master admin '${adminId}' not found. Seeding now...`);
      
      // Hash the password securely
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(rawPassword, saltRounds);

      await connection.query(
        'INSERT INTO admins (admin_id, password, name, role) VALUES (?, ?, ?, ?)',
        [adminId, hashedPassword, 'Master Administrator', 'master-admin']
      );
      
      console.log(`✅ Master admin '${adminId}' created successfully!`);
    } else {
      console.log(`ℹ️ Master admin '${adminId}' already exists in the database. Skipping seed.`);
    }

    console.log('\n🎉 Database initialization completed successfully!');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    console.log('\nMake sure your MySQL server is running and the credentials in .env are correct.');
  } finally {
    if (connection) {
      await connection.end();
    }
    process.exit(0);
  }
}

initDatabase();
