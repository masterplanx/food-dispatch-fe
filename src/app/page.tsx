
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { CakeIcon } from '@/components/icons';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { ShieldCheck } from 'lucide-react';
import { API_URL } from '@/lib/config';

const loginSchema = z.object({
  email: z.string().email('Email inválido.'),
  password: z.string().min(1, 'La contraseña es obligatoria.'),
});

const registerSchema = z.object({
  tenantName: z.string().min(2, 'El nombre de la empresa debe tener al menos 2 caracteres.'),
  userName: z.string().min(2, 'Tu nombre debe tener al menos 2 caracteres.'),
  email: z.string().email('Email inválido.'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
});

export default function LoginPage() {
  const { toast } = useToast();
  const { login, register, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isHealthChecking, setIsHealthChecking] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      tenantName: '',
      userName: '',
      email: '',
      password: '',
    },
  });

  const onLoginSubmit = async (values: z.infer<typeof loginSchema>) => {
    try {
      await login(values.email, values.password);
      toast({
        title: '¡Bienvenido de vuelta!',
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error de inicio de sesión',
        description: error.response?.data?.error || 'Credenciales incorrectas. Por favor, intenta de nuevo.',
      });
    }
  };

  const onRegisterSubmit = async (values: z.infer<typeof registerSchema>) => {
    try {
      await register({
        tenant: { name: values.tenantName },
        user: { name: values.userName, email: values.email, password: values.password },
      });
      toast({
        title: '¡Registro exitoso!',
        description: 'Tu cuenta y empresa han sido creadas.',
      });
      router.push('/dashboard');
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error en el registro',
            description: error.response?.data?.error || 'No se pudo completar el registro. Intenta de nuevo.',
        });
    }
  };

  const handleHealthCheck = async () => {
    setIsHealthChecking(true);
    try {
      const response = await axios.get(`${API_URL}/health`);
      if (response.status === 200 && response.data.status === 'healthy') {
        toast({
          title: 'API Status: Healthy',
          description: 'The API is running correctly.',
        });
      } else {
        throw new Error('API returned an unhealthy status.');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'API Status: Unhealthy',
        description: 'Could not connect to the API. Please try again later.',
      });
    } finally {
      setIsHealthChecking(false);
    }
  };

  if (isAuthenticated) {
    return null; // or a loading spinner
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
       <div className="flex items-center gap-2 p-2 mb-4">
            <CakeIcon className="h-8 w-8 text-primary" />
            <div className="flex flex-col">
            <h1 className="font-headline text-2xl font-bold">SweetDispatch</h1>
            <p className="text-sm text-muted-foreground">Gestión de Pedidos para Pastelerías</p>
            </div>
        </div>
      <Tabs defaultValue="login" className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
          <TabsTrigger value="register">Registrarse</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <Card>
            <CardHeader>
              <CardTitle>Iniciar Sesión</CardTitle>
              <CardDescription>
                Ingresa a tu cuenta para gestionar tus pedidos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="tu@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contraseña</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
                    {loginForm.formState.isSubmitting ? 'Ingresando...' : 'Ingresar'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="register">
          <Card>
            <CardHeader>
              <CardTitle>Registrarse</CardTitle>
              <CardDescription>
                Crea tu cuenta y empieza a gestionar tu pastelería hoy.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="tenantName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de la Pastelería</FormLabel>
                        <FormControl>
                          <Input placeholder="Mi Dulce Rincón" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={registerForm.control}
                    name="userName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tu Nombre</FormLabel>
                        <FormControl>
                          <Input placeholder="Juan Pérez" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="tu@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contraseña</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={registerForm.formState.isSubmitting}>
                    {registerForm.formState.isSubmitting ? 'Registrando...' : 'Crear Cuenta'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <div className="mt-4">
        <Button variant="outline" onClick={handleHealthCheck} disabled={isHealthChecking}>
          {isHealthChecking ? (
            'Verificando...'
          ) : (
            <>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Verificar Estado de la API
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
