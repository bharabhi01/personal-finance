import { supabase } from './supabase';
import { Transaction, Expense, Income, Investment, Tag } from '@/types';

export async function getTransactions(userId: string, type?: string, startDate?: string, endDate?: string): Promise<Transaction[]> {
    let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

    if (type) {
        query = query.eq('type', type);
    }

    if (startDate) {
        query = query.gte('date', startDate);
    }

    if (endDate) {
        query = query.lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching transactions:', error);
        throw error;
    }

    return data as Transaction[];
}

export async function addTransaction(transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Promise<Transaction> {
    const { data, error } = await supabase
        .from('transactions')
        .insert([transaction])
        .select()
        .single();

    if (error) {
        console.error('Error adding transaction:', error);
        throw error;
    }

    return data as Transaction;
}

export async function updateTransaction(id: string, transaction: Partial<Transaction>): Promise<Transaction> {
    const { data, error } = await supabase
        .from('transactions')
        .update(transaction)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating transaction:', error);
        throw error;
    }

    return data as Transaction;
}

export async function deleteTransaction(id: string): Promise<void> {
    const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting transaction:', error);
        throw error;
    }
}

export async function getTags(userId: string): Promise<Tag[]> {
    const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching tags:', error);
        throw error;
    }

    return data as Tag[];
}

export async function addTag(tag: Omit<Tag, 'id'>): Promise<Tag> {
    const { data, error } = await supabase
        .from('tags')
        .insert([tag])
        .select()
        .single();

    if (error) {
        console.error('Error adding tag:', error);
        throw error;
    }

    return data as Tag;
}

export async function deleteTag(id: string): Promise<void> {
    const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting tag:', error);
        throw error;
    }
} 