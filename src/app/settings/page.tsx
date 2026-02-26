
'use client';

import { useState, useEffect } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import type { Product, Size, Extra, Price } from '@/lib/types';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MainLayout } from '@/components/main-layout';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { Separator } from '@/components/ui/separator';
import { useTenant } from '@/hooks/use-tenant';
import { useSizes } from '@/hooks/use-sizes';
import { useExtras } from '@/hooks/use-extras';
import { useProducts } from '@/hooks/use-products';
import { usePrices } from '@/hooks/use-prices';


type SheetState = {
  open: boolean;
  type?: 'product' | 'size' | 'extra';
  item?: Product | Size | Extra | null;
};

type DeleteState = {
  open: boolean;
  type?: 'product' | 'size' | 'extra' | 'tenant';
  item?: { id: string | number; name: string };
};


// Zod Schemas for validation
const sizeSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
});

const extraSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
});

const productSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    description: z.string().optional(),
    product_category_id: z.number().default(1), // Assuming a default category for now
    size_ids: z.array(z.number()),
    extra_ids: z.array(z.number()),
});

const priceSchema = z.object({
  prices: z.array(z.object({
    id: z.number().optional(),
    size_id: z.number().optional(),
    product_id: z.number().optional(),
    extra_id: z.number().optional(),
    price: z.coerce.number().min(0),
  }))
});


const tenantNameSchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.'),
});

