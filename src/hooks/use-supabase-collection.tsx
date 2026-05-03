'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { PostgrestError, RealtimeChannel } from '@supabase/supabase-js';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Document data with ID, or null.
  isLoading: boolean; // True if loading.
  error: PostgrestError | Error | null; // Error object, or null.
}

interface QueryBuilder {
  tableName: string;
  filters?: Array<{ column: string; operator: string; value: any }>;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
}

/**
 * React hook to subscribe to a Supabase table with real-time updates.
 * Supports filtering, ordering, and limiting.
 *
 * IMPORTANT! YOU MUST MEMOIZE the inputted query or BAD THINGS WILL HAPPEN
 * use useMemo to memoize it per React guidance. Also make sure that its dependencies are stable references
 *
 * @template T Optional type for document data. Defaults to any.
 * @param {QueryBuilder | null | undefined} memoizedQuery - The query configuration. Waits if null/undefined.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error.
 */
export function useCollection<T = any>(
  memoizedQuery: QueryBuilder | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
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

    let query = supabase.from(memoizedQuery.tableName).select('*');

    // Apply filters
    if (memoizedQuery.filters) {
      for (const filter of memoizedQuery.filters) {
        query = query.filter(filter.column, filter.operator, filter.value);
      }
    }

    // Apply ordering
    if (memoizedQuery.orderBy) {
      query = query.order(memoizedQuery.orderBy.column, {
        ascending: memoizedQuery.orderBy.ascending ?? false,
      });
    }

    // Apply limit
    if (memoizedQuery.limit) {
      query = query.limit(memoizedQuery.limit);
    }

    // Initial fetch
    query.then(({ data: fetchedData, error: fetchError }) => {
      if (fetchError) {
        setError(fetchError);
        setIsLoading(false);
        return;
      }

      if (fetchedData) {
        setData(fetchedData as ResultItemType[]);
      }
      setIsLoading(false);
    });

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`${memoizedQuery.tableName}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: memoizedQuery.tableName,
        },
        (payload: any) => {
          setData((prevData) => {
            if (!prevData) return prevData;

            if (payload.eventType === 'INSERT') {
              // Add new record
              return [...prevData, payload.new as ResultItemType];
            } else if (payload.eventType === 'UPDATE') {
              // Update existing record
              return prevData.map((item) =>
                item.id === payload.new.id ? (payload.new as ResultItemType) : item
              );
            } else if (payload.eventType === 'DELETE') {
              // Remove deleted record
              return prevData.filter((item) => item.id !== payload.old.id);
            }

            return prevData;
          });
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
      'Warning: useCollection query was not memoized. This may cause unnecessary re-renders.'
    );
  }

  return { data, isLoading, error };
}
