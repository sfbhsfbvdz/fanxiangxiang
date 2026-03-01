/**
 * Database initialization script
 * Usage: npm run db:init
 */
import { initDatabase, closeDatabase } from '../src/config/database.js';

console.log('🔧 Initializing database...');
initDatabase()
  .then(() => {
    console.log('✅ Database initialization complete.');
    return closeDatabase();
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
