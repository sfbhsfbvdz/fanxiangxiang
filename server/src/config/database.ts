import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  connectionLimit: 10,
  waitForConnections: true,
  charset: 'utf8mb4',
  multipleStatements: false,
});

// Query a single row; returns undefined if not found
export async function queryOne<T>(sql: string, params: any[] = []): Promise<T | undefined> {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(sql, params);
  return (rows[0] as T) ?? undefined;
}

// Query multiple rows
export async function queryAll<T>(sql: string, params: any[] = []): Promise<T[]> {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(sql, params);
  return rows as T[];
}

// Execute INSERT/UPDATE/DELETE; returns ResultSetHeader with insertId / affectedRows
export async function execute(sql: string, params: any[] = []): Promise<mysql.ResultSetHeader> {
  const [result] = await pool.execute<mysql.ResultSetHeader>(sql, params);
  return result;
}

// Split a SQL file into individual statements, stripping comment lines
function splitSql(sql: string): string[] {
  return sql
    .split(';')
    .map(chunk =>
      chunk
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n')
        .trim()
    )
    .filter(s => s.length > 0);
}

// Get a raw connection for transactions
export async function getConnection(): Promise<mysql.PoolConnection> {
  return pool.getConnection();
}

export async function initDatabase(): Promise<void> {
  // Check if tables already exist
  const [tableRows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'`,
    [env.DB_NAME] as any[]
  );
  const tablesExist = (tableRows[0] as { count: number }).count > 0;

  if (!tablesExist) {
    // Fresh database: run schema then seed
    const schemaPath = path.resolve(__dirname, '../../database/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      for (const stmt of splitSql(schema)) {
        await pool.query(stmt);
      }
      console.log('✅ Database initialized');
    } else {
      console.warn('⚠️ Schema file not found, skipping initialization');
      return;
    }

    const seedPath = path.resolve(__dirname, '../../database/seed.sql');
    if (fs.existsSync(seedPath)) {
      const seed = fs.readFileSync(seedPath, 'utf-8');
      for (const stmt of splitSql(seed)) {
        await pool.query(stmt);
      }
      console.log('✅ Database seeded with initial data');
    }
  } else {
    // Existing database: run any pending migrations
    await runMigrations();

    // Seed if restaurants table is empty
    const [rows] = await pool.execute<mysql.RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM restaurants'
    );
    if ((rows[0] as { count: number }).count === 0) {
      const seedPath = path.resolve(__dirname, '../../database/seed.sql');
      if (fs.existsSync(seedPath)) {
        const seed = fs.readFileSync(seedPath, 'utf-8');
        for (const stmt of splitSql(seed)) {
          await pool.query(stmt);
        }
        console.log('✅ Database seeded with initial data');
      }
    }
  }
}

async function runMigrations(): Promise<void> {
  // Add users.role if missing
  const [roleRows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'`,
    [env.DB_NAME] as any[]
  );
  if ((roleRows[0] as { count: number }).count === 0) {
    await pool.query(`ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'customer'`);
    console.log('✅ Migration: added users.role');
  }

  // Add orders.rider_id if missing
  const [riderRows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'rider_id'`,
    [env.DB_NAME] as any[]
  );
  if ((riderRows[0] as { count: number }).count === 0) {
    await pool.query(`ALTER TABLE orders ADD COLUMN rider_id INT`);
    console.log('✅ Migration: added orders.rider_id');
  }

  // Add orders.tip if missing
  const [tipRows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'tip'`,
    [env.DB_NAME] as any[]
  );
  if ((tipRows[0] as { count: number }).count === 0) {
    await pool.query(`ALTER TABLE orders ADD COLUMN tip DECIMAL(10,2) NOT NULL DEFAULT 0`);
    console.log('✅ Migration: added orders.tip');
  }

  // Add orders.photo_url if missing
  const [photoRows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'photo_url'`,
    [env.DB_NAME] as any[]
  );
  if ((photoRows[0] as { count: number }).count === 0) {
    await pool.query(`ALTER TABLE orders ADD COLUMN photo_url MEDIUMTEXT`);
    console.log('✅ Migration: added orders.photo_url');
  }

  // Add orders.extra_charge if missing
  const [extraRows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'extra_charge'`,
    [env.DB_NAME] as any[]
  );
  if ((extraRows[0] as { count: number }).count === 0) {
    await pool.query(`ALTER TABLE orders ADD COLUMN extra_charge DECIMAL(10,2) NOT NULL DEFAULT 0`);
    await pool.query(`ALTER TABLE orders ADD COLUMN extra_charge_note VARCHAR(255)`);
    console.log('✅ Migration: added orders.extra_charge / extra_charge_note');
  }
}

export async function closeDatabase(): Promise<void> {
  await pool.end();
}
