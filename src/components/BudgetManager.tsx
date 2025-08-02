'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { getBudget, createOrUpdateBudget, getBudgetStatus } from '@/lib/database';
import { Budget, BudgetStatus } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Edit3, Save, X, TrendingUp, AlertCircle } from 'lucide-react';

const budgetSchema = z.object({
    monthly_limit: z.coerce.number().positive('Budget must be a positive amount'),
    month: z.string().min(1, 'Month is required')
});

type BudgetFormValues = z.infer<typeof budgetSchema>;

interface BudgetManagerProps {
    month?: string; // Format: YYYY-MM, defaults to current month
    onBudgetUpdate?: (budget: Budget) => void;
    compact?: boolean; // For dashboard display
}

export default function BudgetManager({ month, onBudgetUpdate, compact = false }: BudgetManagerProps) {
    const { user } = useAuth();
    const [budget, setBudget] = useState<Budget | null>(null);
    const [budgetStatus, setBudgetStatus] = useState<BudgetStatus | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Get current month if not specified
    const currentMonth = month || new Date().toISOString().slice(0, 7);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<BudgetFormValues>({
        resolver: zodResolver(budgetSchema),
        defaultValues: {
            month: currentMonth
        }
    });

    useEffect(() => {
        if (!user) return;

        const fetchBudgetData = async () => {
            try {
                setLoading(true);
                const [budgetData, statusData] = await Promise.all([
                    getBudget(user.id, currentMonth),
                    getBudgetStatus(user.id, currentMonth)
                ]);

                setBudget(budgetData);
                setBudgetStatus(statusData);

                if (budgetData) {
                    reset({
                        monthly_limit: budgetData.monthly_limit,
                        month: budgetData.month
                    });
                } else {
                    // No budget set, enable editing mode
                    setIsEditing(true);
                }
            } catch (error) {
                console.error('Error fetching budget data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBudgetData();
    }, [user, currentMonth, reset]);

    const onSubmit = async (data: BudgetFormValues) => {
        if (!user) return;

        try {
            setSaving(true);
            const newBudget = await createOrUpdateBudget({
                user_id: user.id,
                monthly_limit: data.monthly_limit,
                month: data.month
            });

            setBudget(newBudget);
            setIsEditing(false);
            onBudgetUpdate?.(newBudget);

            // Refresh budget status
            const newStatus = await getBudgetStatus(user.id, currentMonth);
            setBudgetStatus(newStatus);
        } catch (error) {
            console.error('Error saving budget:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
        if (budget) {
            reset({
                monthly_limit: budget.monthly_limit,
                month: budget.month
            });
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        if (budget) {
            reset({
                monthly_limit: budget.monthly_limit,
                month: budget.month
            });
        }
    };

    if (loading) {
        return (
            <div className={`${compact ? 'p-3' : 'p-6'} bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-lg border border-purple-500/30`}>
                <div className="animate-pulse">
                    <div className="h-4 bg-white/20 rounded w-24 mb-2"></div>
                    <div className="h-8 bg-white/20 rounded w-32"></div>
                </div>
            </div>
        );
    }

    const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

    // Compact view for dashboard
    if (compact) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-lg border border-purple-500/30 p-4"
            >
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Target className="text-purple-400" size={18} />
                        <h3 className="font-semibold text-white text-sm">Monthly Budget</h3>
                    </div>
                    {budget && (
                        <button
                            onClick={handleEdit}
                            className="text-purple-400 hover:text-purple-300 transition-colors p-1"
                        >
                            <Edit3 size={14} />
                        </button>
                    )}
                </div>

                <AnimatePresence mode="wait">
                    {isEditing ? (
                        <motion.form
                            key="editing"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            onSubmit={handleSubmit(onSubmit)}
                            className="space-y-3"
                        >
                            <div>
                                <input
                                    {...register('monthly_limit')}
                                    type="number"
                                    placeholder="Enter budget amount"
                                    className="w-full bg-black/30 border border-purple-500/30 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 text-sm"
                                />
                                {errors.monthly_limit && (
                                    <p className="text-red-400 text-xs mt-1">{errors.monthly_limit.message}</p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                                >
                                    <Save size={14} />
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="px-3 py-1.5 text-gray-400 hover:text-white transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </motion.form>
                    ) : budget ? (
                        <motion.div
                            key="display"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-2"
                        >
                            <div className="text-2xl font-bold text-white">
                                {formatCurrency(budget.monthly_limit)}
                            </div>
                            {budgetStatus && (
                                <div className="text-xs space-y-1">
                                    <div className="flex justify-between text-gray-300">
                                        <span>Spent</span>
                                        <span>{formatCurrency(budgetStatus.currentExpenses)}</span>
                                    </div>
                                    <div className="bg-black/30 rounded-full h-1.5 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(budgetStatus.percentage, 100)}%` }}
                                            transition={{ duration: 0.8, ease: "easeOut" }}
                                            className={`h-full transition-colors duration-300 ${budgetStatus.isOverBudget
                                                    ? 'bg-red-400'
                                                    : budgetStatus.isNearLimit
                                                        ? 'bg-yellow-400'
                                                        : 'bg-green-400'
                                                }`}
                                        />
                                    </div>
                                    <div className="flex justify-between text-gray-400">
                                        <span>{budgetStatus.percentage.toFixed(1)}% used</span>
                                        <span>{formatCurrency(Math.max(0, budgetStatus.remainingBudget))} left</span>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="no-budget"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center py-4"
                        >
                            <AlertCircle className="text-gray-400 mx-auto mb-2" size={20} />
                            <p className="text-gray-400 text-sm">No budget set</p>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="text-purple-400 hover:text-purple-300 text-sm mt-1 underline"
                            >
                                Set budget
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        );
    }

    // Full view for settings page
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-lg border border-purple-500/30 p-6"
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-600/30 rounded-lg">
                        <Target className="text-purple-400" size={24} />
                    </div>
                    <div>
                        <h2 className="font-bold text-white text-xl">Monthly Budget</h2>
                        <p className="text-gray-400 text-sm">Set your spending limit for {currentMonth}</p>
                    </div>
                </div>
                {budget && !isEditing && (
                    <button
                        onClick={handleEdit}
                        className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <Edit3 size={16} />
                        Edit Budget
                    </button>
                )}
            </div>

            <AnimatePresence mode="wait">
                {isEditing ? (
                    <motion.form
                        key="editing"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        <div>
                            <label className="block text-white font-medium mb-2">
                                Monthly Budget Limit
                            </label>
                            <input
                                {...register('monthly_limit')}
                                type="number"
                                placeholder="Enter your monthly budget"
                                className="w-full bg-black/30 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                            />
                            {errors.monthly_limit && (
                                <p className="text-red-400 text-sm mt-1">{errors.monthly_limit.message}</p>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                <Save size={20} />
                                {saving ? 'Saving Budget...' : 'Save Budget'}
                            </button>
                            {budget && (
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 px-6 py-3 rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </motion.form>
                ) : budget ? (
                    <motion.div
                        key="display"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-black/20 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Target className="text-purple-400" size={16} />
                                    <span className="text-gray-400 text-sm">Budget Limit</span>
                                </div>
                                <div className="text-2xl font-bold text-white">
                                    {formatCurrency(budget.monthly_limit)}
                                </div>
                            </div>

                            {budgetStatus && (
                                <>
                                    <div className="bg-black/20 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <TrendingUp className="text-blue-400" size={16} />
                                            <span className="text-gray-400 text-sm">Spent</span>
                                        </div>
                                        <div className="text-2xl font-bold text-white">
                                            {formatCurrency(budgetStatus.currentExpenses)}
                                        </div>
                                        <div className="text-sm text-gray-400">
                                            {budgetStatus.percentage.toFixed(1)}% of budget
                                        </div>
                                    </div>

                                    <div className="bg-black/20 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Target className="text-green-400" size={16} />
                                            <span className="text-gray-400 text-sm">Remaining</span>
                                        </div>
                                        <div className="text-2xl font-bold text-white">
                                            {formatCurrency(Math.max(0, budgetStatus.remainingBudget))}
                                        </div>
                                        {budgetStatus.isOverBudget && (
                                            <div className="text-sm text-red-400">
                                                Over budget by {formatCurrency(Math.abs(budgetStatus.remainingBudget))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {budgetStatus && (
                            <div>
                                <div className="flex justify-between text-sm text-gray-400 mb-2">
                                    <span>Budget Progress</span>
                                    <span>{budgetStatus.percentage.toFixed(1)}%</span>
                                </div>
                                <div className="bg-black/30 rounded-full h-3 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(budgetStatus.percentage, 100)}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className={`h-full transition-colors duration-500 ${budgetStatus.isOverBudget
                                                ? 'bg-red-400'
                                                : budgetStatus.isNearLimit
                                                    ? 'bg-yellow-400'
                                                    : 'bg-green-400'
                                            }`}
                                    />
                                </div>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="no-budget"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center py-8"
                    >
                        <AlertCircle className="text-gray-400 mx-auto mb-4" size={48} />
                        <h3 className="text-white font-semibold mb-2">No Budget Set</h3>
                        <p className="text-gray-400 mb-4">
                            Set a monthly budget to track your spending and get alerts
                        </p>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                            Set Your Budget
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}