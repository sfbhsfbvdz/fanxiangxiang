/**
 * 创建角色账号脚本
 *
 * 用法:
 *   npx tsx scripts/create-admin.ts --role admin --email admin@fanfou.com --password admin123 --username admin
 *   npx tsx scripts/create-admin.ts --role merchant --email merchant@fanfou.com --password merchant123 --username merchant1 --restaurant-id 1
 *   npx tsx scripts/create-admin.ts --role rider --email rider@fanfou.com --password rider123 --username rider1
 */

import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const args = process.argv.slice(2);
const get = (flag: string) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : undefined;
};

const role = get('--role') || 'admin';
const email = get('--email') || `${role}@fanfou.com`;
const password = get('--password') || `${role}123`;
const username = get('--username') || role;
const restaurantId = get('--restaurant-id');

const validRoles = ['customer', 'merchant', 'rider', 'admin'];
if (!validRoles.includes(role)) {
  console.error(`❌ 无效角色: ${role}，可选: ${validRoles.join(', ')}`);
  process.exit(1);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'fanfou',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fanfou',
  connectionLimit: 1,
});

async function run() {
  const [existing] = await pool.execute<mysql.RowDataPacket[]>(
    'SELECT id FROM users WHERE email = ? OR username = ?',
    [email, username]
  );
  if (existing.length > 0) {
    console.log(`⚠️  用户已存在: ${email} / ${username}`);
    await pool.end();
    process.exit(0);
  }

  const hash = await bcrypt.hash(password, 10);
  const [result] = await pool.execute<mysql.ResultSetHeader>(
    `INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)`,
    [username, email, hash, role]
  );

  const userId = result.insertId;
  console.log(`✅ 创建用户成功: id=${userId}, username=${username}, email=${email}, role=${role}`);

  if (role === 'merchant' && restaurantId) {
    const restId = parseInt(restaurantId);
    const [restRows] = await pool.execute<mysql.RowDataPacket[]>(
      'SELECT id, name FROM restaurants WHERE id = ?',
      [restId]
    );
    if (restRows.length === 0) {
      console.warn(`⚠️  餐厅 id=${restId} 不存在，跳过绑定`);
    } else {
      await pool.execute(
        'INSERT INTO restaurant_managers (user_id, restaurant_id) VALUES (?, ?)',
        [userId, restId]
      );
      console.log(`✅ 绑定餐厅: ${(restRows[0] as any).name} (id=${restId})`);
    }
  }

  if (role === 'rider') {
    await pool.execute('INSERT INTO riders (user_id) VALUES (?)', [userId]);
    console.log(`✅ 创建骑手记录`);
  }

  console.log(`\n登录信息:\n  邮箱: ${email}\n  密码: ${password}\n  角色: ${role}\n`);
  await pool.end();
}

run().catch(err => {
  console.error('❌ 错误:', err.message);
  process.exit(1);
});
