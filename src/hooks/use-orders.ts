'use client';

import { useCallback } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { useAuth } from '@/contexts/auth-context';
import type { CustomerRequest, RequestStatus } from '@/lib/types';
import { normalizeOrder } from '@/lib/normalizers';
import { swrFetcher } from '@/lib/swr-fetcher';
import { API_URL } from '@/lib/config';

const ORDERS_API_URL = `${API_URL}/orders`;

export function useOrders() {
  const { isAuthenticated } = useAuth();
  const shouldFetch = isAuthenticated ? ORDERS_API_URL : null;
  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<CustomerRequest[] | undefined>(
    shouldFetch,
    async (url: string) => {
      const raw = await swrFetcher<any[]>(url);
      return (raw ?? []).map((order) => normalizeOrder(order));
    },
    { keepPreviousData: true }
  );

  const setStatus = useCallback(
    async (order: CustomerRequest, status: RequestStatus) => {
      await axios.post('/api/order-statuses', {
        status,
        order_model_id: order.modelId,
        OrderID: order.dbId,
      });
      await mutate();
    },
    [mutate]
  );

  const deleteOrder = useCallback(
    async (order: CustomerRequest) => {
      await axios.delete(`${ORDERS_API_URL}/${order.modelId}`);
      await mutate();
    },
    [mutate]
  );

  const getOrderStatuses = useCallback(async (order: CustomerRequest) => {
    const response = await axios.get(`/api/orders/${order.modelId}/statuses`);
    return response.data ?? [];
  }, []);

  return {
    orders: data ?? [],
    isLoading,
    error,
    refresh: mutate,
    setStatus,
    deleteOrder,
    getOrderStatuses,
  };
}
