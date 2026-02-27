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

export function initDatabase(): void {
  const schemaPath = path.resolve(__dirname, '../../database/schema.sql');

  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    db.exec(schema);
    console.log('✅ Database initialized');
  } else {
    console.warn('⚠️ Schema file not found, skipping initialization');
  }

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
