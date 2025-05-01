'use client';

import { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { useAuth } from '@/context/AuthContext';
import { getTransactions } from '@/lib/database';
import { Transaction } from '@/types';
import { subMonths } from 'date-fns';

// Register ChartJS components
ChartJS.register(
    ArcElement,
    Tooltip,
    Legend
);

interface ExpensesChartProps {
    startDate?: string;
    endDate?: string;
}

export default function ExpensesChart({ startDate, endDate }: ExpensesChartProps) {
    const { user } = useAuth();
    const [chartData, setChartData] = useState<{
        labels: string[];
        datasets: {
            data: number[];
            backgroundColor: string[];
            borderWidth: number;
        }[];
    }>({
        labels: [],
        datasets: [
            {
                data: [],
                backgroundColor: [],
                borderWidth: 1,
            },
        ],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [period, setPeriod] = useState<'1m' | '3m' | 'all'>('1m');

    // Determine if we should show period selector
    const showPeriodSelector = !startDate && !endDate;

    // Chart colors
    const chartColors = [
        'rgba(255, 99, 132, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(153, 102, 255, 0.7)',
        'rgba(255, 159, 64, 0.7)',
        'rgba(199, 199, 199, 0.7)',
        'rgba(83, 102, 255, 0.7)',
        'rgba(255, 99, 255, 0.7)',
        'rgba(30, 199, 132, 0.7)',
    ];

    useEffect(() => {
        if (!user) return;

        const fetchChartData = async () => {
            try {
                setLoading(true);

                let fetchStartDate: string;
                let fetchEndDate: string;

                if (startDate && endDate) {
                    // Use provided date range
                    fetchStartDate = startDate;
                    fetchEndDate = endDate;
                } else {
                    // Use period selector's date range
                    const now = new Date();

                    if (period === '1m') {
                        fetchStartDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                    } else if (period === '3m') {
                        fetchStartDate = subMonths(now, 3).toISOString().split('T')[0];
                    } else {
                        // 'all' - fetch all expenses
                        fetchStartDate = new Date(2000, 0, 1).toISOString().split('T')[0]; // Arbitrary past date
                    }

                    fetchEndDate = now.toISOString().split('T')[0];
                }

                // Fetch expense transactions in the period
                const expenses = await getTransactions(
                    user.id,
                    'expense',
                    fetchStartDate,
                    fetchEndDate
                );

                // Group expenses by tags
                const tagTotals: Record<string, number> = {};

                expenses.forEach(expense => {
                    if (expense.tags.length === 0) {
                        // Handle expenses with no tags
                        const key = 'Uncategorized';
                        tagTotals[key] = (tagTotals[key] || 0) + expense.amount;
                    } else {
                        // Use the first tag as the category
                        const key = expense.tags[0];
                        tagTotals[key] = (tagTotals[key] || 0) + expense.amount;
                    }
                });

                // Sort tags by amount spent (descending)
                const sortedTags = Object.entries(tagTotals)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 7); // Limit to top 7 categories

                // Handle "Others" category if there are more than 7 categories
                let others = 0;
                if (Object.keys(tagTotals).length > 7) {
                    others = Object.entries(tagTotals)
                        .sort((a, b) => b[1] - a[1])
                        .slice(7)
                        .reduce((sum, [_, amount]) => sum + amount, 0);
                }

                // Prepare chart data
                const labels = sortedTags.map(([tag]) => tag);
                const data = sortedTags.map(([_, amount]) => amount);

                // Add "Others" if needed
                if (others > 0) {
                    labels.push('Others');
                    data.push(others);
                }

                // Prepare colors (ensure there are enough)
                const backgroundColor = labels.map((_, i) => chartColors[i % chartColors.length]);

                setChartData({
                    labels,
                    datasets: [
                        {
                            data,
                            backgroundColor,
                            borderWidth: 1,
                        },
                    ],
                });

                setError(null);
            } catch (err) {
                console.error('Error fetching chart data:', err);
                setError('Failed to load chart data');
            } finally {
                setLoading(false);
            }
        };

        fetchChartData();
    }, [user, period, startDate, endDate]);

    if (loading) {
        return <div className="h-72 flex items-center justify-center">Loading chart...</div>;
    }

    if (error) {
        return <div className="text-red-600 py-4">{error}</div>;
    }

    // Don't show the chart if there's no data
    if (chartData.labels.length === 0 || chartData.datasets[0].data.length === 0) {
        return (
            <div className="bg-white p-4 rounded-lg shadow-sm h-72 flex items-center justify-center">
                <p className="text-gray-500">No expense data available for this period.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm">
            {showPeriodSelector && (
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Expense Categories</h2>
                    <div className="flex bg-gray-100 rounded-lg p-1 text-sm">
                        <button
                            onClick={() => setPeriod('1m')}
                            className={`px-2 py-1 rounded-md ${period === '1m' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
                        >
                            1M
                        </button>
                        <button
                            onClick={() => setPeriod('3m')}
                            className={`px-2 py-1 rounded-md ${period === '3m' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
                        >
                            3M
                        </button>
                        <button
                            onClick={() => setPeriod('all')}
                            className={`px-2 py-1 rounded-md ${period === 'all' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
                        >
                            All
                        </button>
                    </div>
                </div>
            )}

            {!showPeriodSelector && (
                <div className="mb-4">
                    <h2 className="text-lg font-semibold">Expense Categories</h2>
                </div>
            )}

            <div className="h-64 flex justify-center">
                <Pie
                    data={chartData}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'right',
                                labels: {
                                    boxWidth: 12
                                }
                            }
                        }
                    }}
                />
            </div>
        </div>
    );
} 