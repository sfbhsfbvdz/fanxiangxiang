/**
 * 创建角色账号脚本
 *
 * 用法:
 *   npx tsx scripts/create-admin.ts --role admin --email admin@fanfou.com --password admin123 --username admin
 *   npx tsx scripts/create-admin.ts --role merchant --email merchant@fanfou.com --password merchant123 --username merchant1 --restaurant-id 1
 *   npx tsx scripts/create-admin.ts --role rider --email rider@fanfou.com --password rider123 --username rider1
 */

import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../database/fanfou.db');

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

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
if (existing) {
  console.log(`⚠️  用户已存在: ${email} / ${username}`);
  process.exit(0);
}

const hash = bcrypt.hashSync(password, 10);
const result = db.prepare(
  `INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)`
).run(username, email, hash, role);

const userId = result.lastInsertRowid as number;
console.log(`✅ 创建用户成功: id=${userId}, username=${username}, email=${email}, role=${role}`);

if (role === 'merchant' && restaurantId) {
  const restId = parseInt(restaurantId);
  const rest = db.prepare('SELECT id, name FROM restaurants WHERE id = ?').get(restId) as any;
  if (!rest) {
    console.warn(`⚠️  餐厅 id=${restId} 不存在，跳过绑定`);
  } else {
    db.prepare(
      'INSERT INTO restaurant_managers (user_id, restaurant_id) VALUES (?, ?)'
    ).run(userId, restId);
    console.log(`✅ 绑定餐厅: ${rest.name} (id=${restId})`);
  }
}

if (role === 'rider') {
  db.prepare('INSERT INTO riders (user_id) VALUES (?)').run(userId);
  console.log(`✅ 创建骑手记录`);
}

console.log(`\n登录信息:\n  邮箱: ${email}\n  密码: ${password}\n  角色: ${role}\n`);
db.close();
