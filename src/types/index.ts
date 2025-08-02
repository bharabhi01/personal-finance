export type TransactionType = 'expense' | 'income' | 'investment';

export interface Transaction {
    id: string;
    user_id: string;
    amount: number;
    source: string;
    tags: string[];
    date: string;
    type: TransactionType;
    created_at: string;
    updated_at: string;
}

export interface Expense extends Omit<Transaction, 'type'> {
    type: 'expense';
}

export interface Income extends Omit<Transaction, 'type'> {
    type: 'income';
}

export interface Investment extends Omit<Transaction, 'type' | 'source'> {
    type: 'investment';
    investment_name: string;
}

export interface User {
    id: string;
    email: string;
    created_at: string;
}

export interface Tag {
    id: string;
    name: string;
    user_id: string;
    color?: string;
}

export interface ChartData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor: string | string[];
        borderColor?: string | string[];
        borderWidth?: number;
    }[];
}

export interface DateRange {
    startDate: Date;
    endDate: Date;
}

export interface Budget {
    id: string;
    user_id: string;
    monthly_limit: number;
    month: string; // Format: YYYY-MM
    created_at: string;
    updated_at: string;
}

export interface BudgetStatus {
    currentExpenses: number;
    monthlyLimit: number;
    percentage: number;
    remainingBudget: number;
    isNearLimit: boolean; // 80% threshold
    isOverBudget: boolean;
} 