export default function SettingsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { tenant, updateTenant, deleteTenant } = useTenant();

  const { sizes, addSize, updateSize, deleteSize, isLoading: isLoadingSizes } = useSizes();
  const { extras, addExtra, updateExtra, deleteExtra, isLoading: isLoadingExtras } = useExtras();
  const { products, addProduct, updateProduct, deleteProduct, isLoading: isLoadingProducts } = useProducts();
  const { prices, setPrices, isLoading: isLoadingPrices } = usePrices();

  const [sheetState, setSheetState] = useState<SheetState>({ open: false });
  const [deleteState, setDeleteState] = useState<DeleteState>({ open: false });
  const [priceSheetOpen, setPriceSheetOpen] = useState(false);

  const tenantNameForm = useForm<z.infer<typeof tenantNameSchema>>({
    resolver: zodResolver(tenantNameSchema),
    defaultValues: {
      name: '',
    },
  });

  const { reset: resetTenantForm } = tenantNameForm;

  useEffect(() => {
    console.log('Settings Page - tenant:', tenant);
    console.log('Settings Page - user:', user);
    if (tenant) {
      // Handle both PascalCase (from Go backend) and camelCase
      const tenantName = (tenant as any).Name || tenant.name || '';
      console.log('Resetting form with tenant name:', tenantName);
      resetTenantForm({ name: tenantName });
    } else {
      console.log('Tenant is null or undefined');
    }
  }, [tenant, resetTenantForm, user]);


  const openSheet = (type: SheetState['type'], item: SheetState['item'] = null) => {
    setSheetState({ open: true, type, item });
  };

  const closeSheet = () => setSheetState({ open: false });
  
  const openDeleteDialog = (
    type: DeleteState['type'],
    item: { id: string | number; name: string }
  ) => {
    setDeleteState({ open: true, type, item });
  };

  const handleSave = async (data: any) => {
    const { type, item } = sheetState;
    try {
        switch (type) {
        case 'product':
            const productData = {
                name: data.name,
                description: data.description,
                product_category_id: 1, // Default category
            };
            const relationshipData = {
                size_ids: data.size_ids,
                extra_ids: data.extra_ids,
            };
            if (item) {
                await updateProduct((item as Product).id, productData, relationshipData);
                toast({ title: 'Producto actualizado' });
            } else {
                await addProduct(productData, relationshipData);
                toast({ title: 'Producto añadido' });
            }
            break;
        case 'size':
            if (item) {
                await updateSize((item as Size).id, data);
                toast({ title: 'Tamaño actualizado' });
            } else {
                await addSize(data);
                toast({ title: 'Tamaño añadido' });
            }
            break;
        case 'extra':
             if (item) {
                await updateExtra((item as Extra).id, data);
                toast({ title: 'Extra actualizado' });
            } else {
                await addExtra(data);
                toast({ title: 'Extra añadido' });
            }
            break;
        }
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
        closeSheet();
    }
  };

  const onTenantNameSubmit = async (values: z.infer<typeof tenantNameSchema>) => {
    try {
      await updateTenant(values.name);
      toast({ title: 'Éxito', description: 'El nombre de la empresa ha sido actualizado.' });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.error || 'No se pudo actualizar el nombre de la empresa.',
      });
    }
  };
  
  const handleDeleteConfirm = async () => {
    if (!deleteState.type || !deleteState.item) return;
    const { type, item } = deleteState;

    try {
        switch (type) {
            case 'tenant':
                await deleteTenant();
                toast({ title: 'Cuenta eliminada' });
                break;
            case 'product':
                await deleteProduct(item.id as number);
                toast({ title: 'Producto eliminado' });
                break;
            case 'size':
                await deleteSize(item.id as number);
                toast({ title: 'Tamaño eliminado' });
                break;
            case 'extra':
                await deleteExtra(item.id as number);
                toast({ title: 'Extra eliminado' });
                break;
        }
    } catch(e: any) {
         toast({ variant: 'destructive', title: 'Error al eliminar', description: e.message });
    } finally {
        setDeleteState({ open: false });
    }
  };

  const handlePriceSave = async (data: { prices: Price[] }) => {
    try {
        await setPrices(data.prices);
        toast({ title: 'Precios actualizados' });
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
        setPriceSheetOpen(false);
    }
  };


  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
            <h1 className="text-3xl font-bold">Configuración</h1>
            <p className="text-muted-foreground">
              Gestiona los productos, tamaños y extras disponibles para los pedidos.
            </p>
        </div>
        
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Precios</CardTitle>
                        <CardDescription>Define los precios para productos y extras según el tamaño.</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => setPriceSheetOpen(true)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Gestionar Precios
                    </Button>
                </div>
            </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Productos</CardTitle>
                  <CardDescription>Gestiona tus productos y sus relaciones.</CardDescription>
                </div>
                <Button size="sm" onClick={() => openSheet('product')}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Añadir Producto
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Relaciones</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <p><strong>Tamaños:</strong> {product.size_products?.map(sp => sizes.find(s=>s.id === sp.size_id)?.name).join(', ')}</p>
                        <p><strong>Extras:</strong> {product.product_extras?.map(pe => extras.find(e=>e.id === pe.extra_id)?.name).join(', ')}</p>
                      </TableCell>
                      <TableCell className="text-right">
                         <Button variant="ghost" size="icon" onClick={() => openSheet('product', product)}>
                           <Pencil className="h-4 w-4" />
                           <span className="sr-only">Editar</span>
                         </Button>
                         <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteDialog('product', product)}>
                           <Trash2 className="h-4 w-4" />
                           <span className="sr-only">Eliminar</span>
                         </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Tamaños</CardTitle>
                  <CardDescription>Gestiona los tamaños de los productos.</CardDescription>
                </div>
                 <Button size="sm" onClick={() => openSheet('size')}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Añadir Tamaño
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                     <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sizes.map((size) => (
                    <TableRow key={size.id}>
                      <TableCell className="font-medium">{size.name}</TableCell>
                       <TableCell className="text-right">
                         <Button variant="ghost" size="icon" onClick={() => openSheet('size', size)}>
                           <Pencil className="h-4 w-4" />
                           <span className="sr-only">Editar</span>
                         </Button>
                         <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteDialog('size', size)}>
                           <Trash2 className="h-4 w-4" />
                           <span className="sr-only">Eliminar</span>
                         </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Extras</CardTitle>
                  <CardDescription>Gestiona los extras disponibles.</CardDescription>
                </div>
                <Button size="sm" onClick={() => openSheet('extra')}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Añadir Extra
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {extras.map((extra) => (
                    <TableRow key={extra.id}>
                      <TableCell className="font-medium">{extra.name}</TableCell>
                      <TableCell>{extra.description}</TableCell>
                      <TableCell className="text-right">
                         <Button variant="ghost" size="icon" onClick={() => openSheet('extra', extra)}>
                           <Pencil className="h-4 w-4" />
                           <span className="sr-only">Editar</span>
                         </Button>
                         <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteDialog('extra', extra)}>
                           <Trash2 className="h-4 w-4" />
                           <span className="sr-only">Eliminar</span>
                         </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Separator />
        
        <div className="space-y-6">
            <Card>
                <form onSubmit={tenantNameForm.handleSubmit(onTenantNameSubmit)}>
                    <CardHeader>
                        <CardTitle>Nombre de la Empresa</CardTitle>
                        <CardDescription>
                            Así es como tu empresa aparecerá en la aplicación.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Controller
                            name="name"
                            control={tenantNameForm.control}
                            render={({ field }) => (
                                <Input {...field} placeholder="Nombre de la empresa" />
                            )}
                        />
                        {tenantNameForm.formState.errors.name && (
                            <p className="text-sm text-destructive mt-2">{tenantNameForm.formState.errors.name.message}</p>
                        )}
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                        <Button type="submit" disabled={tenantNameForm.formState.isSubmitting || !tenantNameForm.formState.isDirty}>
                            {tenantNameForm.formState.isSubmitting ? 'Guardando...' : 'Guardar'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle>Zona Peligrosa</CardTitle>
                    <CardDescription>
                        Estas acciones son permanentes y no se pueden deshacer.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between rounded-lg border border-destructive p-4">
                        <div>
                            <h3 className="font-semibold">Eliminar Empresa</h3>
                            <p className="text-sm text-muted-foreground">
                                Se eliminarán permanentemente todos los datos, incluidos usuarios, pedidos y configuraciones.
                            </p>
                        </div>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (tenant && user) {
                                    // Handle both PascalCase and camelCase
                                    const tenantId = (user as any).TenantID || user.tenant_id;
                                    const tenantName = (tenant as any).Name || tenant.name;
                                    openDeleteDialog('tenant', { id: tenantId, name: tenantName });
                                }
                            }}
                            disabled={!((user as any)?.IsTenantOwner || user?.is_tenant_owner)}
                        >
                            Eliminar Empresa
                        </Button>
                    </div>
                     {!((user as any)?.IsTenantOwner || user?.is_tenant_owner) && (
                        <p className="text-xs text-destructive mt-2">Solo el propietario de la empresa puede realizar esta acción.</p>
                    )}
                </CardContent>
            </Card>
        </div>


        <Sheet open={sheetState.open} onOpenChange={(open) => !open && closeSheet()}>
            <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>{sheetState.item ? 'Editar' : 'Añadir'} {sheetState.type}</SheetTitle>
                  <SheetDescription>
                    {sheetState.item ? 'Modifica los detalles.' : 'Completa los detalles para añadir un nuevo item.'}
                  </SheetDescription>
                </SheetHeader>

                {sheetState.type === 'size' && (
                  <ItemForm schema={sizeSchema} item={sheetState.item} onSave={handleSave} onCancel={closeSheet} />
                )}
                 {sheetState.type === 'extra' && (
                  <ItemForm schema={extraSchema} item={sheetState.item} onSave={handleSave} onCancel={closeSheet} />
                )}
                {sheetState.type === 'product' && (
                   <ItemForm schema={productSchema} item={sheetState.item} onSave={handleSave} onCancel={closeSheet} sizes={sizes} extras={extras} />
                )}
            </SheetContent>
        </Sheet>

        <Sheet open={priceSheetOpen} onOpenChange={setPriceSheetOpen}>
            <SheetContent className="overflow-y-auto sm:max-w-xl">
                 <SheetHeader>
                  <SheetTitle>Gestionar Precios</SheetTitle>
                  <SheetDescription>
                    Define los precios para cada combinación de producto/extra y tamaño.
                  </SheetDescription>
                </SheetHeader>
                <PriceForm 
                    products={products}
                    sizes={sizes}
                    extras={extras}
                    initialPrices={prices}
                    onSave={handlePriceSave}
                    onCancel={() => setPriceSheetOpen(false)}
                />
            </SheetContent>
        </Sheet>


        <AlertDialog open={deleteState.open} onOpenChange={(open) => setDeleteState(prev => ({...prev, open }))}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Esto eliminará permanentemente "{deleteState.item?.name}" y todas las relaciones asociadas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteState({ open: false })}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className={buttonVariants({ variant: "destructive" })}>
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>


      </div>
    </MainLayout>
  );
}


