'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getTransactions } from '@/lib/database';
import { formatCurrency, calculateSavings } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, IndianRupee, PiggyBank } from 'lucide-react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface Summary {
    income: number;
    expenses: number;
    investments: number;
    savings: number;
}

interface DashboardSummaryProps {
    startDate?: string;
    endDate?: string;
}

// Animated number component
function AnimatedNumber({ value }: { value: number }) {
    const spring = useSpring(value, { damping: 30, stiffness: 100 });
    const display = useTransform(spring, (current) => Math.round(current).toLocaleString());

    useEffect(() => {
        spring.set(value);
    }, [spring, value]);

    return <motion.span>{display}</motion.span>;
}

export default function DashboardSummary({ startDate, endDate }: DashboardSummaryProps) {
    const { user } = useAuth();
    const [summary, setSummary] = useState<Summary>({
        income: 0,
        expenses: 0,
        investments: 0,
        savings: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [period, setPeriod] = useState<'month' | 'all'>(startDate ? 'all' : 'month');

    useEffect(() => {
        if (!user) return;

        const fetchSummary = async () => {
            try {
                setLoading(true);

                // Use provided date range if available, otherwise use period logic
                let currentStartDate = startDate;
                let currentEndDate = endDate;

                if (!currentStartDate && period === 'month') {
                    const now = new Date();
                    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                    currentStartDate = firstDay.toISOString().split('T')[0];
                }

                // Fetch transactions
                const allTransactions = await getTransactions(
                    user.id,
                    undefined,
                    currentStartDate,
                    currentEndDate
                );

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
    }, [user, period, startDate, endDate]);

    // Don't show period selector if date range is provided from parent
    const showPeriodSelector = !startDate && !endDate;

    if (loading) {
        return (
            <div className="h-40 flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
                />
            </div>
        );
    }

    if (error) {
        return (
            <motion.div
                className="text-red-600 py-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
            >
                {error}
            </motion.div>
        );
    }

    const cardVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: (index: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: index * 0.1,
                duration: 0.6,
                ease: [0.25, 0.46, 0.45, 0.94] as const
            }
        })
    };

    const summaryCards = [
        {
            title: "Income",
            value: summary.income,
            icon: ArrowUpRight,
            iconBg: "bg-green-500/20",
            iconColor: "text-green-400",
        },
        {
            title: "Expenses",
            value: summary.expenses,
            icon: ArrowDownRight,
            iconBg: "bg-red-500/20",
            iconColor: "text-red-400",
        },
        {
            title: "Savings",
            value: summary.savings,
            icon: PiggyBank,
            iconBg: "bg-blue-500/20",
            iconColor: "text-blue-400",
        },
        {
            title: "Investments",
            value: summary.investments,
            icon: IndianRupee,
            iconBg: "bg-purple-500/20",
            iconColor: "text-purple-400",
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            {showPeriodSelector && (
                <motion.div
                    className="flex justify-between items-center mb-4"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <motion.button
                            onClick={() => setPeriod('month')}
                            className={`px-3 py-1 rounded-md transition-colors ${period === 'month' ? 'bg-white shadow-sm' : 'text-gray-600'
                                }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            This Month
                        </motion.button>
                        <motion.button
                            onClick={() => setPeriod('all')}
                            className={`px-3 py-1 rounded-md transition-colors ${period === 'all' ? 'bg-white shadow-sm' : 'text-gray-600'
                                }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            All Time
                        </motion.button>
                    </div>
                </motion.div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {summaryCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <motion.div
                            key={card.title}
                            className="bg-gradient-card p-6 rounded-xl shadow-sm"
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            custom={index}
                            whileHover={{
                                scale: 1.05,
                                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
                                transition: { duration: 0.3 }
                            }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <motion.p
                                        className="text-sm text-gradient-heading mb-1"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.1 + 0.3 }}
                                    >
                                        {card.title}
                                    </motion.p>
                                    <motion.p
                                        className="text-2xl font-bold"
                                        style={{ color: '#D5D5D5' }}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.1 + 0.4 }}
                                    >
                                        ₹<AnimatedNumber value={card.value} />
                                    </motion.p>
                                </div>
                                <motion.div
                                    className={`rounded-full p-3 ${card.iconBg}`}
                                    whileHover={{
                                        rotate: 360,
                                        transition: { duration: 0.6 }
                                    }}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{
                                        delay: index * 0.1 + 0.5,
                                        type: "spring",
                                        stiffness: 200,
                                        damping: 10
                                    }}
                                >
                                    <Icon className={`h-6 w-6 ${card.iconColor}`} />
                                </motion.div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
} 