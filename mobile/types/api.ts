export type Role = "customer" | "kitchen_owner" | "admin";

export interface NotificationPreferences {
  order_updates: boolean;
  chat_messages: boolean;
  announcements: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  avatar: string | null;
  status: "active" | "suspended";
  notification_preferences: NotificationPreferences;
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

export interface Address {
  id: string;
  label: string;
  full_address: string;
  area: string | null;
  city: string | null;
  location: GeoPoint | null;
  is_default: boolean;
  instructions: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  image: string | null;
}

export interface BusinessHourEntry {
  day: string;
  open_time: string;
  close_time: string;
  closed: boolean;
}

export type KitchenPaymentMethod = "easypaisa" | "jazzcash" | "bank_transfer";

export interface PaymentDetails {
  method: KitchenPaymentMethod | null;
  account_title: string | null;
  account_number: string | null;
  bank_name: string | null;
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
  subscription_plan: "free" | "pro";
  payment_details: PaymentDetails;
  auto_accept_orders: boolean;
  distance_km?: number;
}

export type SpiceLevel = "mild" | "medium" | "spicy";

export interface CustomizationOption {
  name: string;
  price_delta: number;
}

export interface FoodItem {
  id: string;
  kitchen_id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category_id: string | null;
  ingredients: string[];
  portion: string;
  preparation_time_minutes: number;
  spice_level: SpiceLevel;
  customization_options: CustomizationOption[];
  available: boolean;
  rating: number;
  review_count: number;
}

export interface OrderItem {
  item_id: string;
  food_id: string;
  name: string;
  image: string | null;
  price: number;
  quantity: number;
  customizations: string[];
  special_instructions: string | null;
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

export type PaymentMethod = "cod" | "easypaisa" | "jazzcash" | "card" | "bank_transfer";

export interface OrderStatusEvent {
  status: OrderStatus;
  at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name?: string;
  customer_phone?: string | null;
  customer_avatar?: string | null;
  kitchen_id: string;
  kitchen_name: string;
  kitchen_phone?: string | null;
  can_chat: boolean;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  service_fee: number;
  discount: number;
  total: number;
  address: Omit<Address, "id" | "is_default">;
  payment_method: PaymentMethod;
  payment_status: "pending" | "paid" | "failed" | "refunded";
  order_status: OrderStatus;
  status_history: OrderStatusEvent[];
  notes: string | null;
  scheduled_for: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  order_id: string;
  sender_id: string;
  sender_role: "customer" | "kitchen_owner";
  text: string;
  created_at: string;
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

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
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
    details?: unknown;
  };
}

export interface KitchenEarningsSummary {
  today_sales: number;
  today_orders: number;
  total_earnings: number;
  pending_orders: number;
  active_orders: number;
  completed_orders: number;
  popular_foods: { name: string; quantity: number }[];
}

export type SubscriptionPlanId = "free" | "pro";
export type SubscriptionPaymentMethod = "easypaisa" | "bank_transfer" | "card";

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  price: number;
  billing_cycle: string;
  features: string[];
}

export interface SubscriptionStatus {
  plan: SubscriptionPlanId;
  expires_at: string | null;
}
