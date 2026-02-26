'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useMemo } from 'react';
import { MainLayout } from '@/components/main-layout';
import axios from 'axios';
import { useProducts } from '@/hooks/use-products';
import { useSizes } from '@/hooks/use-sizes';
import { useExtras } from '@/hooks/use-extras';
import { usePrices } from '@/hooks/use-prices';
import { useCustomers } from '@/hooks/use-customers';

const formSchema = z.object({
  customerName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  deliveryDate: z.date({
    required_error: 'La fecha de entrega es obligatoria.',
  }),
  productId: z.string().min(1, 'Por favor selecciona un producto.'),
  sizeId: z.string().min(1, 'Por favor selecciona un tamaño.'),
  extraIds: z.array(z.string()).optional(),
  quantity: z.number().min(1, 'La cantidad debe ser al menos 1.'),
});

const getPriceAmount = (
  prices: { product_id?: number; extra_id?: number; size_id?: number; price: number }[],
  criteria: { productId?: number; extraId?: number; sizeId?: number }
) => {
  return (
    prices.find((price) => {
      if (criteria.productId && price.product_id !== criteria.productId) return false;
      if (criteria.extraId && price.extra_id !== criteria.extraId) return false;
      if (criteria.sizeId && price.size_id !== criteria.sizeId) return false;
      return true;
    })?.price ?? 0
  );
};

