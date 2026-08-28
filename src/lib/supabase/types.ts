// Types écrits à la main d'après supabase/schema.sql, en attendant de pouvoir
// lancer `npx supabase gen types typescript --project-id <id> --schema public`
// une fois le projet Supabase connecté (voir ROADMAP.md, Phase 0).
// Remplacer ce fichier par la sortie de cette commande dès que possible : les
// types ci-dessous sont fidèles au schéma mais maintenus manuellement.

export type UserRole = "user" | "agent" | "delivery" | "admin";
export type VehicleType = "moto" | "velo" | "voiture" | "a_pied";
export type SubscriptionPlan = "free" | "pro";
export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
export type AffiliateStatus = "pending" | "confirmed" | "paid";
export type PayoutStatus = "pending" | "paid";

interface Profile {
  id: string;
  phone: string | null;
  name: string | null;
  avatar_url: string | null;
  country_code: string;
  role: UserRole;
  is_pro: boolean;
  agent_code: string | null;
  agent_commission: number;
  agent_id: string | null;
  affiliate_code: string | null;
  created_at: string;
}

interface Shop {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string | null;
  whatsapp_number: string;
  country_code: string;
  currency_symbol: string;
  logo_url: string | null;
  category: string | null;
  is_active: boolean;
  is_verified: boolean;
  is_sponsored: boolean;
  created_by_agent_id: string | null;
  created_at: string;
}

interface Category {
  id: string;
  name_fr: string;
  icon: string | null;
}

interface Product {
  id: string;
  shop_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  promo_price: number | null;
  quantity: number;
  sizes: string[] | null;
  is_active: boolean;
  is_sponsored: boolean;
  reseller_commission_pct: number;
  view_count: number;
  created_at: string;
}

interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: string;
  position: number;
}

interface DeliveryZone {
  id: string;
  shop_id: string;
  zone_name: string;
  price: number;
  estimated_delay: string | null;
  free_above: number | null;
}

interface DeliveryPartner {
  id: string;
  user_id: string | null;
  shop_id: string;
  name: string;
  whatsapp_number: string;
  city: string;
  vehicle_type: VehicleType;
  is_active: boolean;
  created_at: string;
}

interface Order {
  id: string;
  shop_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  customer_address: string;
  customer_city: string | null;
  delivery_zone_id: string | null;
  delivery_partner_id: string | null;
  delivery_fee: number;
  total_amount: number;
  status: OrderStatus;
  seller_notification_status: string | null;
  seller_notification_phone: string | null;
  seller_notified_at: string | null;
  created_at: string;
}

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  size: string | null;
}

interface Review {
  id: string;
  shop_id: string;
  product_id: string | null;
  customer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  is_active: boolean;
  payment_reference: string | null;
  ends_at: string | null;
  created_at: string;
}

interface AffiliateReferral {
  id: string;
  referrer_id: string;
  product_id: string | null;
  order_id: string | null;
  affiliate_code: string;
  commission_amount: number;
  commission_pct: number;
  status: AffiliateStatus;
  created_at: string;
}

interface AffiliateClick {
  id: string;
  referrer_id: string;
  product_id: string | null;
  affiliate_code: string;
  created_at: string;
}

interface AgentCommissionPayout {
  id: string;
  agent_id: string;
  seller_id: string;
  period_month: string;
  amount: number;
  status: PayoutStatus;
  paid_at: string | null;
  created_at: string;
}

interface PushToken {
  id: string;
  user_id: string;
  token: string;
  platform: string;
  created_at: string;
  updated_at: string;
}

interface WhatsappOtpCode {
  id: string;
  phone: string;
  otp: string;
  expires_at: string;
  created_at: string;
}

type TableDef<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
};

export interface Database {
  public: {
    Tables: {
      profiles: TableDef<Profile>;
      shops: TableDef<Shop>;
      categories: TableDef<Category>;
      products: TableDef<Product>;
      product_images: TableDef<ProductImage>;
      delivery_zones: TableDef<DeliveryZone>;
      delivery_partners: TableDef<DeliveryPartner>;
      orders: TableDef<Order>;
      order_items: TableDef<OrderItem>;
      reviews: TableDef<Review>;
      subscriptions: TableDef<Subscription>;
      affiliate_referrals: TableDef<AffiliateReferral>;
      affiliate_clicks: TableDef<AffiliateClick>;
      agent_commission_payouts: TableDef<AgentCommissionPayout>;
      push_tokens: TableDef<PushToken>;
      whatsapp_otp_codes: TableDef<WhatsappOtpCode>;
    };
  };
}
