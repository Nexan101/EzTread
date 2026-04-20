export interface Shop {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  google_rating: number | null;
  premium_tier: "free" | "premium";
  stripe_customer_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface ShopServices {
  id: string;
  shop_id: string;
  mounting_balancing_per_tire: number;
  valve_stems_per_tire: number;
  disposal_per_tire: number;
  tpms_per_tire: number;
  alignment_cost: number | null;
  free_rotation: boolean;
  road_hazard_per_tire: number | null;
  updated_at: string;
}

export interface ShopTireRange {
  id: string;
  shop_id: string;
  tier: "budget" | "mid-range" | "premium";
  min_price: number;
  max_price: number;
  example_brands: string | null;
  updated_at: string;
}

export interface Lead {
  id: string;
  shop_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  tire_size: string | null;
  quality_tier: string | null;
  quantity: number;
  status: "new" | "contacted" | "converted" | "lost";
  charged: boolean;
  amount: number | null;
  created_at: string;
  shop?: Pick<Shop, "id" | "name" | "city">;
}

export interface ShopWithRelations extends Shop {
  shop_services: ShopServices | null;
  shop_tire_ranges: ShopTireRange[];
  leads?: Lead[];
}

export interface DashboardStats {
  totalShops: number;
  shopsThisMonth: number;
  totalLeads: number;
  leadsThisMonth: number;
  revenueThisMonth: number;
  recentShops: Shop[];
  recentLeads: Lead[];
}