function ItemForm({ schema, item, onSave, onCancel, sizes, extras }: any) {
    
    let defaultValues;

    if (schema === productSchema) {
        defaultValues = {
            name: item?.name || '',
            description: item?.description || '',
            size_ids: item?.size_products?.map((sp: any) => sp.size_id) || [],
            extra_ids: item?.product_extras?.map((pe: any) => pe.extra_id) || [],
        };
    } else {
        defaultValues = item || {};
    }

    const { register, handleSubmit, control, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues,
    });
    
    const renderFormFields = () => {
        if (schema === sizeSchema) {
            return (
                <>
                    <div>
                        <Label htmlFor="name">Nombre</Label>
                        <Input id="name" {...register('name')} />
                        {errors.name && <p className="text-red-500 text-xs">{`${errors.name.message}`}</p>}
                    </div>
                </>
            );
        }
        if (schema === extraSchema) {
            return (
                <>
                    <div>
                        <Label htmlFor="name">Nombre</Label>
                        <Input id="name" {...register('name')} />
                        {errors.name && <p className="text-red-500 text-xs">{`${errors.name.message}`}</p>}
                    </div>
                    <div>
                        <Label htmlFor="description">Descripción</Label>
                        <Input id="description" {...register('description')} />
                        {errors.description && <p className="text-red-500 text-xs">{`${errors.description.message}`}</p>}
                    </div>
                </>
            );
        }
        if (schema === productSchema) {
             return (
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="name">Nombre del Producto</Label>
                        <Input id="name" {...register('name')} />
                        {errors.name && <p className="text-red-500 text-xs">{`${errors.name.message}`}</p>}
                    </div>
                     <div>
                        <Label htmlFor="description">Descripción</Label>
                        <Input id="description" {...register('description')} />
                        {errors.description && <p className="text-red-500 text-xs">{`${errors.description.message}`}</p>}
                    </div>
                    <div>
                        <Label>Tamaños Disponibles</Label>
                        <Controller
                            control={control}
                            name="size_ids"
                            render={({ field }) => (
                                <div className="space-y-1">
                                {sizes.map((s: Size) => (
                                    <div key={s.id} className="flex items-center gap-2">
                                        <Checkbox 
                                            id={`size-${s.id}`}
                                            checked={field.value?.includes(s.id)}
                                            onCheckedChange={(checked) => {
                                                const val = field.value || [];
                                                return checked ? field.onChange([...val, s.id]) : field.onChange(val.filter(id => id !== s.id))
                                            }}
                                        />
                                        <Label htmlFor={`size-${s.id}`}>{s.name}</Label>
                                    </div>
                                ))}
                                </div>
                            )}
                        />
                         {errors.size_ids && <p className="text-red-500 text-xs">{`${errors.size_ids.message}`}</p>}
                    </div>
                    <div>
                        <Label>Extras Disponibles</Label>
                        <Controller
                            control={control}
                            name="extra_ids"
                            render={({ field }) => (
                                <div className="space-y-1">
                                {extras.map((e: Extra) => (
                                    <div key={e.id} className="flex items-center gap-2">
                                        <Checkbox
                                            id={`extra-${e.id}`}
                                            checked={field.value?.includes(e.id)}
                                            onCheckedChange={(checked) => {
                                                const val = field.value || [];
                                                return checked ? field.onChange([...val, e.id]) : field.onChange(val.filter(id => id !== e.id))
                                            }}
                                        />
                                        <Label htmlFor={`extra-${e.id}`}>{e.name}</Label>
                                    </div>
                                ))}
                                </div>
                            )}
                        />
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <form onSubmit={handleSubmit(onSave)} className="grid gap-4 py-4">
            {renderFormFields()}
            <SheetFooter>
                <SheetClose asChild>
                    <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
                </SheetClose>
                <Button type="submit">Guardar Cambios</Button>
            </SheetFooter>
        </form>
    );
}

function PriceForm({ products, sizes, extras, initialPrices, onSave, onCancel }: {
    products: Product[],
    sizes: Size[],
    extras: Extra[],
    initialPrices: Price[],
    onSave: (data: { prices: Price[] }) => void,
    onCancel: () => void
}) {
    const { handleSubmit, control, watch } = useForm({
        resolver: zodResolver(priceSchema),
        defaultValues: { prices: initialPrices }
    });

    const watchedPrices = watch("prices");

    const getPriceValue = (product_id: number | null, extra_id: number | null, size_id: number) => {
        const price = watchedPrices.find(p =>
            (product_id ? p.product_id === product_id : p.extra_id === extra_id) && p.size_id === size_id
        );
        return price?.price || 0;
    }
    
    return (
        <form onSubmit={handleSubmit(onSave)} className="grid gap-6 py-4">
            <div className="space-y-4">
                <h3 className="font-semibold text-lg">Precios de Productos</h3>
                {products.map(product => (
                    <div key={product.id} className="p-4 border rounded-md">
                        <h4 className="font-medium">{product.name}</h4>
                         <div className="grid grid-cols-2 gap-4 mt-2">
                            {product.size_products.map(({ size_id }) => {
                                const size = sizes.find(s => s.id === size_id);
                                if (!size) return null;
                                const priceIndex = initialPrices.findIndex(p => p.product_id === product.id && p.size_id === size.id);
                                return (
                                    <div key={size.id}>
                                        <Label htmlFor={`price-prod-${product.id}-size-${size.id}`}>{size.name}</Label>
                                        <Controller
                                            control={control}
                                            name={`prices.${priceIndex}.price` as const}
                                            render={({ field }) => (
                                                <Input
                                                    id={`price-prod-${product.id}-size-${size.id}`}
                                                    type="number"
                                                    step="0.01"
                                                    {...field}
                                                />
                                            )}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div className="space-y-4">
                <h3 className="font-semibold text-lg">Precios de Extras</h3>
                {extras.map(extra => (
                     <div key={extra.id} className="p-4 border rounded-md">
                        <h4 className="font-medium">{extra.name}</h4>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                            {sizes.map(size => {
                                const priceIndex = initialPrices.findIndex(p => p.extra_id === extra.id && p.size_id === size.id);
                                return (
                                    <div key={size.id}>
                                        <Label htmlFor={`price-extra-${extra.id}-size-${size.id}`}>{size.name}</Label>
                                        <Controller
                                            control={control}
                                            name={`prices.${priceIndex}.price` as const}
                                            render={({ field }) => (
                                                <Input
                                                    id={`price-extra-${extra.id}-size-${size.id}`}
                                                    type="number"
                                                    step="0.01"
                                                    {...field}
                                                />
                                            )}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
             <SheetFooter>
                <SheetClose asChild>
                    <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
                </SheetClose>
                <Button type="submit">Guardar Precios</Button>
            </SheetFooter>
        </form>
    )
}

    

    