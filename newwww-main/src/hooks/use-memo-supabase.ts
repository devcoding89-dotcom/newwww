'use client';

import { useMemo } from 'react';

interface QueryBuilder {
  tableName: string;
  filters?: Array<{ column: string; operator: string; value: any }>;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
}

interface DocQuery {
  tableName: string;
  docId: string;
}

interface MemoizedQuery extends QueryBuilder {
  __memo: true;
}

interface MemoizedDocQuery extends DocQuery {
  __memo: true;
}

/**
 * Memoization utility for Supabase collection queries
 * 
 * REQUIRED: Use this to wrap your query objects before passing to useCollection()
 * Otherwise, the subscription will be recreated on every render causing performance issues
 * 
 * @example
 * const query = useMemoSupabaseCollection({
 *   tableName: 'contacts',
 *   filters: [{ column: 'user_id', operator: 'eq', value: userId }],
 *   orderBy: { column: 'created_at', ascending: false },
 * }, [userId]);
 */
export function useMemoSupabaseCollection(
  query: QueryBuilder | null | undefined,
  dependencies: any[] = []
): MemoizedQuery | null | undefined {
  return useMemo(() => {
    if (!query) return query;
    return { ...query, __memo: true } as MemoizedQuery;
  }, dependencies);
}

/**
 * Memoization utility for Supabase document queries
 * 
 * REQUIRED: Use this to wrap your query objects before passing to useDoc()
 * Otherwise, the subscription will be recreated on every render causing performance issues
 * 
 * @example
 * const query = useMemoSupabaseDoc({
 *   tableName: 'users',
 *   docId: userId,
 * }, [userId]);
 */
export function useMemoSupabaseDoc(
  query: DocQuery | null | undefined,
  dependencies: any[] = []
): MemoizedDocQuery | null | undefined {
  return useMemo(() => {
    if (!query) return query;
    return { ...query, __memo: true } as MemoizedDocQuery;
  }, dependencies);
}
