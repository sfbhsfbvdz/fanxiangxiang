import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { env } from './env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve database path relative to server directory
const dbPath = path.resolve(__dirname, '../..', env.DATABASE_PATH);
const dbDir = path.dirname(dbPath);

// Ensure database directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

function runMigrations(): void {
  // Add role column to users if it doesn't exist
  const userCols = db.pragma('table_info(users)') as { name: string }[];
  if (!userCols.some(c => c.name === 'role')) {
    db.exec(`ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'customer'`);
    console.log('✅ Migration: added users.role');
  }

  // Add rider_id column to orders if it doesn't exist
  const orderCols = db.pragma('table_info(orders)') as { name: string }[];
  if (!orderCols.some(c => c.name === 'rider_id')) {
    db.exec(`ALTER TABLE orders ADD COLUMN rider_id INTEGER REFERENCES users(id)`);
    console.log('✅ Migration: added orders.rider_id');
  }

  // Add restaurant_id index on orders if not exists (schema already has it)
  // New tables (riders, restaurant_managers) are handled by schema.sql via CREATE TABLE IF NOT EXISTS
}

export function initDatabase(): void {
  const schemaPath = path.resolve(__dirname, '../../database/schema.sql');

  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    db.exec(schema);
    console.log('✅ Database initialized');
  } else {
    console.warn('⚠️ Schema file not found, skipping initialization');
  }

  // Run migrations for existing databases
  runMigrations();

  // Check if we need to seed data
  const restaurantCount = db.prepare('SELECT COUNT(*) as count FROM restaurants').get() as { count: number };

  if (restaurantCount.count === 0) {
    const seedPath = path.resolve(__dirname, '../../database/seed.sql');
    if (fs.existsSync(seedPath)) {
      const seed = fs.readFileSync(seedPath, 'utf-8');
      db.exec(seed);
      console.log('✅ Database seeded with initial data');
    }
  }
}

export function closeDatabase(): void {
  db.close();
}
