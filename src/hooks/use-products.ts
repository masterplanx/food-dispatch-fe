'use client';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/auth-context';
import type { Product } from '@/lib/types';
import { normalizeProduct } from '@/lib/normalizers';
import { API_URL } from '@/lib/config';

const PRODUCTS_API_URL = `${API_URL}/products`;

const getModelId = (entity: any): number =>
  entity?.model_id ?? entity?.ModelID ?? entity?.id ?? entity?.ID ?? 0;

type ProductData = {
  name: string;
  description?: string;
  product_category_id: number;
};

type ProductRelationships = {
  size_ids: number[];
  extra_ids: number[];
};

const replaceSizeProducts = async (productModelId: number, sizeIds: number[]) => {
  const existing = await axios.get(`/api/products/${productModelId}/size-products`);
  const currentLinks: any[] = existing.data ?? [];

  await Promise.all(
    currentLinks.map((link) => axios.delete(`/api/size-products/${getModelId(link)}`))
  );

  await Promise.all(
    sizeIds.map((sizeId) =>
      axios.post('/api/size-products', {
        product_model_id: productModelId,
        size_model_id: sizeId,
      })
    )
  );
};

const replaceProductExtras = async (productModelId: number, extraIds: number[]) => {
  const existing = await axios.get(`/api/products/${productModelId}/product-extras`);
  const currentLinks: any[] = existing.data ?? [];

  await Promise.all(
    currentLinks.map((link) => axios.delete(`/api/product-extras/${getModelId(link)}`))
  );

  await Promise.all(
    extraIds.map((extraId) =>
      axios.post('/api/product-extras', {
        product_model_id: productModelId,
        extra_model_id: extraId,
      })
    )
  );
};

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const fetchProducts = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const response = await axios.get(PRODUCTS_API_URL);
      const normalized = (response.data ?? []).map((item: any) => normalizeProduct(item));
      setProducts(normalized);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addProduct = async (
    productData: ProductData,
    relationships: ProductRelationships
  ) => {
    const response = await axios.post(PRODUCTS_API_URL, productData);
    const createdProduct = normalizeProduct(response.data);

    if (relationships.size_ids?.length) {
      await replaceSizeProducts(createdProduct.id, relationships.size_ids);
    }
    if (relationships.extra_ids?.length) {
      await replaceProductExtras(createdProduct.id, relationships.extra_ids);
    }

    await fetchProducts();
    return createdProduct;
  };

  const updateProduct = async (
    id: number,
    productData: Partial<ProductData>,
    relationships: Partial<ProductRelationships>
  ) => {
    const response = await axios.put(`${PRODUCTS_API_URL}/${id}`, productData);

    if (relationships.size_ids) {
      await replaceSizeProducts(id, relationships.size_ids);
    }
    if (relationships.extra_ids) {
      await replaceProductExtras(id, relationships.extra_ids);
    }

    await fetchProducts();
    return normalizeProduct(response.data);
  };

  const deleteProduct = async (id: number) => {
    await axios.delete(`${PRODUCTS_API_URL}/${id}`);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  return { products, isLoading, addProduct, updateProduct, deleteProduct, refetch: fetchProducts };
}
