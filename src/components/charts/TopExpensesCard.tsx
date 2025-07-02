'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { getTransactions } from '@/lib/database';
import { motion } from 'framer-motion';
import { TrendingDown, Tag, Calendar, DollarSign } from 'lucide-react';

interface TopExpensesCardProps {
    startDate?: string;
    endDate?: string;
}

interface ExpenseTransaction {
    id: string;
    amount: number;
    source: string;
    date: string;
    tags: string[];
}

export default function TopExpensesCard({ startDate, endDate }: TopExpensesCardProps) {
    const { user } = useAuth();
    const [topExpenses, setTopExpenses] = useState<ExpenseTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;

        const fetchTopExpenses = async () => {
            try {
                setLoading(true);

                let fetchStartDate = startDate;
                let fetchEndDate = endDate;

                if (!fetchStartDate || !fetchEndDate) {
                    const now = new Date();
                    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                    fetchStartDate = firstDayOfMonth.toISOString().split('T')[0];
                    fetchEndDate = now.toISOString().split('T')[0];
                }

                // Fetch all expense transactions
                const transactions = await getTransactions(
                    user.id,
                    'expense',
                    fetchStartDate,
                    fetchEndDate
                );

                // Sort by amount (highest first) and take top 5
                const sortedExpenses = transactions
                    .sort((a, b) => b.amount - a.amount)
                    .slice(0, 5)
                    .map(transaction => ({
                        id: transaction.id,
                        amount: transaction.amount,
                        source: transaction.source || 'Unknown',
                        date: transaction.date,
                        tags: transaction.tags || []
                    }));

                setTopExpenses(sortedExpenses);
                setError(null);
            } catch (err) {
                console.error('Error fetching top expenses:', err);
                setError('Failed to load top expenses');
            } finally {
                setLoading(false);
            }
        };

        fetchTopExpenses();
    }, [user, startDate, endDate]);

    if (loading) {
        return (
            <div className="bg-gradient-transactions p-6 rounded-lg shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingDown className="h-5 w-5 text-red-400" />
                    <h2 className="text-lg font-semibold text-white">Top 5 Expenses</h2>
                </div>
                <div className="space-y-3">
                    {[...Array(5)].map((_, index) => (
                        <div key={index} className="animate-pulse">
                            <div className="h-16 bg-gray-700/50 rounded-lg"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-gradient-transactions p-6 rounded-lg shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingDown className="h-5 w-5 text-red-400" />
                    <h2 className="text-lg font-semibold text-white">Top 5 Expenses</h2>
                </div>
                <div className="text-red-400 py-4">{error}</div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-transactions p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-2 mb-6">
                <TrendingDown className="h-5 w-5 text-red-400" />
                <h2 className="text-lg font-semibold text-white">Top 5 Expenses</h2>
            </div>

            {topExpenses.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                    <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No expenses found for the selected period</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {topExpenses.map((expense, index) => (
                        <motion.div
                            key={expense.id}
                            className="rounded-lg p-4 border transition-colors"
                            style={{ borderColor: 'rgba(193, 184, 184, 0.36)' }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    {/* Rank and Amount */}
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="flex items-center justify-center w-6 h-6 bg-red-600/20 rounded-full text-red-400 text-sm font-bold">
                                            {index + 1}
                                        </div>
                                        <div className="text-xl font-bold text-red-400">
                                            ₹{expense.amount.toLocaleString()}
                                        </div>
                                    </div>

                                    {/* Source */}
                                    <div className="text-white font-medium mb-2 truncate">
                                        {expense.source}
                                    </div>

                                    {/* Date and Tags */}
                                    <div className="flex items-center gap-4 text-sm text-gray-400">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            <span>{format(new Date(expense.date), 'MMM d, yyyy')}</span>
                                        </div>

                                        {expense.tags.length > 0 && (
                                            <div className="flex items-center gap-1">
                                                <Tag className="h-3 w-3" />
                                                <div className="flex gap-1">
                                                    {expense.tags.slice(0, 2).map((tag, tagIndex) => (
                                                        <span
                                                            key={tagIndex}
                                                            className="px-2 py-1 bg-gray-900/60 text-gray-300 rounded text-xs"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                    {expense.tags.length > 2 && (
                                                        <span className="text-gray-500 text-xs">
                                                            +{expense.tags.length - 2}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Summary */}
            {topExpenses.length > 0 && (
                <motion.div
                    className="mt-6 pt-4 border-t border-gray-700/50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.6 }}
                >
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Total of top 5:</span>
                        <span className="text-white font-semibold">
                            ₹{topExpenses.reduce((sum, expense) => sum + expense.amount, 0).toLocaleString()}
                        </span>
                    </div>
                </motion.div>
            )}
        </div>
    );
} 