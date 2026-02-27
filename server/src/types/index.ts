// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

// User types
export interface User {
  id: number;
  username: string;
  email: string;
  phone?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithPassword extends User {
  passwordHash: string;
}

// Restaurant types
export interface Restaurant {
  id: number;
  name: string;
  description?: string;
  image?: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  minOrder: number;
  status: 'active' | 'inactive';
  tags?: string[];
  categories?: Category[];
}

export interface Category {
  id: number;
  restaurantId: number;
  name: string;
  sortOrder: number;
}

export interface MenuItem {
  id: number;
  restaurantId: number;
  categoryId: number;
  name: string;
  description?: string;
  price: number;
  image?: string;
  status: 'available' | 'sold_out';
}

export interface MenuCategory extends Category {
  items: MenuItem[];
}

// Order types
export type OrderStatus = 'pending' | 'paid' | 'preparing' | 'delivering' | 'completed' | 'cancelled';

export interface Order {
  id: number;
  userId: number;
  restaurantId: number;
  status: OrderStatus;
  totalPrice: number;
  deliveryFee: number;
  deliveryAddress: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  menuItemId: number;
  name: string;
  quantity: number;
  price: number;
}

export interface OrderWithDetails extends Order {
  restaurant: {
    id: number;
    name: string;
    image?: string;
  };
  items: OrderItem[];
}

// Address types
export interface Address {
  id: number;
  userId: number;
  name: string;
  phone: string;
  address: string;
  detail?: string;
  isDefault: boolean;
  createdAt: string;
}

// Request body types
export interface RegisterBody {
  username: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface CreateOrderBody {
  restaurantId: number;
  items: {
    menuItemId: number;
    quantity: number;
  }[];
  deliveryAddressId: number;
  notes?: string;
}

export interface CreateAddressBody {
  name: string;
  phone: string;
  address: string;
  detail?: string;
  isDefault?: boolean;
}

export interface UpdateAddressBody extends Partial<CreateAddressBody> {}

export interface UpdateProfileBody {
  username?: string;
  phone?: string;
  avatar?: string;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}
