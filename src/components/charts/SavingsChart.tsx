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
    Legend,
    Filler
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
    Legend,
    Filler
);

interface SavingsChartProps {
    startDate?: string;
    endDate?: string;
}

export default function SavingsChart({ startDate, endDate }: SavingsChartProps) {
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

    // Determine if we should show period selector
    const showPeriodSelector = !startDate && !endDate;

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
                    const monthsToLookBack = period === '6m' ? 6 : 12;
                    const endDateObj = new Date();
                    const startDateObj = subMonths(endDateObj, monthsToLookBack);

                    fetchStartDate = startDateObj.toISOString().split('T')[0];
                    fetchEndDate = endDateObj.toISOString().split('T')[0];
                }

                // Fetch all transactions in the period
                const transactions = await getTransactions(
                    user.id,
                    undefined,
                    fetchStartDate,
                    fetchEndDate
                );

                // Group transactions by month
                const months: Record<string, Transaction[]> = {};

                // Get date objects for provided dates
                const startDateObj = new Date(fetchStartDate);
                const endDateObj = new Date(fetchEndDate);

                // Calculate number of months between start and end date
                const monthDiff =
                    (endDateObj.getFullYear() - startDateObj.getFullYear()) * 12 +
                    (endDateObj.getMonth() - startDateObj.getMonth()) + 1;

                // Initialize all months in the period with empty arrays
                for (let i = 0; i < monthDiff; i++) {
                    const monthDate = new Date(
                        startDateObj.getFullYear(),
                        startDateObj.getMonth() + i,
                        1
                    );
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
                const labels = Object.keys(months).sort((a, b) => {
                    const dateA = new Date(a);
                    const dateB = new Date(b);
                    return dateA.getTime() - dateB.getTime();
                });

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
    }, [user, period, startDate, endDate]);

    if (loading) {
        return <div className="h-72 flex items-center justify-center">Loading chart...</div>;
    }

    if (error) {
        return <div className="text-red-600 py-4">{error}</div>;
    }

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm">
            {showPeriodSelector && (
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Savings Trend</h2>
                    <div className="flex bg-gray-100 rounded-lg p-1 text-sm">
                        <button
                            onClick={() => setPeriod('6m')}
                            className={`px-2 py-1 rounded-md ${period === '6m' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
                        >
                            6M
                        </button>
                        <button
                            onClick={() => setPeriod('1y')}
                            className={`px-2 py-1 rounded-md ${period === '1y' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
                        >
                            1Y
                        </button>
                    </div>
                </div>
            )}

            {!showPeriodSelector && (
                <div className="mb-4">
                    <h2 className="text-lg font-semibold">Savings Trend</h2>
                </div>
            )}

            <div className="h-64">
                <Line
                    data={chartData}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false,
                            },
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: function (value) {
                                        return '₹' + value;
                                    }
                                }
                            }
                        }
                    }}
                />
            </div>
        </div>
    );
} 