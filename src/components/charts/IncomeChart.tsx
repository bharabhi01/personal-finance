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

interface IncomeChartProps {
    startDate?: string;
    endDate?: string;
}

export default function IncomeChart({ startDate, endDate }: IncomeChartProps) {
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
                    const monthsToLookBack = period === '3m' ? 3 : period === '6m' ? 6 : 12;
                    const endDateObj = new Date();
                    const startDateObj = subMonths(endDateObj, monthsToLookBack);

                    fetchStartDate = startDateObj.toISOString().split('T')[0];
                    fetchEndDate = endDateObj.toISOString().split('T')[0];
                }

                // Fetch all income transactions in the period
                const transactions = await getTransactions(
                    user.id,
                    'income',
                    fetchStartDate,
                    fetchEndDate
                );

                // Group transactions by month
                const monthlyData: Record<string, number> = {};

                transactions.forEach(transaction => {
                    const date = parseISO(transaction.date);
                    const monthKey = format(date, 'MMM yyyy');

                    if (!monthlyData[monthKey]) {
                        monthlyData[monthKey] = 0;
                    }

                    monthlyData[monthKey] += transaction.amount;
                });

                // Sort months chronologically
                const labels = Object.keys(monthlyData).sort((a, b) => {
                    return parseISO(a).getTime() - parseISO(b).getTime();
                });

                const data = labels.map(month => monthlyData[month]);

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
    }, [user, period, startDate, endDate]);

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
            {showPeriodSelector && (
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Income Trend</h2>
                    <div className="flex bg-gray-100 rounded-lg p-1 text-sm">
                        <button
                            onClick={() => setPeriod('3m')}
                            className={`px-2 py-1 rounded-md ${period === '3m' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
                        >
                            3M
                        </button>
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
                    <h2 className="text-lg font-semibold">Income Trend</h2>
                </div>
            )}

            <div className="h-64">
                <Bar options={options} data={chartData} />
            </div>
        </div>
    );
} 