export interface ShopSignupEmailData {
  shopName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  shopId: string;
}

export interface AdminNewShopEmailData {
  shopName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  shopId: string;
}

export interface EmailResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

export type EmailType =
  | "shop_signup_confirmation"
  | "admin_new_shop_notification"
  | "shop_deletion_confirmation";
