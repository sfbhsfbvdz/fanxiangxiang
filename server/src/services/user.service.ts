import { db } from '../config/database.js';
import { NotFoundError, ForbiddenError, ConflictError } from '../middleware/error.js';
import { User, Address, CreateAddressBody, UpdateAddressBody, UpdateProfileBody } from '../types/index.js';

interface UserRow {
  id: number;
  username: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  created_at: string;
  updated_at: string;
}

interface AddressRow {
  id: number;
  user_id: number;
  name: string;
  phone: string;
  address: string;
  detail: string | null;
  is_default: number;
  created_at: string;
}

export class UserService {
  // Get user profile
  getProfile(userId: number): User {
    const user = db.prepare(
      `SELECT id, username, email, phone, avatar, created_at, updated_at
       FROM users WHERE id = ?`
    ).get(userId) as UserRow | undefined;

    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    return this.mapUser(user);
  }

  // Update user profile
  updateProfile(userId: number, data: UpdateProfileBody): User {
    const { username, phone, avatar } = data;

    // Check if username is taken by another user
    if (username) {
      const existing = db.prepare(
        'SELECT id FROM users WHERE username = ? AND id != ?'
      ).get(username, userId);

      if (existing) {
        throw new ConflictError('用户名已被使用');
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (username !== undefined) {
      updates.push('username = ?');
      values.push(username);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }
    if (avatar !== undefined) {
      updates.push('avatar = ?');
      values.push(avatar);
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(userId);

      db.prepare(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`
      ).run(...values);
    }

    return this.getProfile(userId);
  }

  // Get user addresses
  getAddresses(userId: number): Address[] {
    const addresses = db.prepare(
      `SELECT id, user_id, name, phone, address, detail, is_default, created_at
       FROM addresses WHERE user_id = ?
       ORDER BY is_default DESC, created_at DESC`
    ).all(userId) as AddressRow[];

    return addresses.map(this.mapAddress);
  }

  // Get single address
  getAddress(addressId: number, userId: number): Address {
    const address = db.prepare(
      `SELECT id, user_id, name, phone, address, detail, is_default, created_at
       FROM addresses WHERE id = ?`
    ).get(addressId) as AddressRow | undefined;

    if (!address) {
      throw new NotFoundError('地址不存在');
    }

    if (address.user_id !== userId) {
      throw new ForbiddenError('无权访问此地址');
    }

    return this.mapAddress(address);
  }

  // Create address
  createAddress(userId: number, data: CreateAddressBody): Address {
    const { name, phone, address, detail, isDefault } = data;

    // If this is set as default, unset other defaults
    if (isDefault) {
      db.prepare(
        'UPDATE addresses SET is_default = 0 WHERE user_id = ?'
      ).run(userId);
    }

    // If this is the first address, make it default
    const addressCount = db.prepare(
      'SELECT COUNT(*) as count FROM addresses WHERE user_id = ?'
    ).get(userId) as { count: number };

    const shouldBeDefault = isDefault || addressCount.count === 0;

    const result = db.prepare(
      `INSERT INTO addresses (user_id, name, phone, address, detail, is_default)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(userId, name, phone, address, detail || null, shouldBeDefault ? 1 : 0);

    return this.getAddress(result.lastInsertRowid as number, userId);
  }

  // Update address
  updateAddress(addressId: number, userId: number, data: UpdateAddressBody): Address {
    // Verify ownership
    const existing = db.prepare(
      'SELECT user_id FROM addresses WHERE id = ?'
    ).get(addressId) as { user_id: number } | undefined;

    if (!existing) {
      throw new NotFoundError('地址不存在');
    }

    if (existing.user_id !== userId) {
      throw new ForbiddenError('无权修改此地址');
    }

    const { name, phone, address, detail, isDefault } = data;

    // If setting as default, unset other defaults
    if (isDefault) {
      db.prepare(
        'UPDATE addresses SET is_default = 0 WHERE user_id = ?'
      ).run(userId);
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }
    if (address !== undefined) {
      updates.push('address = ?');
      values.push(address);
    }
    if (detail !== undefined) {
      updates.push('detail = ?');
      values.push(detail);
    }
    if (isDefault !== undefined) {
      updates.push('is_default = ?');
      values.push(isDefault ? 1 : 0);
    }

    if (updates.length > 0) {
      values.push(addressId);
      db.prepare(
        `UPDATE addresses SET ${updates.join(', ')} WHERE id = ?`
      ).run(...values);
    }

    return this.getAddress(addressId, userId);
  }

  // Delete address
  deleteAddress(addressId: number, userId: number): void {
    const address = db.prepare(
      'SELECT id, user_id, is_default FROM addresses WHERE id = ?'
    ).get(addressId) as { id: number; user_id: number; is_default: number } | undefined;

    if (!address) {
      throw new NotFoundError('地址不存在');
    }

    if (address.user_id !== userId) {
      throw new ForbiddenError('无权删除此地址');
    }

    db.prepare('DELETE FROM addresses WHERE id = ?').run(addressId);

    // If deleted address was default, set another as default
    if (address.is_default) {
      const firstAddress = db.prepare(
        `SELECT id FROM addresses WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`
      ).get(userId) as { id: number } | undefined;

      if (firstAddress) {
        db.prepare('UPDATE addresses SET is_default = 1 WHERE id = ?').run(firstAddress.id);
      }
    }
  }

  // Helper methods
  private mapUser(row: UserRow): User {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      phone: row.phone || undefined,
      avatar: row.avatar || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapAddress(row: AddressRow): Address {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      phone: row.phone,
      address: row.address,
      detail: row.detail || undefined,
      isDefault: row.is_default === 1,
      createdAt: row.created_at,
    };
  }
}

export const userService = new UserService();
