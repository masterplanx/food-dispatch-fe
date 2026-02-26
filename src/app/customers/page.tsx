'use client';

import { MainLayout } from '@/components/main-layout';
import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { CustomerRequest, RequestStatus } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { useCustomers } from '@/hooks/use-customers';
import { useOrders } from '@/hooks/use-orders';
import { useToast } from '@/hooks/use-toast';

const statusTranslations: Record<RequestStatus, string> = {
  requested: 'Solicitado',
  prepared: 'Preparado',
  fulfilled: 'Entregado',
};

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<CustomerRequest['customerName'][]>([]);
  const [isRemoteSearching, setIsRemoteSearching] = useState(false);
  const { customers, isLoading: customersLoading, searchByName } = useCustomers();
  const { orders, isLoading: ordersLoading, setStatus } = useOrders();
  const { toast } = useToast();

  useEffect(() => {
    if (!searchTerm) {
      setSearchResults([]);
      return;
    }

    const normalized = searchTerm.toLowerCase();
    const localMatches = customers
      .filter((customer) => customer.name.toLowerCase().includes(normalized))
      .map((customer) => customer.name);
    setSearchResults(localMatches);

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setIsRemoteSearching(true);
        const remote = await searchByName(searchTerm, controller.signal);
        if (!controller.signal.aborted) {
          setSearchResults(remote.map((customer) => customer.name));
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Customer search failed', error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsRemoteSearching(false);
        }
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timer);
      setIsRemoteSearching(false);
    };
  }, [searchTerm, customers, searchByName]);

  const groupedByCustomer = useMemo(() => {
    if (!searchTerm) return [];
    const names = searchResults.length ? searchResults : customers.map((c) => c.name);
    return names
      .map((name) => {
        const normalizedName = name.toLowerCase();
        const customerOrders = orders.filter(
          (order) => order.customerName.toLowerCase() === normalizedName
        );
        return {
          name,
          pending: customerOrders.filter((order) => order.status !== 'fulfilled'),
          fulfilled: customerOrders.filter((order) => order.status === 'fulfilled'),
        };
      })
      .filter((entry) => entry.pending.length || entry.fulfilled.length);
  }, [customers, orders, searchResults, searchTerm]);

  const handleStatusChange = async (order: CustomerRequest, status: RequestStatus) => {
    try {
      await setStatus(order, status);
      toast({ title: 'Estado actualizado' });
    } catch {
      toast({ variant: 'destructive', title: 'No se pudo actualizar el estado' });
    }
  };

  const loading = customersLoading || ordersLoading;
  const showEmptyState = searchTerm && !loading && groupedByCustomer.length === 0 && !isRemoteSearching;

  return (
    <MainLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Vista de Pedidos por Cliente</CardTitle>
            <CardDescription>
              Busca un cliente para ver sus pedidos pendientes y completados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input
              placeholder="Buscar por nombre de cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading}
            />
            {isRemoteSearching && (
              <p className="text-xs text-muted-foreground">Buscando coincidencias...</p>
            )}
          </CardContent>
        </Card>

        {showEmptyState ? (
          <p className="text-muted-foreground text-center py-8">
            No se encontró ningún cliente con ese nombre.
          </p>
        ) : groupedByCustomer.length > 0 ? (
          <div className="space-y-6">
            {groupedByCustomer.map(({ name, pending, fulfilled }) => (
              <Card key={name}>
                <CardHeader>
                  <CardTitle>Pedidos de {name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="pending">
                    <TabsList>
                      <TabsTrigger value="pending">
                        Pendientes ({pending.length})
                      </TabsTrigger>
                      <TabsTrigger value="fulfilled">
                        Completados ({fulfilled.length})
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="pending">
                      <RequestTable requests={pending} onStatusChange={handleStatusChange} />
                    </TabsContent>
                    <TabsContent value="fulfilled">
                      <RequestTable requests={fulfilled} onStatusChange={handleStatusChange} />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : searchTerm ? (
          <p className="text-muted-foreground text-center py-8">
            {loading ? 'Cargando pedidos...' : 'Escribe para comenzar a buscar.'}
          </p>
        ) : null}
      </div>
    </MainLayout>
  );
}

function RequestTable({
  requests,
  onStatusChange,
}: {
  requests: CustomerRequest[];
  onStatusChange: (request: CustomerRequest, status: CustomerRequest['status']) => Promise<void>;
}) {
  if (requests.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        No hay pedidos en esta categoría.
      </p>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha de Entrega</TableHead>
            <TableHead>Ítems</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead><span className="sr-only">Acciones</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((req) => (
            <TableRow key={req.id}>
              <TableCell>{format(new Date(req.deliveryDate), 'PPP')}</TableCell>
              <TableCell>
                {req.items.map((i) => `${i.quantity}x ${i.product.name}`).join(', ')}
              </TableCell>
              <TableCell>
                <Badge
                  className={cn({
                    'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200': req.status === 'requested',
                    'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200': req.status === 'prepared',
                    'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200': req.status === 'fulfilled',
                  })}
                >
                  {statusTranslations[req.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-right">${req.totalAmount.toFixed(2)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menú</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onStatusChange(req, 'requested')}>
                      {statusTranslations.requested}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusChange(req, 'prepared')}>
                      {statusTranslations.prepared}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusChange(req, 'fulfilled')}>
                      {statusTranslations.fulfilled}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
