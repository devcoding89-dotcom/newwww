
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/firebase';

const PUBLIC_PATHS = ['/', '/login', '/signup', '/forgot-password', '/pricing'];

export function useAuthGuard() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isUserLoading) {
      return; // Do nothing while loading
    }

    if (!user && !PUBLIC_PATHS.includes(pathname)) {
      router.push('/login');
    }
  }, [user, isUserLoading, router, pathname]);
}
