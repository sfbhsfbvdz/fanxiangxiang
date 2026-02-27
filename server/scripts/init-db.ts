/**
 * Database initialization script
 * Usage: npm run db:init
 */
import { initDatabase, closeDatabase } from '../src/config/database.js';

console.log('🔧 Initializing database...');
initDatabase();
console.log('✅ Database initialization complete.');
closeDatabase();
