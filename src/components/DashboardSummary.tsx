'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getTransactions } from '@/lib/database';
import { formatCurrency, calculateSavings } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, IndianRupee, PiggyBank } from 'lucide-react';

interface Summary {
    income: number;
    expenses: number;
    investments: number;
    savings: number;
}

export default function DashboardSummary() {
    const { user } = useAuth();
    const [summary, setSummary] = useState<Summary>({
        income: 0,
        expenses: 0,
        investments: 0,
        savings: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [period, setPeriod] = useState<'month' | 'all'>('month');

    useEffect(() => {
        if (!user) return;

        const fetchSummary = async () => {
            try {
                setLoading(true);

                // Get current month start and end dates if period is 'month'
                let startDate: string | undefined;
                if (period === 'month') {
                    const now = new Date();
                    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                    startDate = firstDay.toISOString().split('T')[0];
                }

                // Fetch transactions
                const allTransactions = await getTransactions(user.id, undefined, startDate);

                // Calculate totals
                const income = allTransactions
                    .filter(t => t.type === 'income')
                    .reduce((sum, t) => sum + t.amount, 0);

                const expenses = allTransactions
                    .filter(t => t.type === 'expense')
                    .reduce((sum, t) => sum + t.amount, 0);

                const investments = allTransactions
                    .filter(t => t.type === 'investment')
                    .reduce((sum, t) => sum + t.amount, 0);

                const savings = calculateSavings(income, expenses, investments);

                setSummary({
                    income,
                    expenses,
                    investments,
                    savings,
                });

                setError(null);
            } catch (err) {
                console.error('Error fetching summary:', err);
                setError('Failed to load summary data');
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, [user, period]);

    if (loading) {
        return <div className="h-40 flex items-center justify-center">Loading summary...</div>;
    }

    if (error) {
        return <div className="text-red-600 py-4">{error}</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Financial Summary</h2>
                <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={() => setPeriod('month')}
                        className={`px-3 py-1 rounded-md ${period === 'month' ? 'bg-white shadow-sm' : 'text-gray-600'
                            }`}
                    >
                        This Month
                    </button>
                    <button
                        onClick={() => setPeriod('all')}
                        className={`px-3 py-1 rounded-md ${period === 'all' ? 'bg-white shadow-sm' : 'text-gray-600'
                            }`}
                    >
                        All Time
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500">Income</p>
                            <p className="text-2xl font-semibold text-green-600">{formatCurrency(summary.income)}</p>
                        </div>
                        <div className="rounded-full p-2 bg-green-100">
                            <ArrowUpRight className="h-5 w-5 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500">Expenses</p>
                            <p className="text-2xl font-semibold text-red-600">{formatCurrency(summary.expenses)}</p>
                        </div>
                        <div className="rounded-full p-2 bg-red-100">
                            <ArrowDownRight className="h-5 w-5 text-red-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500">Investments</p>
                            <p className="text-2xl font-semibold text-purple-600">{formatCurrency(summary.investments)}</p>
                        </div>
                        <div className="rounded-full p-2 bg-purple-100">
                            <IndianRupee className="h-5 w-5 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500">Savings</p>
                            <p className={`text-2xl font-semibold ${summary.savings >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {formatCurrency(summary.savings)}
                            </p>
                        </div>
                        <div className="rounded-full p-2 bg-blue-100">
                            <PiggyBank className="h-5 w-5 text-blue-600" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 