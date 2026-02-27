import { db } from '../config/database.js';
import { NotFoundError } from '../middleware/error.js';
import { Restaurant, Category, MenuItem, MenuCategory, PaginatedResponse } from '../types/index.js';

interface RestaurantRow {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
  rating: number;
  delivery_time: string;
  delivery_fee: number;
  min_order: number;
  status: string;
}

interface CategoryRow {
  id: number;
  restaurant_id: number;
  name: string;
  sort_order: number;
}

interface MenuItemRow {
  id: number;
  restaurant_id: number;
  category_id: number;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  status: string;
}

export class RestaurantService {
  // Get restaurant list with optional search and pagination
  getRestaurants(
    search?: string,
    page: number = 1,
    limit: number = 20
  ): PaginatedResponse<Restaurant> {
    const offset = (page - 1) * limit;

    let whereClause = "WHERE status = 'active'";
    const params: (string | number)[] = [];

    if (search) {
      whereClause += ` AND (name LIKE ? OR description LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    // Get total count
    const countResult = db.prepare(
      `SELECT COUNT(*) as count FROM restaurants ${whereClause}`
    ).get(...params) as { count: number };

    // Get restaurants
    const restaurants = db.prepare(
      `SELECT id, name, description, image, rating, delivery_time, delivery_fee, min_order, status
       FROM restaurants ${whereClause}
       ORDER BY rating DESC
       LIMIT ? OFFSET ?`
    ).all(...params, limit, offset) as RestaurantRow[];

    // Get tags for all restaurants
    const restaurantIds = restaurants.map(r => r.id);
    const restaurantsWithTags = restaurants.map(r => {
      const tags = this.getRestaurantTags(r.id);
      return this.mapRestaurant(r, tags);
    });

    return {
      items: restaurantsWithTags,
      total: countResult.count,
      page,
      totalPages: Math.ceil(countResult.count / limit),
    };
  }

  // Get single restaurant by ID
  getRestaurantById(id: number): Restaurant {
    const restaurant = db.prepare(
      `SELECT id, name, description, image, rating, delivery_time, delivery_fee, min_order, status
       FROM restaurants WHERE id = ?`
    ).get(id) as RestaurantRow | undefined;

    if (!restaurant) {
      throw new NotFoundError('餐厅不存在');
    }

    const tags = this.getRestaurantTags(id);
    const categories = this.getCategories(id);

    return {
      ...this.mapRestaurant(restaurant, tags),
      categories,
    };
  }

  // Get restaurant menu
  getRestaurantMenu(restaurantId: number): { categories: MenuCategory[] } {
    // Check if restaurant exists
    const restaurant = db.prepare(
      'SELECT id FROM restaurants WHERE id = ?'
    ).get(restaurantId);

    if (!restaurant) {
      throw new NotFoundError('餐厅不存在');
    }

    // Get categories
    const categoryRows = db.prepare(
      `SELECT id, restaurant_id, name, sort_order
       FROM categories WHERE restaurant_id = ?
       ORDER BY sort_order ASC`
    ).all(restaurantId) as CategoryRow[];

    // Get all menu items for this restaurant
    const menuItems = db.prepare(
      `SELECT id, restaurant_id, category_id, name, description, price, image, status
       FROM menu_items WHERE restaurant_id = ?`
    ).all(restaurantId) as MenuItemRow[];

    // Group items by category
    const categories: MenuCategory[] = categoryRows.map(cat => ({
      id: cat.id,
      restaurantId: cat.restaurant_id,
      name: cat.name,
      sortOrder: cat.sort_order,
      items: menuItems
        .filter(item => item.category_id === cat.id)
        .map(item => this.mapMenuItem(item)),
    }));

    return { categories };
  }

  // Get menu item by ID
  getMenuItem(id: number): MenuItem {
    const item = db.prepare(
      `SELECT id, restaurant_id, category_id, name, description, price, image, status
       FROM menu_items WHERE id = ?`
    ).get(id) as MenuItemRow | undefined;

    if (!item) {
      throw new NotFoundError('菜品不存在');
    }

    return this.mapMenuItem(item);
  }

  // Helper methods
  private getRestaurantTags(restaurantId: number): string[] {
    const rows = db.prepare(
      'SELECT tag FROM restaurant_tags WHERE restaurant_id = ?'
    ).all(restaurantId) as { tag: string }[];

    return rows.map(r => r.tag);
  }

  private getCategories(restaurantId: number): Category[] {
    const rows = db.prepare(
      `SELECT id, restaurant_id, name, sort_order
       FROM categories WHERE restaurant_id = ?
       ORDER BY sort_order ASC`
    ).all(restaurantId) as CategoryRow[];

    return rows.map(r => ({
      id: r.id,
      restaurantId: r.restaurant_id,
      name: r.name,
      sortOrder: r.sort_order,
    }));
  }

  private mapRestaurant(row: RestaurantRow, tags: string[]): Restaurant {
    return {
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      image: row.image || undefined,
      rating: row.rating,
      deliveryTime: row.delivery_time,
      deliveryFee: row.delivery_fee,
      minOrder: row.min_order,
      status: row.status as 'active' | 'inactive',
      tags,
    };
  }

  private mapMenuItem(row: MenuItemRow): MenuItem {
    return {
      id: row.id,
      restaurantId: row.restaurant_id,
      categoryId: row.category_id,
      name: row.name,
      description: row.description || undefined,
      price: row.price,
      image: row.image || undefined,
      status: row.status as 'available' | 'sold_out',
    };
  }
}

export const restaurantService = new RestaurantService();
