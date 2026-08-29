// Types écrits à la main d'après supabase/schema.sql, en attendant de pouvoir
// lancer `npx supabase gen types typescript --project-id <id> --schema public`
// une fois le projet Supabase connecté (voir ROADMAP.md, Phase 0).
// Remplacer ce fichier par la sortie de cette commande dès que possible : les
// types ci-dessous sont fidèles au schéma mais maintenus manuellement.

// Les tables sont décrites avec des alias de type (et non des interfaces) :
// postgrest-js exige Row extends Record<string, unknown>, ce qu'une interface ne
// satisfait pas (pas de signature d'index implicite) — l'inférence de
// .select("a, b") retomberait alors sur never.

export type UserRole = "user" | "agent" | "delivery" | "reseller" | "admin";
export type VehicleType = "moto" | "velo" | "voiture" | "a_pied";
export type SubscriptionPlan = "free" | "pro";
export type OrderSource = "storefront" | "whatsapp" | "manual";
export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
export type AffiliateStatus = "pending" | "confirmed" | "paid";
export type PayoutStatus = "pending" | "paid";
export type PaymentProvider = "manual" | "gnakrypay";
export type PaymentStatus = "pending" | "confirmed" | "rejected";

type Profile = {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  avatar_url: string | null;
  country_code: string;
  role: UserRole;
  is_pro: boolean;
  agent_code: string | null;
  agent_commission: number;
  agent_id: string | null;
  agent_verified_at: string | null;
  affiliate_code: string | null;
  created_at: string;
}

type Shop = {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string | null;
  whatsapp_number: string | null;
  mobile_money_number: string | null;
  country_code: string;
  currency_symbol: string;
  logo_url: string | null;
  primary_color: string;
  category: string | null;
  onboarding_step: number;
  published_at: string | null;
  is_active: boolean;
  is_verified: boolean;
  is_sponsored: boolean;
  created_by_agent_id: string | null;
  created_at: string;
}

type Category = {
  id: string;
  name_fr: string;
  icon: string | null;
}

type Product = {
  id: string;
  shop_id: string;
  category_id: string | null;
  name: string;
  slug: string;
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

type ProductImage = {
  id: string;
  product_id: string;
  url: string;
  alt_text: string;
  position: number;
}

type DeliveryZone = {
  id: string;
  shop_id: string;
  zone_name: string;
  price: number;
  estimated_delay: string | null;
  free_above: number | null;
}

type DeliveryPartner = {
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

type Order = {
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
  source: OrderSource;
  seller_notification_status: string | null;
  seller_notification_phone: string | null;
  seller_notified_at: string | null;
  created_at: string;
}

type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  size: string | null;
}

type Review = {
  id: string;
  shop_id: string;
  product_id: string | null;
  customer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

type Subscription = {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  is_active: boolean;
  payment_reference: string | null;
  ends_at: string | null;
  created_at: string;
}

type AffiliateReferral = {
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

type AffiliateClick = {
  id: string;
  referrer_id: string;
  product_id: string | null;
  affiliate_code: string;
  created_at: string;
}

type AgentCommissionPayout = {
  id: string;
  agent_id: string;
  seller_id: string;
  period_month: string;
  amount: number;
  status: PayoutStatus;
  paid_at: string | null;
  created_at: string;
}

type Payment = {
  id: string;
  user_id: string;
  subscription_id: string | null;
  provider: PaymentProvider;
  amount: number;
  currency: string;
  reference: string | null;
  payer_phone: string | null;
  status: PaymentStatus;
  created_at: string;
  confirmed_at: string | null;
};

type ShopVisit = {
  id: string;
  shop_id: string;
  product_id: string | null;
  visitor_hash: string | null;
  created_at: string;
};

type PushToken = {
  id: string;
  user_id: string;
  token: string;
  platform: string;
  created_at: string;
  updated_at: string;
}

// Forme attendue par supabase-js : sans Relationships (et sans Views/Functions
// plus bas), l'inférence des colonnes dans .select("a, b") retombe sur never.
type TableDef<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
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
      shop_visits: TableDef<ShopVisit>;
      payments: TableDef<Payment>;
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      vehicle_type: VehicleType;
      subscription_plan: SubscriptionPlan;
      order_status: OrderStatus;
      order_source: OrderSource;
      affiliate_status: AffiliateStatus;
      payout_status: PayoutStatus;
      payment_provider: PaymentProvider;
      payment_status: PaymentStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
