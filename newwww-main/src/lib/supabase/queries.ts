/**
 * Common Supabase database queries
 * Provides helper functions for CRUD operations with proper typing
 */

import { supabase } from './client';
import type { Database } from './types';

type Tables = Database['public']['Tables'];

/**
 * Get all records from a table with optional filtering and ordering
 */
export async function getRecords<TableName extends keyof Tables>(
  tableName: TableName,
  filters?: { column: string; value: any; operator?: string }[],
  orderBy?: { column: string; ascending?: boolean },
  limit?: number
) {
  let query = supabase.from(tableName as string).select('*');

  if (filters) {
    for (const filter of filters) {
      const operator = filter.operator || 'eq';
      query = query.filter(filter.column, operator, filter.value);
    }
  }

  if (orderBy) {
    query = query.order(orderBy.column, {
      ascending: orderBy.ascending ?? true,
    });
  }

  if (limit) {
    query = query.limit(limit);
  }

  return query;
}

/**
 * Get a single record by ID
 */
export async function getRecordById<TableName extends keyof Tables>(
  tableName: TableName,
  id: string
) {
  const { data, error } = await supabase
    .from(tableName as string)
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create a new record
 */
export async function createRecord<TableName extends keyof Tables>(
  tableName: TableName,
  data: any
) {
  const { data: result, error } = await supabase
    .from(tableName as string)
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return result;
}

/**
 * Update a record
 */
export async function updateRecord<TableName extends keyof Tables>(
  tableName: TableName,
  id: string,
  data: any
) {
  const { data: result, error } = await supabase
    .from(tableName as string)
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return result;
}

/**
 * Delete a record
 */
export async function deleteRecord<TableName extends keyof Tables>(
  tableName: TableName,
  id: string
) {
  const { error } = await supabase
    .from(tableName as string)
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Get all contacts for a user
 */
export async function getUserContacts(userId: string) {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Get all campaigns for a user
 */
export async function getUserCampaigns(userId: string) {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Get all templates for a user
 */
export async function getUserTemplates(userId: string) {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Get all parses for a user
 */
export async function getUserParses(userId: string) {
  const { data, error } = await supabase
    .from('parses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Get contact list with all items
 */
export async function getContactListWithItems(contactListId: string) {
  const { data: list, error: listError } = await supabase
    .from('contact_lists')
    .select('*')
    .eq('id', contactListId)
    .single();

  if (listError) throw listError;

  const { data: items, error: itemsError } = await supabase
    .from('contact_list_items')
    .select('contact_id')
    .eq('contact_list_id', contactListId);

  if (itemsError) throw itemsError;

  const contactIds = items?.map(item => item.contact_id) || [];

  let contacts = [];
  if (contactIds.length > 0) {
    const { data: contactData, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .in('id', contactIds);

    if (contactError) throw contactError;
    contacts = contactData || [];
  }

  return {
    ...list,
    contacts,
  };
}

/**
 * Add contacts to a contact list
 */
export async function addContactsToList(
  contactListId: string,
  contactIds: string[]
) {
  const items = contactIds.map(contactId => ({
    contact_list_id: contactListId,
    contact_id: contactId,
  }));

  const { error } = await supabase
    .from('contact_list_items')
    .insert(items);

  if (error && error.code !== '23505') { // 23505 = unique constraint violation
    throw error;
  }
}

/**
 * Remove contact from a contact list
 */
export async function removeContactFromList(
  contactListId: string,
  contactId: string
) {
  const { error } = await supabase
    .from('contact_list_items')
    .delete()
    .eq('contact_list_id', contactListId)
    .eq('contact_id', contactId);

  if (error) throw error;
}
