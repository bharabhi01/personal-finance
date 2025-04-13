'use client';

import { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ChartOptions
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { getTransactions } from '@/lib/database';
import { Transaction } from '@/types';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export default function IncomeChart() {
    const { user } = useAuth();
    const [chartData, setChartData] = useState<{
        labels: string[];
        datasets: {
            label: string;
            data: number[];
            backgroundColor: string;
        }[];
    }>({
        labels: [],
        datasets: [
            {
                label: 'Income',
                data: [],
                backgroundColor: 'rgba(34, 197, 94, 0.6)',
            },
        ],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [period, setPeriod] = useState<'3m' | '6m' | '1y'>('6m');

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

                // Fetch all income transactions in the period
                const transactions = await getTransactions(
                    user.id,
                    'income',
                    startDate.toISOString().split('T')[0],
                    endDate.toISOString().split('T')[0]
                );

                // Create monthly buckets for the date range
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

                // Calculate total income for each month
                const labels = Object.keys(months).reverse();
                const data = labels.map(month => {
                    return months[month].reduce((sum, transaction) => sum + transaction.amount, 0);
                });

                setChartData({
                    labels,
                    datasets: [
                        {
                            label: 'Income',
                            data,
                            backgroundColor: 'rgba(34, 197, 94, 0.6)',
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
    }, [user, period]);

    const options: ChartOptions<'bar'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'Monthly Income',
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
                <h2 className="text-lg font-semibold">Income Trend</h2>
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
            <div className="h-64">
                <Bar options={options} data={chartData} />
            </div>
        </div>
    );
} 