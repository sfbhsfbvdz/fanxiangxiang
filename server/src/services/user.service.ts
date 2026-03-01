import { queryOne, queryAll, execute } from '../config/database.js';
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
  async getProfile(userId: number): Promise<User> {
    const user = await queryOne<UserRow>(
      `SELECT id, username, email, phone, avatar, created_at, updated_at
       FROM users WHERE id = ?`,
      [userId]
    );

    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    return this.mapUser(user);
  }

  // Update user profile
  async updateProfile(userId: number, data: UpdateProfileBody): Promise<User> {
    const { username, phone, avatar } = data;

    // Check if username is taken by another user
    if (username) {
      const existing = await queryOne<{ id: number }>(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, userId]
      );

      if (existing) {
        throw new ConflictError('用户名已被使用');
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: unknown[] = [];

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

      await execute(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    return this.getProfile(userId);
  }

  // Get user addresses
  async getAddresses(userId: number): Promise<Address[]> {
    const addresses = await queryAll<AddressRow>(
      `SELECT id, user_id, name, phone, address, detail, is_default, created_at
       FROM addresses WHERE user_id = ?
       ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );

    return addresses.map(this.mapAddress);
  }

  // Get single address
  async getAddress(addressId: number, userId: number): Promise<Address> {
    const address = await queryOne<AddressRow>(
      `SELECT id, user_id, name, phone, address, detail, is_default, created_at
       FROM addresses WHERE id = ?`,
      [addressId]
    );

    if (!address) {
      throw new NotFoundError('地址不存在');
    }

    if (address.user_id !== userId) {
      throw new ForbiddenError('无权访问此地址');
    }

    return this.mapAddress(address);
  }

  // Create address
  async createAddress(userId: number, data: CreateAddressBody): Promise<Address> {
    const { name, phone, address, detail, isDefault } = data;

    // If this is set as default, unset other defaults
    if (isDefault) {
      await execute(
        'UPDATE addresses SET is_default = 0 WHERE user_id = ?',
        [userId]
      );
    }

    // If this is the first address, make it default
    const countRow = await queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM addresses WHERE user_id = ?',
      [userId]
    );

    const shouldBeDefault = isDefault || (countRow?.count ?? 0) === 0;

    const result = await execute(
      `INSERT INTO addresses (user_id, name, phone, address, detail, is_default)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, name, phone, address, detail || null, shouldBeDefault ? 1 : 0]
    );

    return this.getAddress(result.insertId, userId);
  }

  // Update address
  async updateAddress(addressId: number, userId: number, data: UpdateAddressBody): Promise<Address> {
    // Verify ownership
    const existing = await queryOne<{ user_id: number }>(
      'SELECT user_id FROM addresses WHERE id = ?',
      [addressId]
    );

    if (!existing) {
      throw new NotFoundError('地址不存在');
    }

    if (existing.user_id !== userId) {
      throw new ForbiddenError('无权修改此地址');
    }

    const { name, phone, address, detail, isDefault } = data;

    // If setting as default, unset other defaults
    if (isDefault) {
      await execute(
        'UPDATE addresses SET is_default = 0 WHERE user_id = ?',
        [userId]
      );
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: unknown[] = [];

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
      await execute(
        `UPDATE addresses SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    return this.getAddress(addressId, userId);
  }

  // Delete address
  async deleteAddress(addressId: number, userId: number): Promise<void> {
    const address = await queryOne<{ id: number; user_id: number; is_default: number }>(
      'SELECT id, user_id, is_default FROM addresses WHERE id = ?',
      [addressId]
    );

    if (!address) {
      throw new NotFoundError('地址不存在');
    }

    if (address.user_id !== userId) {
      throw new ForbiddenError('无权删除此地址');
    }

    await execute('DELETE FROM addresses WHERE id = ?', [addressId]);

    // If deleted address was default, set another as default
    if (address.is_default) {
      const firstAddress = await queryOne<{ id: number }>(
        `SELECT id FROM addresses WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
        [userId]
      );

      if (firstAddress) {
        await execute('UPDATE addresses SET is_default = 1 WHERE id = ?', [firstAddress.id]);
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
