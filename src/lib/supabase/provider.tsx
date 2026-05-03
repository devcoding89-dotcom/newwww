'use client';

import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface SupabaseContextType {
  user: SupabaseUser | null;
  session: Session | null;
  isLoading: boolean;
  error: Error | null;
  supabase: typeof supabase;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export interface SupabaseProviderProps {
  children: ReactNode;
}

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setError(error as unknown as Error);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
      }
      setIsLoading(false);
    });

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setError(null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const value: SupabaseContextType = {
    user,
    session,
    isLoading,
    error,
    supabase,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}

/**
 * Hook to access Supabase context
 * @returns {SupabaseContextType} Supabase context with user, session, and utilities
 * @throws {Error} If used outside of SupabaseProvider
 */
export function useSupabase(): SupabaseContextType {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}

/**
 * Hook to access current user
 * @returns {{user: SupabaseUser | null, isLoading: boolean, error: Error | null}} User auth state
 */
export function useUser() {
  const { user, isLoading, error } = useSupabase();
  return { user, isLoading, error };
}

/**
 * Hook to access current session
 * @returns {{session: Session | null, isLoading: boolean}} Session state
 */
export function useSession() {
  const { session, isLoading } = useSupabase();
  return { session, isLoading };
}
