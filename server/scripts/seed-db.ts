/**
 * Database seeding script (force re-seed)
 * Usage: npm run db:seed
 */
import { db, closeDatabase } from '../src/config/database.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🌱 Seeding database...');

// Clear existing data (in correct order to respect foreign keys)
db.exec(`
  DELETE FROM order_items;
  DELETE FROM orders;
  DELETE FROM addresses;
  DELETE FROM menu_items;
  DELETE FROM categories;
  DELETE FROM restaurant_tags;
  DELETE FROM restaurants;
  DELETE FROM sqlite_sequence WHERE name IN ('restaurants','categories','menu_items','restaurant_tags','orders','order_items','addresses');
`);

const seedPath = path.resolve(__dirname, '../database/seed.sql');
if (!fs.existsSync(seedPath)) {
  console.error('❌ seed.sql not found');
  process.exit(1);
}

const seed = fs.readFileSync(seedPath, 'utf-8');
db.exec(seed);

console.log('✅ Database seeded successfully.');
closeDatabase();
