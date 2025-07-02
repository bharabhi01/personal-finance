'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    ChartOptions
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useAuth } from '@/context/AuthContext';
import { getTransactions } from '@/lib/database';
import { calculateSavings } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

interface BreakdownChartProps {
    startDate?: string;
    endDate?: string;
}

type DataType = 'income' | 'expenses' | 'savings' | 'investments';

const categoryColors = [
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#10B981', // Green
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#F97316', // Orange
    '#6366F1', // Indigo
    '#84CC16', // Lime
    '#06B6D4', // Cyan
    '#F43F5E', // Rose
];

const dataTypeConfig = {
    income: {
        label: 'Income',
        color: '#22C55E',
    },
    expenses: {
        label: 'Expenses',
        color: '#EF4444',
    },
    savings: {
        label: 'Savings',
        color: '#3B82F6',
    },
    investments: {
        label: 'Investments',
        color: '#9333EA',
    },
};

export default function BreakdownChart({ startDate, endDate }: BreakdownChartProps) {
    const { user } = useAuth();
    const [selectedType, setSelectedType] = useState<DataType>('expenses');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [chartData, setChartData] = useState<{
        labels: string[];
        datasets: {
            data: number[];
            backgroundColor: string[];
            borderColor: string[];
            borderWidth: number;
        }[];
    }>({
        labels: [],
        datasets: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;

        const fetchChartData = async () => {
            try {
                setLoading(true);

                let fetchStartDate = startDate;
                let fetchEndDate = endDate;

                if (!fetchStartDate) {
                    const now = new Date();
                    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                    fetchStartDate = firstDayOfMonth.toISOString().split('T')[0];
                    fetchEndDate = now.toISOString().split('T')[0];
                }

                // Fetch all transactions in the period
                const allTransactions = await getTransactions(
                    user.id,
                    undefined,
                    fetchStartDate,
                    fetchEndDate
                );

                let categoryData: Record<string, number> = {};
                let labels: string[] = [];
                let data: number[] = [];
                let colors: string[] = [];

                if (selectedType === 'income') {
                    // Group income transactions by tags
                    const incomeTransactions = allTransactions.filter(t => t.type === 'income');

                    incomeTransactions.forEach(transaction => {
                        if (transaction.tags && transaction.tags.length > 0) {
                            transaction.tags.forEach(tag => {
                                categoryData[tag] = (categoryData[tag] || 0) + transaction.amount;
                            });
                        } else {
                            categoryData['Uncategorized'] = (categoryData['Uncategorized'] || 0) + transaction.amount;
                        }
                    });

                } else if (selectedType === 'expenses') {
                    // Group expense transactions by tags
                    const expenseTransactions = allTransactions.filter(t => t.type === 'expense');

                    expenseTransactions.forEach(transaction => {
                        if (transaction.tags && transaction.tags.length > 0) {
                            transaction.tags.forEach(tag => {
                                categoryData[tag] = (categoryData[tag] || 0) + transaction.amount;
                            });
                        } else {
                            categoryData['Uncategorized'] = (categoryData['Uncategorized'] || 0) + transaction.amount;
                        }
                    });

                } else if (selectedType === 'investments') {
                    // Group investment transactions by tags
                    const investmentTransactions = allTransactions.filter(t => t.type === 'investment');

                    investmentTransactions.forEach(transaction => {
                        if (transaction.tags && transaction.tags.length > 0) {
                            transaction.tags.forEach(tag => {
                                categoryData[tag] = (categoryData[tag] || 0) + transaction.amount;
                            });
                        } else {
                            categoryData['Uncategorized'] = (categoryData['Uncategorized'] || 0) + transaction.amount;
                        }
                    });

                } else if (selectedType === 'savings') {
                    // For savings, we'll show a breakdown by month or time period
                    // Since savings is calculated, we'll show it as a single value
                    const income = allTransactions
                        .filter(t => t.type === 'income')
                        .reduce((sum, t) => sum + t.amount, 0);

                    const expenses = allTransactions
                        .filter(t => t.type === 'expense')
                        .reduce((sum, t) => sum + t.amount, 0);

                    const investments = allTransactions
                        .filter(t => t.type === 'investment')
                        .reduce((sum, t) => sum + t.amount, 0);

                    const totalSavings = calculateSavings(income, expenses, investments);

                    if (totalSavings > 0) {
                        categoryData['Total Savings'] = totalSavings;
                    } else {
                        categoryData['No Savings'] = Math.abs(totalSavings);
                    }
                }

                // Convert to arrays for chart
                labels = Object.keys(categoryData);
                data = Object.values(categoryData);
                colors = labels.map((_, index) => categoryColors[index % categoryColors.length]);

                setChartData({
                    labels,
                    datasets: [
                        {
                            data,
                            backgroundColor: colors,
                            borderColor: colors,
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
    }, [user, startDate, endDate, selectedType]);

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

    const options: ChartOptions<'doughnut'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 20,
                    usePointStyle: true,
                    font: {
                        size: 12,
                    },
                    color: '#FFFFFF',
                },
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const value = context.parsed;
                        const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                        return `₹${value.toLocaleString()} (${percentage}%)`;
                    }
                }
            }
        },
        cutout: '60%',
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
                <h2 className="text-lg font-semibold text-white">Breakdown</h2>

                <div className="relative" ref={dropdownRef}>
                    <motion.button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center space-x-2 px-3 py-2 bg-navbar-hover rounded-lg border border-gray-600/50 hover:bg-gray-700/50 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <span className="text-sm font-medium text-white">
                            {dataTypeConfig[selectedType].label}
                        </span>
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
            </div>

            <div className="h-72">
                {chartData.datasets[0]?.data.length > 0 ? (
                    <Doughnut data={chartData} options={options} />
                ) : (
                    <div className="h-full flex items-center justify-center text-white">
                        No {dataTypeConfig[selectedType].label.toLowerCase()} data available for the selected period
                    </div>
                )}
            </div>
        </div>
    );
} 