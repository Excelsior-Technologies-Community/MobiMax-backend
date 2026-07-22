import jwt from 'jsonwebtoken';

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function testFetch() {
  const token = jwt.sign({ id: 1, email: 'test@example.com' }, process.env.JWT_SECRET || 'fallback_super_secret_key_123');
  
  try {
    const res = await fetch('http://localhost:5001/api/partners/products', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(res.status, await res.text());
  } catch (err) {
    console.error(err);
  }
}

testFetch();
