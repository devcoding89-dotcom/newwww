'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';

export function useRedirectIfAuthenticated(redirectPath: string = '/') {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push(redirectPath);
    }
  }, [user, isUserLoading, router, redirectPath]);
}
