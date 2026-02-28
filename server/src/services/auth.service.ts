import bcrypt from 'bcrypt';
import { db } from '../config/database.js';
import { generateToken, JwtPayload } from '../middleware/auth.js';
import { ConflictError, UnauthorizedError } from '../middleware/error.js';
import { User, UserWithPassword, RegisterBody, LoginBody } from '../types/index.js';

const SALT_ROUNDS = 10;

export class AuthService {
  // Register a new user
  async register(data: RegisterBody): Promise<{ token: string; user: User }> {
    const { username, email, password, phone } = data;

    // Check if user already exists
    const existingUser = db.prepare(
      'SELECT id FROM users WHERE email = ? OR username = ?'
    ).get(email, username) as { id: number } | undefined;

    if (existingUser) {
      throw new ConflictError('用户名或邮箱已存在');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert user
    const result = db.prepare(
      `INSERT INTO users (username, email, password_hash, phone)
       VALUES (?, ?, ?, ?)`
    ).run(username, email, passwordHash, phone || null);

    const userId = result.lastInsertRowid as number;

    // Get the created user
    const user = this.getUserById(userId);

    // Generate token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role || 'customer',
    });

    return { token, user };
  }

  // Login user
  async login(data: LoginBody): Promise<{ token: string; user: User }> {
    const { email, password } = data;

    // Find user by email
    const userWithPassword = db.prepare(
      `SELECT id, username, email, password_hash, phone, avatar, role, created_at, updated_at
       FROM users WHERE email = ?`
    ).get(email) as {
      id: number;
      username: string;
      email: string;
      password_hash: string;
      phone: string | null;
      avatar: string | null;
      role: string;
      created_at: string;
      updated_at: string;
    } | undefined;

    if (!userWithPassword) {
      throw new UnauthorizedError('邮箱或密码错误');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, userWithPassword.password_hash);

    if (!isValidPassword) {
      throw new UnauthorizedError('邮箱或密码错误');
    }

    const user: User = {
      id: userWithPassword.id,
      username: userWithPassword.username,
      email: userWithPassword.email,
      phone: userWithPassword.phone || undefined,
      avatar: userWithPassword.avatar || undefined,
      role: userWithPassword.role || 'customer',
      createdAt: userWithPassword.created_at,
      updatedAt: userWithPassword.updated_at,
    };

    // Generate token with role
    const token = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role || 'customer',
    });

    return { token, user };
  }

  // Get user by ID
  getUserById(id: number): User {
    const row = db.prepare(
      `SELECT id, username, email, phone, avatar, role, created_at, updated_at
       FROM users WHERE id = ?`
    ).get(id) as {
      id: number;
      username: string;
      email: string;
      phone: string | null;
      avatar: string | null;
      role: string;
      created_at: string;
      updated_at: string;
    };

    return {
      id: row.id,
      username: row.username,
      email: row.email,
      phone: row.phone || undefined,
      avatar: row.avatar || undefined,
      role: row.role || 'customer',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // Get user profile from JWT payload
  getProfile(payload: JwtPayload): User {
    return this.getUserById(payload.userId);
  }
}

export const authService = new AuthService();
