/**
 * TypeScript types for elbi.de Storefront
 */

export interface Category {
  id: string;
  parent_id?: string | null;
  title: string;
  slug: string;
  short_desc?: string | null;
  long_desc?: string | null;
  description?: string;
  sort_order?: number;
  product_count?: number;
  thumb_url?: string | null;
}

export interface Product {
  id: string;
  parent_id?: string | null;
  sku: string;
  title: string;
  slug: string;
  sort_order?: number;
  short_desc?: string | null;
  short_description?: string;
  long_desc?: string | null;
  description?: string;
  price_cents: number;
  currency?: string;
  vat_percent?: number;
  vat_rate?: number;
  stock?: number;
  stock_quantity: number;
  is_active?: number | boolean;
  var_name?: string | null;
  var_select?: string | null;
  main_image_url?: string | null;
  image_url?: string;
  category_id?: string;
  category_title?: string;
  category_slug?: string;
  category_slugs?: string[];
  gallery_images?: string[];
  tags?: string[];
}

export interface CartItem {
  id: string;
  sku: string;
  title: string;
  price_cents: number;
  quantity: number;
  vat_percent?: number;
  image_url?: string;
}

export interface Address {
  first_name: string;
  last_name: string;
  company?: string;
  street: string;
  street_nr: string;
  zip: string;
  city: string;
  country: string;
  phone?: string;
}

export interface WithdrawalReceipt {
  withdrawal_nr: string;
  order_nr: string;
  customer_name: string;
  customer_email: string;
  items_description: string;
  status: string;
  created_at: string;
}
