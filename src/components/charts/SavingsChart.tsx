'use client';

import { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
    Legend,
    ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format, parseISO, subMonths } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { getTransactions } from '@/lib/database';
import { Transaction } from '@/types';
import { calculateSavings } from '@/lib/utils';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
    Legend
);

export default function SavingsChart() {
    const { user } = useAuth();
    const [chartData, setChartData] = useState<{
        labels: string[];
        datasets: {
            label: string;
            data: number[];
            borderColor: string;
            backgroundColor: string;
            fill: boolean;
            tension: number;
        }[];
    }>({
        labels: [],
        datasets: [
            {
                label: 'Monthly Savings',
                data: [],
                borderColor: 'rgb(53, 162, 235)',
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
                fill: true,
                tension: 0.3,
            },
        ],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [period, setPeriod] = useState<'6m' | '1y'>('6m');

    useEffect(() => {
        if (!user) return;

        const fetchChartData = async () => {
            try {
                setLoading(true);

                // Determine how many months to look back based on period
                const monthsToLookBack = period === '6m' ? 6 : 12;

                // Get date range for the period
                const endDate = new Date();
                const startDate = subMonths(endDate, monthsToLookBack);

                // Fetch all transactions in the period
                const transactions = await getTransactions(
                    user.id,
                    undefined,
                    startDate.toISOString().split('T')[0],
                    endDate.toISOString().split('T')[0]
                );

                // Group transactions by month
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

                // Calculate savings for each month (income - (expenses + investments))
                const labels = Object.keys(months).reverse();
                const data = labels.map(month => {
                    const monthTransactions = months[month];

                    const income = monthTransactions
                        .filter(t => t.type === 'income')
                        .reduce((sum, t) => sum + t.amount, 0);

                    const expenses = monthTransactions
                        .filter(t => t.type === 'expense')
                        .reduce((sum, t) => sum + t.amount, 0);

                    const investments = monthTransactions
                        .filter(t => t.type === 'investment')
                        .reduce((sum, t) => sum + t.amount, 0);

                    return calculateSavings(income, expenses, investments);
                });

                setChartData({
                    labels,
                    datasets: [
                        {
                            label: 'Monthly Savings',
                            data,
                            borderColor: 'rgb(53, 162, 235)',
                            backgroundColor: 'rgba(53, 162, 235, 0.5)',
                            fill: true,
                            tension: 0.3,
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

    const options: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'Monthly Savings Trend',
            },
        },
        scales: {
            y: {
                ticks: {
                    callback: function (value) {
                        return '₹' + value;
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
                <h2 className="text-lg font-semibold">Savings Trend</h2>
                <div className="flex bg-gray-100 rounded-lg p-1 text-sm">
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
                <Line options={options} data={chartData} />
            </div>
        </div>
    );
} 