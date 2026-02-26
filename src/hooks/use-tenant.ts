

'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/auth-context';
import type { Tenant } from '@/lib/types';
import { API_URL } from '@/lib/config';

const TENANT_API_URL = `${API_URL}/tenants`;

export function useTenant() {
  const { tenant, user, logout, setTenant } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const updateTenant = async (name: string) => {
    if (!tenant) throw new Error('Tenant not loaded');
    // Handle both PascalCase and camelCase
    const tenantId = (tenant as any).ID || tenant.id;
    setIsLoading(true);
    try {
        const response = await axios.put(`${TENANT_API_URL}/${tenantId}`, { name });
        setTenant(response.data);
        return response.data;
    } catch(err) {
        setError(err);
        throw err;
    } finally {
        setIsLoading(false);
    }
  };

  const deleteTenant = async () => {
    if (!tenant) throw new Error('Tenant not loaded');
    // Handle both PascalCase and camelCase
    const tenantId = (tenant as any).ID || tenant.id;
    setIsLoading(true);
     try {
        await axios.delete(`${TENANT_API_URL}/${tenantId}`);
        await logout();
    } catch(err) {
        setError(err);
        throw err;
    } finally {
        setIsLoading(false);
    }
  };

  return { tenant, isLoading, error, updateTenant, deleteTenant };
}