export default function NewRequestPage() {
  const { toast } = useToast();
  const { products, isLoading: productsLoading } = useProducts();
  const { sizes, isLoading: sizesLoading } = useSizes();
  const { extras, isLoading: extrasLoading } = useExtras();
  const { prices, isLoading: pricesLoading } = usePrices();
  const { customers, createCustomer } = useCustomers();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: '',
      productId: '',
      sizeId: '',
      extraIds: [],
      quantity: 1,
    },
  });

  const productIdValue = form.watch('productId');
  const selectedProduct = products.find((product) => product.id === Number(productIdValue));
  const selectedSizeId = Number(form.watch('sizeId')) || undefined;
  const selectedExtras = form.watch('extraIds') ?? [];
  const quantity = form.watch('quantity') || 1;

  const allowedSizes = useMemo(() => {
    if (!selectedProduct) return [];
    const allowedIds = new Set(selectedProduct.size_products.map((sp) => sp.size_id));
    return sizes.filter((size) => allowedIds.has(size.id));
  }, [selectedProduct, sizes]);

  const allowedExtras = useMemo(() => {
    if (!selectedProduct) return [];
    const allowedIds = new Set(selectedProduct.product_extras.map((pe) => pe.extra_id));
    return extras.filter((extra) => allowedIds.has(extra.id));
  }, [selectedProduct, extras]);

  const baseProductPrice = selectedProduct && selectedSizeId
    ? getPriceAmount(prices, { productId: selectedProduct.id, sizeId: selectedSizeId })
    : 0;

  const extrasPrice = selectedSizeId
    ? selectedExtras.reduce((total, extraId) => (
        total +
        getPriceAmount(prices, {
          extraId: Number(extraId),
          sizeId: selectedSizeId,
        })
      ), 0)
    : 0;

  const totalPrice = (baseProductPrice + extrasPrice) * quantity;

  useEffect(() => {
    if (!selectedProduct && products.length > 0) {
      form.setValue('productId', String(products[0].id));
    }
  }, [form, products, selectedProduct]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const productId = Number(values.productId);
    const sizeId = Number(values.sizeId);
    const extraIds = (values.extraIds ?? []).map((id) => Number(id));
    const customerName = values.customerName.trim();

    try {
      if (!customerName) {
        throw new Error('El nombre del cliente es obligatorio.');
      }

      let customer = customers.find(
        (c) => c.name.toLowerCase() === customerName.toLowerCase()
      );

      if (!customer) {
        const created = await createCustomer({ name: customerName });
        customer = created;
      }

      const orderResponse = await axios.post('/api/orders', {
        customer_model_id: customer.id,
        comments: '',
        paid: false,
      });

      const orderModelId =
        orderResponse.data?.model_id ??
        orderResponse.data?.ModelID ??
        orderResponse.data?.id ??
        orderResponse.data?.ID;

      if (!orderModelId) {
        throw new Error('No se pudo crear el pedido.');
      }

      const orderItemResponse = await axios.post(`/api/orders/${orderModelId}/items`, {
        product_model_id: productId,
        size_model_id: sizeId,
        quantity: values.quantity,
        unit_price: baseProductPrice,
      });

      const orderItemModelId =
        orderItemResponse.data?.model_id ??
        orderItemResponse.data?.ModelID ??
        orderItemResponse.data?.id ??
        orderItemResponse.data?.ID;

      if (!orderItemModelId) {
        throw new Error('No se pudo crear el ítem del pedido.');
      }

      for (const extraId of extraIds) {
        const price = getPriceAmount(prices, {
          extraId,
          sizeId,
        });
        await axios.post(`/api/order-items/${orderItemModelId}/extras`, {
          extra_model_id: extraId,
          size_model_id: sizeId,
          unit_price: price,
        });
      }

      toast({
        title: '¡Pedido creado!',
        description: `Se registró el pedido para ${customerName}.`,
      });
      form.reset();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'No se pudo crear el pedido',
        description: error?.response?.data?.error || error.message,
      });
    }
  };

  const isLoading =
    productsLoading || sizesLoading || extrasLoading || pricesLoading;

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Crear Nuevo Pedido</CardTitle>
                <CardDescription>
                  Completa los detalles para crear un nuevo pedido de cliente.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Cliente</FormLabel>
                      <FormControl>
                        <Input placeholder="p.ej., Juan Pérez" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deliveryDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de Entrega</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>Elige una fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="productId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Producto</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue('sizeId', '');
                            form.setValue('extraIds', []);
                          }}
                          value={field.value}
                          disabled={isLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un producto" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={String(product.id)}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cantidad</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {selectedProduct && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sizeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tamaño</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={allowedSizes.length === 0}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un tamaño" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {allowedSizes.map((size) => (
                                <SelectItem key={size.id} value={String(size.id)}>
                                  {size.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {selectedProduct && allowedExtras.length > 0 && (
                  <FormField
                    control={form.control}
                    name="extraIds"
                    render={({ field }) => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel>Extras</FormLabel>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {allowedExtras.map((item) => {
                            const priceLabel = selectedSizeId
                              ? getPriceAmount(prices, {
                                  extraId: item.id,
                                  sizeId: selectedSizeId,
                                })
                              : 0;
                            const checked = field.value?.includes(String(item.id));
                            return (
                              <FormItem
                                key={item.id}
                                className={cn(
                                  'flex flex-row items-start space-x-3 space-y-0',
                                  !selectedSizeId && 'opacity-50'
                                )}
                              >
                                <FormControl>
                                  <Checkbox
                                    disabled={!selectedSizeId}
                                    checked={checked}
                                    onCheckedChange={(checkedState) => {
                                      if (checkedState) {
                                        field.onChange([...(field.value || []), String(item.id)]);
                                      } else {
                                        field.onChange(
                                          field.value?.filter((value) => value !== String(item.id)) || []
                                        );
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {item.name} (+${priceLabel.toFixed(2)})
                                </FormLabel>
                              </FormItem>
                            );
                          })}
                        </div>
                        {!selectedSizeId && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Por favor, elige un tamaño para ver los precios de los extras.
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <div className="text-2xl font-bold font-headline">
                  Total estimado: ${totalPrice.toFixed(2)}
                </div>
                <Button type="submit" disabled={isLoading || form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Creando...' : 'Crear Pedido'}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </div>
    </MainLayout>
  );
}
