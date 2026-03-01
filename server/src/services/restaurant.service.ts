import { queryOne, queryAll } from '../config/database.js';
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
  async getRestaurants(
    search?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<Restaurant>> {
    const offset = (page - 1) * limit;

    let whereClause = "WHERE status = 'active'";
    const params: unknown[] = [];

    if (search) {
      whereClause += ` AND (name LIKE ? OR description LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    // Get total count
    const countResult = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM restaurants ${whereClause}`,
      params
    );

    // Get restaurants
    const restaurants = await queryAll<RestaurantRow>(
      `SELECT id, name, description, image, rating, delivery_time, delivery_fee, min_order, status
       FROM restaurants ${whereClause}
       ORDER BY rating DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Get tags for all restaurants
    const restaurantsWithTags = await Promise.all(
      restaurants.map(async r => {
        const tags = await this.getRestaurantTags(r.id);
        return this.mapRestaurant(r, tags);
      })
    );

    const total = countResult?.count ?? 0;

    return {
      items: restaurantsWithTags,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Get single restaurant by ID
  async getRestaurantById(id: number): Promise<Restaurant> {
    const restaurant = await queryOne<RestaurantRow>(
      `SELECT id, name, description, image, rating, delivery_time, delivery_fee, min_order, status
       FROM restaurants WHERE id = ?`,
      [id]
    );

    if (!restaurant) {
      throw new NotFoundError('餐厅不存在');
    }

    const [tags, categories] = await Promise.all([
      this.getRestaurantTags(id),
      this.getCategories(id),
    ]);

    return {
      ...this.mapRestaurant(restaurant, tags),
      categories,
    };
  }

  // Get restaurant menu
  async getRestaurantMenu(restaurantId: number): Promise<{ categories: MenuCategory[] }> {
    // Check if restaurant exists
    const restaurant = await queryOne<{ id: number }>(
      'SELECT id FROM restaurants WHERE id = ?',
      [restaurantId]
    );

    if (!restaurant) {
      throw new NotFoundError('餐厅不存在');
    }

    // Get categories and menu items in parallel
    const [categoryRows, menuItems] = await Promise.all([
      queryAll<CategoryRow>(
        `SELECT id, restaurant_id, name, sort_order
         FROM categories WHERE restaurant_id = ?
         ORDER BY sort_order ASC`,
        [restaurantId]
      ),
      queryAll<MenuItemRow>(
        `SELECT id, restaurant_id, category_id, name, description, price, image, status
         FROM menu_items WHERE restaurant_id = ?`,
        [restaurantId]
      ),
    ]);

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
  async getMenuItem(id: number): Promise<MenuItem> {
    const item = await queryOne<MenuItemRow>(
      `SELECT id, restaurant_id, category_id, name, description, price, image, status
       FROM menu_items WHERE id = ?`,
      [id]
    );

    if (!item) {
      throw new NotFoundError('菜品不存在');
    }

    return this.mapMenuItem(item);
  }

  // Helper methods
  private async getRestaurantTags(restaurantId: number): Promise<string[]> {
    const rows = await queryAll<{ tag: string }>(
      'SELECT tag FROM restaurant_tags WHERE restaurant_id = ?',
      [restaurantId]
    );

    return rows.map(r => r.tag);
  }

  private async getCategories(restaurantId: number): Promise<Category[]> {
    const rows = await queryAll<CategoryRow>(
      `SELECT id, restaurant_id, name, sort_order
       FROM categories WHERE restaurant_id = ?
       ORDER BY sort_order ASC`,
      [restaurantId]
    );

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
      rating: parseFloat(String(row.rating)),
      deliveryTime: row.delivery_time,
      deliveryFee: parseFloat(String(row.delivery_fee)),
      minOrder: parseFloat(String(row.min_order)),
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
      price: parseFloat(String(row.price)),
      image: row.image || undefined,
      status: row.status as 'available' | 'sold_out',
    };
  }
}

export const restaurantService = new RestaurantService();
