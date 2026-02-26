'use client';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/auth-context';
import type { Extra } from '@/lib/types';
import { normalizeExtra } from '@/lib/normalizers';
import { API_URL } from '@/lib/config';

const EXTRAS_API_URL = `${API_URL}/extras`;

export function useExtras() {
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const fetchExtras = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const response = await axios.get(EXTRAS_API_URL);
      setExtras((response.data ?? []).map((item: any) => normalizeExtra(item)));
    } catch (error) {
      console.error('Failed to fetch extras:', error);
      setExtras([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchExtras();
  }, [fetchExtras]);

  const addExtra = async (data: { name: string; description?: string }) => {
    const response = await axios.post(EXTRAS_API_URL, { ...data, extra_type_model_id: 1 });
    const created = normalizeExtra(response.data);
    setExtras((prev) => [...prev, created]);
    return created;
  };

  const updateExtra = async (id: number, data: { name: string; description?: string }) => {
    const response = await axios.put(`${EXTRAS_API_URL}/${id}`, { ...data, extra_type_model_id: 1 });
    const updated = normalizeExtra(response.data);
    setExtras((prev) => prev.map((extra) => (extra.id === id ? updated : extra)));
    return updated;
  };

  const deleteExtra = async (id: number) => {
    await axios.delete(`${EXTRAS_API_URL}/${id}`);
    setExtras((prev) => prev.filter((extra) => extra.id !== id));
  };

  return { extras, isLoading, addExtra, updateExtra, deleteExtra, refetch: fetchExtras };
}
