'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { PostgrestError, RealtimeChannel } from '@supabase/supabase-js';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useDoc hook.
 * @template T Type of the document data.
 */
export interface UseDocResult<T> {
  data: WithId<T> | null; // Document data with ID, or null.
  isLoading: boolean; // True if loading.
  error: PostgrestError | Error | null; // Error object, or null.
}

interface DocQuery {
  tableName: string;
  docId: string;
}

/**
 * React hook to subscribe to a single Supabase document with real-time updates.
 *
 * IMPORTANT! YOU MUST MEMOIZE the inputted query or BAD THINGS WILL HAPPEN
 * use useMemo to memoize it per React guidance.
 *
 * @template T Optional type for document data. Defaults to any.
 * @param {DocQuery | null | undefined} memoizedQuery - The query configuration. Waits if null/undefined.
 * @returns {UseDocResult<T>} Object with data, isLoading, error.
 */
export function useDoc<T = any>(
  memoizedQuery: DocQuery | null | undefined,
): UseDocResult<T> {
  type ResultItemType = WithId<T>;

  const [data, setData] = useState<ResultItemType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<PostgrestError | Error | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!memoizedQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Initial fetch
    supabase
      .from(memoizedQuery.tableName)
      .select('*')
      .eq('id', memoizedQuery.docId)
      .single()
      .then(({ data: fetchedData, error: fetchError }) => {
        if (fetchError) {
          // PGRST116 is "no rows returned" which is not an error for our purposes
          if (fetchError.code !== 'PGRST116') {
            setError(fetchError);
          }
          setIsLoading(false);
          return;
        }

        if (fetchedData) {
          setData(fetchedData as ResultItemType);
        }
        setIsLoading(false);
      });

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`${memoizedQuery.tableName}_${memoizedQuery.docId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: memoizedQuery.tableName,
          filter: `id=eq.${memoizedQuery.docId}`,
        },
        (payload: any) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setData(payload.new as ResultItemType);
          } else if (payload.eventType === 'DELETE') {
            setData(null);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [memoizedQuery]);

  if (memoizedQuery && !(memoizedQuery as any).__memo) {
    console.warn(
      'Warning: useDoc query was not memoized. This may cause unnecessary re-renders.'
    );
  }

  return { data, isLoading, error };
}
