'use client';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/auth-context';
import type { Price } from '@/lib/types';
import { normalizePrice } from '@/lib/normalizers';
import { API_URL } from '@/lib/config';

const PRICES_API_URL = `${API_URL}/prices`;

export function usePrices() {
  const [prices, setPrices] = useState<Price[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const fetchPrices = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const response = await axios.get(PRICES_API_URL);
      setPrices((response.data ?? []).map((item: any) => normalizePrice(item)));
    } catch (error) {
      console.error('Failed to fetch prices:', error);
      setPrices([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  const setPricesBatch = async (pricesToUpdate: Partial<Price>[]) => {
    setIsLoading(true);
    try {
      await Promise.all(
        pricesToUpdate.map((price) => {
          if (price.id) {
            return axios.put(`${PRICES_API_URL}/${price.id}`, price);
          }
          return axios.post(PRICES_API_URL, price);
        })
      );
      await fetchPrices();
    } catch (error) {
      console.error('Failed to update prices:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { prices, isLoading, setPrices: setPricesBatch, refetch: fetchPrices };
}
