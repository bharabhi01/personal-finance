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
    return format(dateObj, 'do MMMM yyyy');
}

export function formatDateDisplay(date: string | Date): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'do MMMM yyyy');
}

export function formatDatePicker(date: string | Date): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'dd/MM/yyyy');
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

/**
 * Converts a date to Indian Standard Time (UTC+5:30)
 */
export function toIndianTime(date: Date): Date {
    // Create a new date object with IST offset (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours and 30 minutes in milliseconds
    const utc = date.getTime() + (date.getTimezoneOffset() * 60 * 1000);
    return new Date(utc + istOffset);
}

/**
 * Formats a date to YYYY-MM-DD format in Indian Standard Time for API calls
 */
export function formatDateForIST(date: Date): string {
    // Convert to IST, then format as YYYY-MM-DD
    const istDate = toIndianTime(date);
    const year = istDate.getFullYear();
    const month = String(istDate.getMonth() + 1).padStart(2, '0');
    const day = String(istDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Returns the start of day in IST
 */
export function startOfDayIST(date: Date): Date {
    // Get the date in IST and set to start of day
    const ist = toIndianTime(date);
    return new Date(ist.getFullYear(), ist.getMonth(), ist.getDate(), 0, 0, 0);
}

/**
 * Returns the end of day in IST
 */
export function endOfDayIST(date: Date): Date {
    // Get the date in IST and set to end of day
    const ist = toIndianTime(date);
    return new Date(ist.getFullYear(), ist.getMonth(), ist.getDate(), 23, 59, 59);
}

/**
 * Returns the first day of the month in IST
 */
export function startOfMonthIST(date: Date): Date {
    // Get the first day of the month in IST
    const ist = toIndianTime(date);
    return new Date(ist.getFullYear(), ist.getMonth(), 1, 0, 0, 0);
} 