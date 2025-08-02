'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getBudgetStatus, getMonthlyIncomeTotal } from '@/lib/database';
import { BudgetStatus } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, TrendingUp, Target, X } from 'lucide-react';

interface BudgetAlertProps {
    month?: string; // Format: YYYY-MM, defaults to current month
    onDismiss?: () => void;
}

export default function BudgetAlert({ month, onDismiss }: BudgetAlertProps) {
    const { user } = useAuth();
    const [budgetStatus, setBudgetStatus] = useState<BudgetStatus | null>(null);
    const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [dismissed, setDismissed] = useState(false);

    // Get current month if not specified
    const currentMonth = month || new Date().toISOString().slice(0, 7);

    useEffect(() => {
        if (!user) return;

        const fetchBudgetData = async () => {
            try {
                setLoading(true);
                const [status, income] = await Promise.all([
                    getBudgetStatus(user.id, currentMonth),
                    getMonthlyIncomeTotal(user.id, currentMonth)
                ]);

                setBudgetStatus(status);
                setMonthlyIncome(income);
            } catch (error) {
                console.error('Error fetching budget data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBudgetData();
    }, [user, currentMonth]);

    const handleDismiss = () => {
        setDismissed(true);
        onDismiss?.();
    };

    // Don't show if loading, no budget set, or dismissed
    if (loading || !budgetStatus || dismissed) {
        return null;
    }

    // Only show alert if user is near limit or over budget
    if (!budgetStatus.isNearLimit && !budgetStatus.isOverBudget) {
        return null;
    }

    const expenseToIncomePercentage = monthlyIncome > 0
        ? (budgetStatus.currentExpenses / monthlyIncome) * 100
        : 0;

    const getAlertConfig = () => {
        if (budgetStatus.isOverBudget) {
            return {
                type: 'danger',
                icon: AlertTriangle,
                bgColor: 'bg-red-500/10',
                borderColor: 'border-red-500/30',
                textColor: 'text-red-300',
                iconColor: 'text-red-400',
                title: 'Budget Exceeded!',
                message: `You've exceeded your monthly budget by ₹${Math.abs(budgetStatus.remainingBudget).toLocaleString()}.`
            };
        } else {
            return {
                type: 'warning',
                icon: AlertTriangle,
                bgColor: 'bg-yellow-500/10',
                borderColor: 'border-yellow-500/30',
                textColor: 'text-yellow-300',
                iconColor: 'text-yellow-400',
                title: 'Budget Alert',
                message: `You've used ${budgetStatus.percentage.toFixed(1)}% of your monthly budget.`
            };
        }
    };

    const config = getAlertConfig();
    const Icon = config.icon;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`
                    ${config.bgColor} ${config.borderColor} ${config.textColor}
                    border rounded-lg p-4 relative overflow-hidden
                `}
            >
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-5">
                    <div className="h-full w-full bg-gradient-to-br from-transparent via-white/10 to-transparent"></div>
                </div>

                <div className="relative flex items-start gap-3">
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
                        className={`${config.iconColor} flex-shrink-0 mt-0.5`}
                    >
                        <Icon size={20} />
                    </motion.div>

                    <div className="flex-1 min-w-0">
                        <motion.h3
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1, duration: 0.4 }}
                            className="font-semibold text-sm"
                        >
                            {config.title}
                        </motion.h3>

                        <motion.p
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2, duration: 0.4 }}
                            className="text-sm mt-1 opacity-90"
                        >
                            {config.message}
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.4 }}
                            className="mt-3 space-y-2"
                        >
                            {/* Budget progress bar */}
                            <div className="flex items-center gap-2 text-xs">
                                <Target size={14} className={config.iconColor} />
                                <span className="opacity-80">Budget:</span>
                                <div className="flex-1 bg-black/20 rounded-full h-2 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(budgetStatus.percentage, 100)}%` }}
                                        transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                                        className={`h-full transition-colors duration-300 ${budgetStatus.isOverBudget
                                                ? 'bg-red-400'
                                                : budgetStatus.isNearLimit
                                                    ? 'bg-yellow-400'
                                                    : 'bg-green-400'
                                            }`}
                                    />
                                </div>
                                <span className="font-medium">
                                    {budgetStatus.percentage.toFixed(1)}%
                                </span>
                            </div>

                            {/* Income percentage if available */}
                            {monthlyIncome > 0 && (
                                <div className="flex items-center gap-2 text-xs">
                                    <TrendingUp size={14} className={config.iconColor} />
                                    <span className="opacity-80">Of Income:</span>
                                    <span className="font-medium">
                                        {expenseToIncomePercentage.toFixed(1)}%
                                    </span>
                                    <span className="opacity-70">
                                        (₹{budgetStatus.currentExpenses.toLocaleString()} / ₹{monthlyIncome.toLocaleString()})
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center justify-between text-xs">
                                <span>
                                    <span className="opacity-80">Spent:</span>{' '}
                                    <span className="font-medium">₹{budgetStatus.currentExpenses.toLocaleString()}</span>
                                </span>
                                <span>
                                    <span className="opacity-80">
                                        {budgetStatus.isOverBudget ? 'Over by:' : 'Remaining:'}
                                    </span>{' '}
                                    <span className="font-medium">
                                        ₹{Math.abs(budgetStatus.remainingBudget).toLocaleString()}
                                    </span>
                                </span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Dismiss button */}
                    <motion.button
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4, duration: 0.3 }}
                        onClick={handleDismiss}
                        className={`
                            ${config.textColor} hover:bg-white/10 
                            flex-shrink-0 p-1 rounded-full transition-colors duration-200
                        `}
                        title="Dismiss"
                    >
                        <X size={16} />
                    </motion.button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}