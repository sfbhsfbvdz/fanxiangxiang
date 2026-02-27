import { db } from '../config/database.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../middleware/error.js';
import { Order, OrderItem, OrderWithDetails, OrderStatus, CreateOrderBody, PaginatedResponse } from '../types/index.js';
import { restaurantService } from './restaurant.service.js';

interface OrderRow {
  id: number;
  user_id: number;
  restaurant_id: number;
  status: string;
  total_price: number;
  delivery_fee: number;
  delivery_address: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface OrderItemRow {
  id: number;
  order_id: number;
  menu_item_id: number;
  name: string;
  quantity: number;
  price: number;
}

interface AddressRow {
  id: number;
  user_id: number;
  name: string;
  phone: string;
  address: string;
  detail: string | null;
}

export class OrderService {
  // Create a new order
  createOrder(userId: number, data: CreateOrderBody): OrderWithDetails {
    const { restaurantId, items, deliveryAddressId, notes } = data;

    // Verify restaurant exists
    const restaurant = restaurantService.getRestaurantById(restaurantId);

    // Verify address belongs to user
    const address = db.prepare(
      `SELECT id, user_id, name, phone, address, detail
       FROM addresses WHERE id = ? AND user_id = ?`
    ).get(deliveryAddressId, userId) as AddressRow | undefined;

    if (!address) {
      throw new BadRequestError('配送地址不存在');
    }

    // Calculate total price and verify items
    let totalPrice = 0;
    const orderItems: { menuItemId: number; name: string; quantity: number; price: number }[] = [];

    for (const item of items) {
      const menuItem = restaurantService.getMenuItem(item.menuItemId);

      if (menuItem.restaurantId !== restaurantId) {
        throw new BadRequestError(`菜品 ${menuItem.name} 不属于该餐厅`);
      }

      if (menuItem.status === 'sold_out') {
        throw new BadRequestError(`菜品 ${menuItem.name} 已售罄`);
      }

      orderItems.push({
        menuItemId: menuItem.id,
        name: menuItem.name,
        quantity: item.quantity,
        price: menuItem.price,
      });

      totalPrice += menuItem.price * item.quantity;
    }

    // Check minimum order
    if (totalPrice < restaurant.minOrder) {
      throw new BadRequestError(`订单金额不满足起送价 ¥${restaurant.minOrder}`);
    }

    // Add delivery fee
    const deliveryFee = restaurant.deliveryFee;
    totalPrice += deliveryFee;

    // Format delivery address
    const deliveryAddress = address.detail
      ? `${address.address} ${address.detail} (${address.name} ${address.phone})`
      : `${address.address} (${address.name} ${address.phone})`;

    // Create order in transaction
    const transaction = db.transaction(() => {
      // Insert order
      const orderResult = db.prepare(
        `INSERT INTO orders (user_id, restaurant_id, status, total_price, delivery_fee, delivery_address, notes)
         VALUES (?, ?, 'pending', ?, ?, ?, ?)`
      ).run(userId, restaurantId, totalPrice, deliveryFee, deliveryAddress, notes || null);

      const orderId = orderResult.lastInsertRowid as number;

      // Insert order items
      const insertItem = db.prepare(
        `INSERT INTO order_items (order_id, menu_item_id, name, quantity, price)
         VALUES (?, ?, ?, ?, ?)`
      );

      for (const item of orderItems) {
        insertItem.run(orderId, item.menuItemId, item.name, item.quantity, item.price);
      }

      return orderId;
    });

    const orderId = transaction();

    return this.getOrderById(orderId, userId);
  }

  // Get user's orders
  getUserOrders(
    userId: number,
    status?: OrderStatus,
    page: number = 1,
    limit: number = 20
  ): PaginatedResponse<OrderWithDetails> {
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE o.user_id = ?';
    const params: (string | number)[] = [userId];

    if (status) {
      whereClause += ' AND o.status = ?';
      params.push(status);
    }

    // Get total count
    const countResult = db.prepare(
      `SELECT COUNT(*) as count FROM orders o ${whereClause}`
    ).get(...params) as { count: number };

    // Get orders with restaurant info
    const orders = db.prepare(
      `SELECT o.id, o.user_id, o.restaurant_id, o.status, o.total_price, o.delivery_fee,
              o.delivery_address, o.notes, o.created_at, o.updated_at,
              r.name as restaurant_name, r.image as restaurant_image
       FROM orders o
       JOIN restaurants r ON o.restaurant_id = r.id
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`
    ).all(...params, limit, offset) as (OrderRow & { restaurant_name: string; restaurant_image: string | null })[];

    // Get items for all orders
    const ordersWithDetails = orders.map(order => {
      const items = this.getOrderItems(order.id);
      return this.mapOrderWithDetails(order, items);
    });

    return {
      items: ordersWithDetails,
      total: countResult.count,
      page,
      totalPages: Math.ceil(countResult.count / limit),
    };
  }

  // Get single order by ID
  getOrderById(orderId: number, userId: number): OrderWithDetails {
    const order = db.prepare(
      `SELECT o.id, o.user_id, o.restaurant_id, o.status, o.total_price, o.delivery_fee,
              o.delivery_address, o.notes, o.created_at, o.updated_at,
              r.name as restaurant_name, r.image as restaurant_image
       FROM orders o
       JOIN restaurants r ON o.restaurant_id = r.id
       WHERE o.id = ?`
    ).get(orderId) as (OrderRow & { restaurant_name: string; restaurant_image: string | null }) | undefined;

    if (!order) {
      throw new NotFoundError('订单不存在');
    }

    if (order.user_id !== userId) {
      throw new ForbiddenError('无权访问此订单');
    }

    const items = this.getOrderItems(orderId);
    return this.mapOrderWithDetails(order, items);
  }

  // Cancel order
  cancelOrder(orderId: number, userId: number): void {
    const order = db.prepare(
      'SELECT id, user_id, status FROM orders WHERE id = ?'
    ).get(orderId) as { id: number; user_id: number; status: string } | undefined;

    if (!order) {
      throw new NotFoundError('订单不存在');
    }

    if (order.user_id !== userId) {
      throw new ForbiddenError('无权操作此订单');
    }

    if (order.status !== 'pending' && order.status !== 'paid') {
      throw new BadRequestError('当前订单状态不允许取消');
    }

    db.prepare(
      `UPDATE orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(orderId);
  }

  // Update order status (for admin/internal use)
  updateOrderStatus(orderId: number, status: OrderStatus): void {
    const result = db.prepare(
      `UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(status, orderId);

    if (result.changes === 0) {
      throw new NotFoundError('订单不存在');
    }
  }

  // Helper methods
  private getOrderItems(orderId: number): OrderItemRow[] {
    return db.prepare(
      `SELECT id, order_id, menu_item_id, name, quantity, price
       FROM order_items WHERE order_id = ?`
    ).all(orderId) as OrderItemRow[];
  }

  private mapOrderWithDetails(
    row: OrderRow & { restaurant_name: string; restaurant_image: string | null },
    items: OrderItemRow[]
  ): OrderWithDetails {
    return {
      id: row.id,
      userId: row.user_id,
      restaurantId: row.restaurant_id,
      status: row.status as OrderStatus,
      totalPrice: row.total_price,
      deliveryFee: row.delivery_fee,
      deliveryAddress: row.delivery_address,
      notes: row.notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      restaurant: {
        id: row.restaurant_id,
        name: row.restaurant_name,
        image: row.restaurant_image || undefined,
      },
      items: items.map(item => ({
        id: item.id,
        orderId: item.order_id,
        menuItemId: item.menu_item_id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
    };
  }
}

export const orderService = new OrderService();
