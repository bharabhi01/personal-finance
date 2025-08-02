import { supabase } from './supabase';
import { Transaction, Expense, Income, Investment, Tag, Budget, BudgetStatus } from '@/types';

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

// Budget management functions
export async function getBudget(userId: string, month: string): Promise<Budget | null> {
    const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId)
        .eq('month', month)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            // No rows returned, budget doesn't exist
            return null;
        }
        console.error('Error fetching budget:', error);
        throw error;
    }

    return data as Budget;
}

export async function createOrUpdateBudget(budget: Omit<Budget, 'id' | 'created_at' | 'updated_at'>): Promise<Budget> {
    // First try to update existing budget
    const { data: existingBudget } = await supabase
        .from('budgets')
        .select('id')
        .eq('user_id', budget.user_id)
        .eq('month', budget.month)
        .single();

    if (existingBudget) {
        // Update existing budget
        const { data, error } = await supabase
            .from('budgets')
            .update({ monthly_limit: budget.monthly_limit })
            .eq('id', existingBudget.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating budget:', error);
            throw error;
        }

        return data as Budget;
    } else {
        // Create new budget
        const { data, error } = await supabase
            .from('budgets')
            .insert([budget])
            .select()
            .single();

        if (error) {
            console.error('Error creating budget:', error);
            throw error;
        }

        return data as Budget;
    }
}

export async function getBudgetStatus(userId: string, month: string): Promise<BudgetStatus | null> {
    // Get budget for the month
    const budget = await getBudget(userId, month);

    if (!budget) {
        return null;
    }

    // Calculate current expenses for the month
    const startDate = `${month}-01`;
    const endOfMonth = new Date(month + '-01');
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0); // Last day of the month
    const endDate = endOfMonth.toISOString().split('T')[0];

    const expenses = await getTransactions(userId, 'expense', startDate, endDate);
    const currentExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    const percentage = budget.monthly_limit > 0 ? (currentExpenses / budget.monthly_limit) * 100 : 0;
    const remainingBudget = budget.monthly_limit - currentExpenses;

    return {
        currentExpenses,
        monthlyLimit: budget.monthly_limit,
        percentage,
        remainingBudget,
        isNearLimit: percentage >= 80 && percentage < 100,
        isOverBudget: percentage >= 100
    };
}

export async function getMonthlyIncomeTotal(userId: string, month: string): Promise<number> {
    const startDate = `${month}-01`;
    const endOfMonth = new Date(month + '-01');
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    const endDate = endOfMonth.toISOString().split('T')[0];

    const incomeTransactions = await getTransactions(userId, 'income', startDate, endDate);
    return incomeTransactions.reduce((sum, income) => sum + income.amount, 0);
} 