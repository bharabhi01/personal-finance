'use client';

import { useState, useEffect, useRef } from 'react';
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
import { format, parseISO, subMonths } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { getTransactions } from '@/lib/database';
import { calculateSavings } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface TrendChartProps {
    startDate?: string;
    endDate?: string;
    expenseOnly?: boolean;
}

type DataType = 'income' | 'expenses' | 'savings' | 'investments';

const dataTypeConfig = {
    income: {
        label: 'Income',
        color: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgba(34, 197, 94, 1)',
    },
    expenses: {
        label: 'Expenses',
        color: 'rgba(239, 68, 68, 0.6)',
        borderColor: 'rgba(239, 68, 68, 1)',
    },
    savings: {
        label: 'Savings',
        color: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
    },
    investments: {
        label: 'Investments',
        color: 'rgba(147, 51, 234, 0.6)',
        borderColor: 'rgba(147, 51, 234, 1)',
    },
};

export default function TrendChart({ startDate, endDate, expenseOnly = false }: TrendChartProps) {
    const { user } = useAuth();
    const [selectedType, setSelectedType] = useState<DataType>(expenseOnly ? 'expenses' : 'income');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [chartData, setChartData] = useState<{
        labels: string[];
        datasets: {
            label: string;
            data: number[];
            backgroundColor: string;
            borderColor: string;
            borderWidth: number;
        }[];
    }>({
        labels: [],
        datasets: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [period, setPeriod] = useState<'3m' | '6m' | '1y'>('6m');

    // Determine if we should show period selector
    const showPeriodSelector = !startDate && !endDate;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (!user) return;

        const fetchChartData = async () => {
            try {
                setLoading(true);

                let fetchStartDate: string;
                let fetchEndDate: string;

                if (startDate && endDate) {
                    fetchStartDate = startDate;
                    fetchEndDate = endDate;
                } else {
                    const monthsToLookBack = period === '3m' ? 3 : period === '6m' ? 6 : 12;
                    const endDateObj = new Date();
                    const startDateObj = subMonths(endDateObj, monthsToLookBack);

                    fetchStartDate = startDateObj.toISOString().split('T')[0];
                    fetchEndDate = endDateObj.toISOString().split('T')[0];
                }

                // Fetch all transactions in the period
                const allTransactions = await getTransactions(
                    user.id,
                    undefined,
                    fetchStartDate,
                    fetchEndDate
                );

                // Group transactions by month
                const monthlyData: Record<string, { income: number; expenses: number; investments: number; savings: number }> = {};

                // Initialize monthly data structure
                allTransactions.forEach(transaction => {
                    const date = parseISO(transaction.date);
                    const monthKey = format(date, 'MMM yyyy');

                    if (!monthlyData[monthKey]) {
                        monthlyData[monthKey] = { income: 0, expenses: 0, investments: 0, savings: 0 };
                    }

                    if (transaction.type === 'income') {
                        monthlyData[monthKey].income += transaction.amount;
                    } else if (transaction.type === 'expense') {
                        monthlyData[monthKey].expenses += transaction.amount;
                    } else if (transaction.type === 'investment') {
                        monthlyData[monthKey].investments += transaction.amount;
                    }
                });

                // Calculate savings for each month
                Object.keys(monthlyData).forEach(month => {
                    const { income, expenses, investments } = monthlyData[month];
                    monthlyData[month].savings = calculateSavings(income, expenses, investments);
                });

                // Sort months chronologically and prepare chart data
                const labels = Object.keys(monthlyData).sort((a, b) => {
                    const dateA = new Date(a);
                    const dateB = new Date(b);
                    return dateA.getTime() - dateB.getTime();
                });

                const data = labels.map(month => monthlyData[month][selectedType]);
                const config = dataTypeConfig[selectedType];

                setChartData({
                    labels,
                    datasets: [
                        {
                            label: config.label,
                            data,
                            backgroundColor: config.color,
                            borderColor: config.borderColor,
                            borderWidth: 2,
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
    }, [user, period, startDate, endDate, selectedType]);

    const options: ChartOptions<'bar'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            title: {
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
    };

    if (loading) {
        return (
            <div className="border border-card-stroke p-6 rounded-lg shadow-sm">
                <div className="h-72 flex items-center justify-center text-white">Loading chart...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="border border-card-stroke p-6 rounded-lg shadow-sm">
                <div className="text-red-400 py-4">{error}</div>
            </div>
        );
    }

    return (
        <div className="border border-card-stroke p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-white">
                    {expenseOnly ? 'Expense Trends' : 'Trends'}
                </h2>

                <div className="flex items-center space-x-4">
                    {/* Data Type Selector - only show if not expense-only */}
                    {!expenseOnly && (
                        <div className="relative" ref={dropdownRef}>
                            <motion.button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center space-x-2 px-3 py-2 bg-navbar-hover rounded-lg border border-gray-600/50 hover:bg-gray-700/50 transition-colors"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <span className="text-sm font-medium text-white">{dataTypeConfig[selectedType].label}</span>
                                <motion.div
                                    animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <ChevronDown className="h-4 w-4 text-gray-400" />
                                </motion.div>
                            </motion.button>

                            <AnimatePresence>
                                {isDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute right-0 mt-2 w-40 bg-gradient-navbar backdrop-blur-sm rounded-lg shadow-xl border border-gray-600/50 z-10 overflow-hidden"
                                    >
                                        {Object.entries(dataTypeConfig).map(([type, config], index) => (
                                            <motion.button
                                                key={type}
                                                onClick={() => {
                                                    setSelectedType(type as DataType);
                                                    setIsDropdownOpen(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 text-sm transition-colors ${selectedType === type
                                                    ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-500'
                                                    : 'text-gray-300 hover:text-white hover:bg-navbar-hover'
                                                    }`}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.03 }}
                                            >
                                                {config.label}
                                            </motion.button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Period Selector */}
                    {showPeriodSelector && (
                        <div className="flex bg-navbar-hover rounded-lg p-1 text-sm border border-gray-600/50">
                            <button
                                onClick={() => setPeriod('3m')}
                                className={`px-2 py-1 rounded-md transition-colors ${period === '3m' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-gray-300 hover:text-white hover:bg-gray-700/50'}`}
                            >
                                3M
                            </button>
                            <button
                                onClick={() => setPeriod('6m')}
                                className={`px-2 py-1 rounded-md transition-colors ${period === '6m' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-gray-300 hover:text-white hover:bg-gray-700/50'}`}
                            >
                                6M
                            </button>
                            <button
                                onClick={() => setPeriod('1y')}
                                className={`px-2 py-1 rounded-md transition-colors ${period === '1y' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-gray-300 hover:text-white hover:bg-gray-700/50'}`}
                            >
                                1Y
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="h-72">
                <Bar data={chartData} options={options} />
            </div>
        </div>
    );
} 