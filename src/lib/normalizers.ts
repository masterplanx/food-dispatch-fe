import type {
  Customer,
  CustomerRequest,
  Extra,
  Price,
  Product,
  ProductExtra,
  RequestItem,
  RequestStatus,
  Size,
  SizeProduct,
} from './types';

const statusDictionary: Record<string, RequestStatus> = {
  requested: 'requested',
  pending: 'requested',
  prepared: 'prepared',
  ready: 'prepared',
  fulfilled: 'fulfilled',
  delivered: 'fulfilled',
};

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeId = (value: any): number =>
  toNumber(value?.model_id ?? value?.ModelID ?? value?.id ?? value?.ID);

const normalizeTimestamp = (value: any): string => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }
  return new Date().toISOString();
};

const normalizeString = (value: any, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

export const normalizeSizeProduct = (input: any): SizeProduct => ({
  id: normalizeId(input),
  tenant_id: toNumber(input?.tenant_id ?? input?.TenantID),
  size_id: toNumber(input?.size_id ?? input?.SizeID),
  product_id: toNumber(input?.product_id ?? input?.ProductID),
});

export const normalizeProductExtra = (input: any): ProductExtra => ({
  id: normalizeId(input),
  tenant_id: toNumber(input?.tenant_id ?? input?.TenantID),
  product_id: toNumber(input?.product_id ?? input?.ProductID),
  extra_id: toNumber(input?.extra_id ?? input?.ExtraID),
});

export const normalizePrice = (input: any): Price => ({
  id: normalizeId(input),
  uuid: toNumber(input?.uuid ?? input?.UUID),
  version: toNumber(input?.version ?? input?.Version),
  tenant_id: toNumber(input?.tenant_id ?? input?.TenantID),
  size_id: input?.size_model_id
    ? toNumber(input?.size_model_id)
    : toNumber(input?.size_id ?? input?.SizeID),
  product_id: input?.product_model_id
    ? toNumber(input?.product_model_id)
    : toNumber(input?.product_id ?? input?.ProductID),
  extra_id: input?.extra_model_id
    ? toNumber(input?.extra_model_id)
    : toNumber(input?.extra_id ?? input?.ExtraID),
  price: toNumber(input?.price ?? input?.Price ?? 0),
});

export const normalizeSize = (input: any): Size => ({
  id: normalizeId(input),
  uuid: toNumber(input?.uuid ?? input?.UUID),
  version: toNumber(input?.version ?? input?.Version),
  tenant_id: toNumber(input?.tenant_id ?? input?.TenantID),
  name: normalizeString(input?.name ?? input?.Name, 'Tamaño'),
});

export const normalizeExtra = (input: any): Extra => ({
  id: normalizeId(input),
  uuid: toNumber(input?.uuid ?? input?.UUID),
  version: toNumber(input?.version ?? input?.Version),
  tenant_id: toNumber(input?.tenant_id ?? input?.TenantID),
  name: normalizeString(input?.name ?? input?.Name, 'Extra'),
  description: normalizeString(input?.description ?? input?.Description),
  extra_type_id: toNumber(input?.extra_type_id ?? input?.ExtraTypeID),
  depends_on: normalizeString(input?.depends_on ?? input?.DependsOn),
});

export const normalizeCustomer = (input: any): Customer => ({
  id: normalizeId(input),
  uuid: toNumber(input?.uuid ?? input?.UUID),
  version: toNumber(input?.version ?? input?.Version),
  tenant_id: toNumber(input?.tenant_id ?? input?.TenantID),
  name: normalizeString(input?.name ?? input?.Name, 'Cliente'),
  email: normalizeString(input?.email ?? input?.Email),
  phone: normalizeString(input?.phone ?? input?.Phone),
  address: normalizeString(input?.address ?? input?.Address),
  comments: normalizeString(input?.comments ?? input?.Comments),
});

export const normalizeProduct = (input: any): Product => ({
  id: normalizeId(input),
  uuid: toNumber(input?.uuid ?? input?.UUID),
  version: toNumber(input?.version ?? input?.Version),
  tenant_id: toNumber(input?.tenant_id ?? input?.TenantID),
  name: normalizeString(input?.name ?? input?.Name, 'Producto'),
  description: normalizeString(input?.description ?? input?.Description),
  product_category_id: toNumber(
    input?.product_category_id ?? input?.ProductCategoryID
  ),
  depends_on: normalizeString(input?.depends_on ?? input?.DependsOn),
  size_products: (input?.size_products ?? input?.SizeProducts ?? []).map(
    normalizeSizeProduct
  ),
  product_extras: (input?.product_extras ?? input?.ProductExtras ?? []).map(
    normalizeProductExtra
  ),
});

const normalizeOrderStatus = (status?: string): RequestStatus => {
  if (!status) {
    return 'requested';
  }
  return statusDictionary[status.toLowerCase()] ?? 'requested';
};

const normalizeOrderItem = (input: any): RequestItem => {
  const product =
    input?.Product || input?.product ? normalizeProduct(input.Product ?? input.product) : normalizeProduct({});
  const size =
    input?.Size || input?.size ? normalizeSize(input.Size ?? input.size) : normalizeSize({});
  const extras = (input?.OrderItemExtras ?? input?.order_item_extras ?? []).map(
    (extraWrapper: any) => normalizeExtra(extraWrapper?.Extra ?? extraWrapper)
  );

  return {
    id: `order_item_${normalizeId(input)}`,
    product,
    size,
    extras,
    quantity: toNumber(input?.quantity ?? input?.Quantity ?? 1),
    totalPrice: toNumber(input?.total_price ?? input?.TotalPrice ?? 0),
  };
};

export const normalizeOrder = (input: any): CustomerRequest => {
  const modelId = normalizeId(input);
  const dbId = toNumber(input?.id ?? input?.ID);
  const customer = input?.Customer ?? input?.customer ?? {};
  const customerName = normalizeString(
    customer?.name ?? customer?.Name,
    'Cliente'
  );
  const status = normalizeOrderStatus(
    input?.last_status ?? input?.LastStatus ?? input?.status
  );
  const orderItems = (input?.OrderItems ?? input?.order_items ?? []).map(
    normalizeOrderItem
  );

  const totalAmount = orderItems.reduce(
    (acc, item) => acc + item.totalPrice,
    0
  );

  return {
    id: `order_${modelId}`,
    modelId,
    dbId,
    customerName,
    deliveryDate: normalizeTimestamp(
      input?.delivery_date ?? input?.DeliveryDate ?? input?.CreatedAt ?? input?.created_at
    ),
    status,
    items: orderItems,
    totalAmount,
  };
};

