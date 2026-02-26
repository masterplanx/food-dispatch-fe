
'use client';

import { MainLayout } from '@/components/main-layout';
import { useState } from 'react';
import { format, isSameDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { CustomerRequest, RequestStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useOrders } from '@/hooks/use-orders';
import { useToast } from '@/hooks/use-toast';

const statusTranslations: Record<RequestStatus, string> = {
  requested: 'Solicitado',
  prepared: 'Preparado',
  fulfilled: 'Entregado',
};

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [detailRequest, setDetailRequest] = useState<CustomerRequest | null>(null);
  const { orders, isLoading, setStatus } = useOrders();
  const { toast } = useToast();

  const selectedRequests = date
    ? orders.filter((req) => isSameDay(new Date(req.deliveryDate), date))
    : [];

  const handleStatusChange = async (request: CustomerRequest, status: RequestStatus) => {
    try {
      await setStatus(request, status);
      toast({ title: 'Estado actualizado' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'No se pudo actualizar el estado',
      });
    }
  };

  const dailySummary = selectedRequests.reduce((acc, req) => {
    req.items.forEach((item) => {
      const key = `${item.product.name}::${item.size.name}`;
      acc[key] = (acc[key] || 0) + item.quantity;
    });
    return acc;
  }, {} as Record<string, number>);

  if (isLoading && orders.length === 0) {
    return (
      <MainLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-muted-foreground">Cargando pedidos...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="w-full"
                modifiers={{
                  hasRequest: orders.map((r) => new Date(r.deliveryDate))
                }}
                modifiersClassNames={{
                  hasRequest: "bg-primary/20"
                }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                Pedidos para {date ? format(date, 'PPP') : 'N/A'}
              </CardTitle>
              <CardDescription>
                {selectedRequests.length} pedido(s) para este día.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedRequests.length > 0 ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Resumen del Día</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                      {Object.entries(dailySummary).map(([key, count]) => {
                        const [productName, sizeName] = key.split('::');
                        return (
                          <div key={key} className="bg-muted p-2 rounded-md">
                            <p className="font-semibold">{productName}</p>
                            <p className="text-muted-foreground text-xs">{sizeName}</p>
                            <p className="font-bold text-lg">{count}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Detalles de Pedidos</h3>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Ítems</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead><span className="sr-only">Acciones</span></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedRequests.map((req) => (
                            <TableRow key={req.id} onClick={() => setDetailRequest(req)} className="cursor-pointer">
                              <TableCell className="font-medium">
                                {req.customerName}
                              </TableCell>
                              <TableCell>
                                  {req.items.map(i => `${i.quantity}x ${i.product.name}`).join(', ')}
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
                              <TableCell className="text-right">
                                ${req.totalAmount.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">Abrir menú</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleStatusChange(req, 'requested')}>{statusTranslations.requested}</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(req, 'prepared')}>{statusTranslations.prepared}</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(req, 'fulfilled')}>{statusTranslations.fulfilled}</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No hay pedidos para este día.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Dialog open={!!detailRequest} onOpenChange={(open) => !open && setDetailRequest(null)}>
        <DialogContent className="sm:max-w-lg">
           {detailRequest && (
             <>
                <DialogHeader>
                    <DialogTitle>Detalle del Pedido #{detailRequest.id.split('_')[1]}</DialogTitle>
                    <DialogDescription>
                        Para {detailRequest.customerName} - Entrega: {format(new Date(detailRequest.deliveryDate), 'PPP')}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {detailRequest.items.map((item, index) => (
                    <div key={item.id}>
                        <div className="font-semibold">{item.quantity}x {item.product.name} ({item.size.name})</div>
                        <div className="pl-4 text-sm text-muted-foreground">
                            {item.extras.length > 0 && (
                                <div>Extras: {item.extras.map((e) => e.name).join(', ')}</div>
                            )}
                        </div>
                        <div className="text-right font-medium">${item.totalPrice.toFixed(2)}</div>
                         {index < detailRequest.items.length - 1 && <Separator className="my-2" />}
                    </div>
                  ))}
                  <Separator />
                   <div className="flex justify-between items-center font-bold text-lg">
                        <span>Total del Pedido:</span>
                        <span>${detailRequest.totalAmount.toFixed(2)}</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <span>Estado:</span>
                     <Badge
                        className={cn({
                            'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200': detailRequest.status === 'requested',
                            'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200': detailRequest.status === 'prepared',
                            'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200': detailRequest.status === 'fulfilled',
                        })}
                        >
                        {statusTranslations[detailRequest.status]}
                    </Badge>
                   </div>
                </div>
             </>
           )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
