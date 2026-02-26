'use client';

import { useCallback } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { useAuth } from '@/contexts/auth-context';
import type { Customer } from '@/lib/types';
import { normalizeCustomer } from '@/lib/normalizers';
import { swrFetcher } from '@/lib/swr-fetcher';
import { API_URL } from '@/lib/config';

const CUSTOMERS_API_URL = `${API_URL}/customers`;

export function useCustomers() {
  const { isAuthenticated } = useAuth();
  const shouldFetch = isAuthenticated ? CUSTOMERS_API_URL : null;
  const {
    data,
    isLoading,
    mutate,
  } = useSWR<Customer[] | undefined>(
    shouldFetch,
    async (url: string) => {
      const raw = await swrFetcher<any[]>(url);
      return (raw ?? []).map((item) => normalizeCustomer(item));
    },
    { keepPreviousData: true }
  );

  const searchByName = useCallback(async (term: string, signal?: AbortSignal) => {
    if (!term) return [];
    const response = await axios.get(
      `/api/customers/search/name/${encodeURIComponent(term)}`,
      { signal }
    );
    return (response.data ?? []).map((item: any) => normalizeCustomer(item));
  }, []);

  const createCustomer = useCallback(
    async (payload: Partial<Customer>) => {
      const response = await axios.post(CUSTOMERS_API_URL, payload);
      const created = normalizeCustomer(response.data);
      await mutate(
        (existing) => [ ...(existing ?? []), created ],
        { revalidate: false }
      );
      return created;
    },
    [mutate]
  );

  return {
    customers: data ?? [],
    isLoading,
    searchByName,
    createCustomer,
    refetch: mutate,
  };
}
