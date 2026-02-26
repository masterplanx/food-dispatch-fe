export interface PriceBySize {
  sizeId: string;
  price: number;
}

export interface SizeProduct {
  id: number;
  tenant_id: number;
  size_id: number;
  product_id: number;
}

export interface ProductExtra {
  id: number;
  tenant_id: number;
  product_id: number;
  extra_id: number;
}

export interface Price {
  id: number;
  uuid: number;
  version: number;
  tenant_id: number;
  size_id?: number;
  product_id?: number;
  extra_id?: number;
  price: number;
}

export interface ProductCategory {
  id: number;
  uuid: number;
  version: number;
  tenant_id: number;
  category: string;
}

export interface Product {
  id: number;
  uuid: number;
  version: number;
  tenant_id: number;
  name: string;
  description: string;
  product_category_id: number;
  depends_on?: string;
  size_products: SizeProduct[];
  product_extras: ProductExtra[];
}

export interface Size {
  id: number;
  uuid: number;
  version: number;
  tenant_id: number;
  name: string;
}

export interface Extra {
  id: number;
  uuid: number;
  version: number;
  tenant_id: number;
  name: string;
  description: string;
  extra_type_id: number;
  depends_on?: string;
}

export interface Tenant {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  uuid: number;
  version: number;
  tenant_id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  comments?: string;
}

export type RequestStatus = 'requested' | 'prepared' | 'fulfilled';

export interface RequestItem {
  id: string;
  product: Product;
  size: Size;
  extras: Extra[];
  quantity: number;
  totalPrice: number;
}

export interface CustomerRequest {
  id: string;
  modelId: number;
  dbId?: number;
  customerName: string;
  deliveryDate: string;
  status: RequestStatus;
  items: RequestItem[];
  totalAmount: number;
}

export interface User {
  id: number;
  tenant_id: number;
  tenant: Tenant;
  is_tenant_owner: boolean;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  expires_at: string;
}
