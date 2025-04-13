'use client';

import { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    ChartOptions
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { format, parseISO, subMonths } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { getTransactions } from '@/lib/database';
import { Transaction } from '@/types';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

// Different colors for categories
const COLORS = [
    'rgba(255, 99, 132, 0.7)',
    'rgba(54, 162, 235, 0.7)',
    'rgba(255, 206, 86, 0.7)',
    'rgba(75, 192, 192, 0.7)',
    'rgba(153, 102, 255, 0.7)',
    'rgba(255, 159, 64, 0.7)',
    'rgba(199, 199, 199, 0.7)',
    'rgba(83, 102, 255, 0.7)',
    'rgba(40, 159, 64, 0.7)',
    'rgba(210, 199, 199, 0.7)',
];

export default function ExpensesChart() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewType, setViewType] = useState<'category' | 'trend'>('category');
    const [period, setPeriod] = useState<'3m' | '6m' | '1y'>('3m');

    const [categoryData, setCategoryData] = useState({
        labels: [] as string[],
        datasets: [
            {
                label: 'Expenses by Category',
                data: [] as number[],
                backgroundColor: [] as string[],
                borderWidth: 1,
            },
        ],
    });

    const [trendData, setTrendData] = useState({
        labels: [] as string[],
        datasets: [
            {
                label: 'Monthly Expenses',
                data: [] as number[],
                backgroundColor: 'rgba(255, 99, 132, 0.7)',
            },
        ],
    });

    useEffect(() => {
        if (!user) return;

        const fetchChartData = async () => {
            try {
                setLoading(true);

                // Determine how many months to look back based on period
                const monthsToLookBack = period === '3m' ? 3 : period === '6m' ? 6 : 12;

                // Get date range for the period
                const endDate = new Date();
                const startDate = subMonths(endDate, monthsToLookBack);

                // Fetch all expense transactions in the period
                const transactions = await getTransactions(
                    user.id,
                    'expense',
                    startDate.toISOString().split('T')[0],
                    endDate.toISOString().split('T')[0]
                );

                if (viewType === 'category') {
                    // Group expenses by source (category)
                    const categories: Record<string, number> = {};

                    transactions.forEach(transaction => {
                        const category = transaction.source;
                        if (!categories[category]) {
                            categories[category] = 0;
                        }
                        categories[category] += transaction.amount;
                    });

                    // Sort categories by amount spent (descending)
                    const sortedCategories = Object.entries(categories)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 10); // Limit to top 10 categories

                    const labels = sortedCategories.map(([category]) => category);
                    const data = sortedCategories.map(([, amount]) => amount);

                    // Assign colors
                    const backgroundColor = labels.map((_, i) => COLORS[i % COLORS.length]);

                    setCategoryData({
                        labels,
                        datasets: [
                            {
                                label: 'Expenses by Category',
                                data,
                                backgroundColor,
                                borderWidth: 1,
                            },
                        ],
                    });
                } else {
                    // Trend view: Group expenses by month
                    const months: Record<string, Transaction[]> = {};

                    // Initialize all months in the period with empty arrays
                    for (let i = 0; i < monthsToLookBack; i++) {
                        const monthDate = subMonths(endDate, i);
                        const monthKey = format(monthDate, 'MMM yyyy');
                        months[monthKey] = [];
                    }

                    // Group transactions by month
                    transactions.forEach(transaction => {
                        const date = parseISO(transaction.date);
                        const monthKey = format(date, 'MMM yyyy');

                        if (months[monthKey]) {
                            months[monthKey].push(transaction);
                        }
                    });

                    // Calculate total expenses for each month
                    const labels = Object.keys(months).reverse();
                    const data = labels.map(month => {
                        return months[month].reduce((sum, transaction) => sum + transaction.amount, 0);
                    });

                    setTrendData({
                        labels,
                        datasets: [
                            {
                                label: 'Monthly Expenses',
                                data,
                                backgroundColor: 'rgba(255, 99, 132, 0.7)',
                            },
                        ],
                    });
                }

                setError(null);
            } catch (err) {
                console.error('Error fetching chart data:', err);
                setError('Failed to load chart data');
            } finally {
                setLoading(false);
            }
        };

        fetchChartData();
    }, [user, period, viewType]);

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right' as const,
                display: true,
            },
            title: {
                display: true,
                text: 'Expenses by Category',
            },
        },
    };

    const barOptions: ChartOptions<'bar'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'Monthly Expenses',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function (value) {
                        return '$' + value;
                    }
                }
            }
        }
    };

    if (loading) {
        return <div className="h-72 flex items-center justify-center">Loading chart...</div>;
    }

    if (error) {
        return <div className="text-red-600 py-4">{error}</div>;
    }

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Expense Analysis</h2>
                <div className="flex space-x-2">
                    <div className="flex bg-gray-100 rounded-lg p-1 text-sm">
                        <button
                            onClick={() => setViewType('category')}
                            className={`px-2 py-1 rounded-md ${viewType === 'category' ? 'bg-white shadow-sm' : 'text-gray-600'
                                }`}
                        >
                            By Category
                        </button>
                        <button
                            onClick={() => setViewType('trend')}
                            className={`px-2 py-1 rounded-md ${viewType === 'trend' ? 'bg-white shadow-sm' : 'text-gray-600'
                                }`}
                        >
                            Trend
                        </button>
                    </div>

                    <div className="flex bg-gray-100 rounded-lg p-1 text-sm">
                        <button
                            onClick={() => setPeriod('3m')}
                            className={`px-2 py-1 rounded-md ${period === '3m' ? 'bg-white shadow-sm' : 'text-gray-600'
                                }`}
                        >
                            3M
                        </button>
                        <button
                            onClick={() => setPeriod('6m')}
                            className={`px-2 py-1 rounded-md ${period === '6m' ? 'bg-white shadow-sm' : 'text-gray-600'
                                }`}
                        >
                            6M
                        </button>
                        <button
                            onClick={() => setPeriod('1y')}
                            className={`px-2 py-1 rounded-md ${period === '1y' ? 'bg-white shadow-sm' : 'text-gray-600'
                                }`}
                        >
                            1Y
                        </button>
                    </div>
                </div>
            </div>

            <div className="h-72">
                {viewType === 'category' ? (
                    <Pie data={categoryData} options={pieOptions} />
                ) : (
                    <Bar options={barOptions} data={trendData} />
                )}
            </div>
        </div>
    );
} 