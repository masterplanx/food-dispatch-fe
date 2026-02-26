
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, PlusCircle, Users, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/auth-context';
import { Button } from './ui/button';

const navItems = [
  { href: '/dashboard', label: 'Calendario', icon: Calendar },
  { href: '/requests/new', label: 'Nuevo Pedido', icon: PlusCircle },
  { href: '/customers', label: 'Clientes', icon: Users },
  { href: '/settings', label: 'Configuración', icon: Settings },
];

export function MainNav() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href} passHref>
            <SidebarMenuButton
              className={cn(
                'w-full justify-start',
                pathname === item.href &&
                  'bg-primary/10 text-primary hover:bg-primary/20'
              )}
              isActive={pathname === item.href}
              asChild
            >
              <span>
                <item.icon className="h-4 w-4" />
                {item.label}
              </span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
       <SidebarMenuItem>
          <Button
            variant="ghost"
            onClick={() => logout()}
            className="w-full justify-start text-muted-foreground hover:text-foreground"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </SidebarMenuItem>
    </SidebarMenu>
  );
}
