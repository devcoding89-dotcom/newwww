
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/firebase';

const PUBLIC_PATHS = ['/', '/login', '/signup', '/forgot-password', '/pricing'];

export function useAuthGuard() {
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) {
      return; // Do nothing while loading
    }

    if (!user && !PUBLIC_PATHS.includes(pathname)) {
      router.push('/login');
    }
  }, [user, loading, router, pathname]);
}
