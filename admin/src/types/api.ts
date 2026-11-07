export type Role = "customer" | "kitchen_owner" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  avatar: string | null;
  status: "active" | "suspended";
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface BusinessHourEntry {
  day: string;
  open_time: string;
  close_time: string;
  closed: boolean;
}

export interface Kitchen {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  images: string[];
  location: GeoPoint | null;
  address: string;
  cuisine_tags: string[];
  business_hours: BusinessHourEntry[];
  rating: number;
  review_count: number;
  verified: boolean;
  is_open: boolean;
  status: "pending" | "approved" | "rejected" | "suspended";
}

export interface FoodItem {
  id: string;
  kitchen_id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category_id: string | null;
  available: boolean;
  rating: number;
  review_count: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  image: string | null;
}

export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "rejected"
  | "cancelled";

export interface OrderItem {
  item_id: string;
  food_id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  kitchen_id: string;
  kitchen_name: string;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  service_fee: number;
  discount: number;
  total: number;
  payment_method: string;
  payment_status: string;
  order_status: OrderStatus;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  order_id: string;
  kitchen_id: string;
  food_id: string | null;
  customer_id: string;
  customer_name: string;
  food_rating: number;
  kitchen_rating: number;
  delivery_rating: number;
  comment: string | null;
  created_at: string;
}

export interface Payment {
  order_id: string;
  method: string;
  amount: number;
  status: string;
  created_at: string;
}

export interface DashboardStats {
  total_customers: number;
  total_kitchens: number;
  verified_kitchens: number;
  pending_kitchen_approvals: number;
  total_orders: number;
  today_orders: number;
  active_orders: number;
  platform_revenue: number;
  gross_merchandise_value: number;
}

export interface PagedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}
