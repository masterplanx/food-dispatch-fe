'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/auth-context';
import type { ProductCategory } from '@/lib/types';
import { normalizeProductCategory } from '@/lib/normalizers';
import { API_URL } from '@/lib/config';

const PRODUCT_CAT_API_URL = `${API_URL}/product-categories`;

export function useProductCategories() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const fetchCategories = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const response = await axios.get(PRODUCT_CAT_API_URL);
      setCategories((response.data ?? []).map((item: any) => normalizeProductCategory(item)));
    } catch (error) {
      console.error('Failed to fetch product categories:', error);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const addCategory = async (payload: { category: string; description?: string }) => {
    const response = await axios.post(PRODUCT_CAT_API_URL, payload);
    const created = normalizeProductCategory(response.data);
    setCategories((prev) => [...prev, created]);
    return created;
  };

  return {
    categories,
    isLoading,
    addCategory,
    refetch: fetchCategories,
  };
}

