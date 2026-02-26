'use client';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/auth-context';
import type { Size } from '@/lib/types';
import { normalizeSize } from '@/lib/normalizers';
import { API_URL } from '@/lib/config';

const SIZES_API_URL = `${API_URL}/sizes`;

export function useSizes() {
  const [sizes, setSizes] = useState<Size[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const fetchSizes = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const response = await axios.get(SIZES_API_URL);
      setSizes((response.data ?? []).map((item: any) => normalizeSize(item)));
    } catch (error) {
      console.error('Failed to fetch sizes:', error);
      setSizes([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchSizes();
  }, [fetchSizes]);

  const addSize = async (data: { name: string }) => {
    const response = await axios.post(SIZES_API_URL, data);
    const created = normalizeSize(response.data);
    setSizes((prev) => [...prev, created]);
    return created;
  };

  const updateSize = async (id: number, data: { name: string }) => {
    const response = await axios.put(`${SIZES_API_URL}/${id}`, data);
    const updated = normalizeSize(response.data);
    setSizes((prev) => prev.map((size) => (size.id === id ? updated : size)));
    return updated;
  };

  const deleteSize = async (id: number) => {
    await axios.delete(`${SIZES_API_URL}/${id}`);
    setSizes((prev) => prev.filter((size) => size.id !== id));
  };

  return { sizes, isLoading, addSize, updateSize, deleteSize, refetch: fetchSizes };
}
