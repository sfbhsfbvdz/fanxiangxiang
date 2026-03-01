/**
 * Database seeding script (force re-seed)
 * Usage: npm run db:seed
 */
import { execute, closeDatabase } from '../src/config/database.js';
import path from 'path';
import fs from 'fs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'fanfou',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fanfou',
  connectionLimit: 1,
});

async function run() {
  console.log('🌱 Seeding database...');

  // Clear existing data (in correct order to respect foreign keys)
  await pool.query('DELETE FROM order_items');
  await pool.query('DELETE FROM orders');
  await pool.query('DELETE FROM addresses');
  await pool.query('DELETE FROM menu_items');
  await pool.query('DELETE FROM categories');
  await pool.query('DELETE FROM restaurant_tags');
  await pool.query('DELETE FROM restaurants');

  const seedPath = path.resolve(__dirname, '../database/seed.sql');
  if (!fs.existsSync(seedPath)) {
    console.error('❌ seed.sql not found');
    process.exit(1);
  }

  const seed = fs.readFileSync(seedPath, 'utf-8');
  const statements = seed
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const stmt of statements) {
    await pool.query(stmt);
  }

  console.log('✅ Database seeded successfully.');
  await pool.end();
}

run().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
