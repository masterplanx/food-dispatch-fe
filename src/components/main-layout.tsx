
'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { MainNav } from '@/components/main-nav';
import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { CakeIcon } from '@/components/icons';
import Link from 'next/link';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isLoading]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Button variant="ghost" size="icon" className="shrink-0" asChild>
              <Link href="/dashboard">
                <CakeIcon className="h-6 w-6 text-primary" />
              </Link>
            </Button>
            <div className="flex flex-col">
              <h1 className="font-headline text-lg font-bold">SweetDispatch</h1>
              <p className="text-xs text-muted-foreground">{user?.name}</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <MainNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden" />
            <h1 className="font-headline text-xl font-semibold">Panel</h1>
          </div>
          <ThemeSwitcher />
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
