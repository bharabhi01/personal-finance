import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';
import { Transaction, DateRange } from '@/types';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
    }).format(amount);
}

export function formatDate(date: string | Date): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'MMM dd, yyyy');
}

export function calculateSavings(
    income: number,
    expenses: number,
    investments: number
): number {
    return income - (expenses + investments);
}

export function groupTransactionsByMonth(transactions: Transaction[]): Record<string, Transaction[]> {
    return transactions.reduce((acc, transaction) => {
        const month = format(parseISO(transaction.date), 'MMM yyyy');
        if (!acc[month]) {
            acc[month] = [];
        }
        acc[month].push(transaction);
        return acc;
    }, {} as Record<string, Transaction[]>);
}

export function getDateRangeForPeriod(period: 'month' | 'quarter' | 'year', date: Date = new Date()): DateRange {
    switch (period) {
        case 'month':
            return {
                startDate: startOfMonth(date),
                endDate: endOfMonth(date),
            };
        case 'quarter':
            return {
                startDate: startOfQuarter(date),
                endDate: endOfQuarter(date),
            };
        case 'year':
            return {
                startDate: startOfYear(date),
                endDate: endOfYear(date),
            };
        default:
            return {
                startDate: new Date(),
                endDate: new Date(),
            };
    }
} 