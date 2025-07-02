'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { addTransaction } from '@/lib/database';
import { TransactionType } from '@/types';
import TagSelector from './TagSelector';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircleIcon, CreditCardIcon, BanknoteIcon, TrendingUpIcon, CalendarIcon, TagIcon } from 'lucide-react';

const transactionSchema = z.object({
    amount: z.coerce.number().positive('Amount must be positive'),
    source: z.string().optional(),
    investment_name: z.string().optional(),
    date: z.string().min(1, 'Date is required'),
    type: z.enum(['expense', 'income', 'investment']),
}).refine(data => {
    if (data.type !== 'investment' && !data.source) {
        return false;
    }
    if (data.type === 'investment' && !data.investment_name) {
        return false;
    }
    return true;
}, {
    message: "Source is required for expense/income, Investment Name is required for investments",
    path: ['source']
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
    onTransactionAdded?: () => void;
}

const transactionTypes = [
    {
        value: 'expense',
        label: 'Expense',
        icon: CreditCardIcon,
        color: 'text-red-400',
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-500/30'
    },
    {
        value: 'income',
        label: 'Income',
        icon: BanknoteIcon,
        color: 'text-green-400',
        bgColor: 'bg-green-500/20',
        borderColor: 'border-green-500/30'
    },
    {
        value: 'investment',
        label: 'Investment',
        icon: TrendingUpIcon,
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/20',
        borderColor: 'border-purple-500/30'
    }
];

export default function TransactionForm({ onTransactionAdded }: TransactionFormProps) {
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
        watch,
        control,
    } = useForm<TransactionFormValues>({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            type: 'expense',
            date: new Date().toISOString().split('T')[0],
        },
    });

    const currentType = watch('type');
    const selectedTypeConfig = transactionTypes.find(type => type.value === currentType);

    const onSubmit = async (data: TransactionFormValues) => {
        if (!user) return;

        try {
            setIsSubmitting(true);
            setError(null);

            const transaction = {
                user_id: user.id,
                amount: data.amount,
                date: data.date,
                type: data.type,
                tags: selectedTags,
                source: data.type !== 'investment' ? (data.source || '') : '',
                ...(data.type === 'investment' && { investment_name: data.investment_name || '' })
            };

            await addTransaction(transaction);

            setSuccess(true);
            reset();
            setSelectedTags([]);

            // Call the refresh function if provided
            if (onTransactionAdded) {
                onTransactionAdded();
            }

            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccess(false);
            }, 3000);
        } catch (err) {
            console.error('Error adding transaction:', err);
            setError('Failed to add transaction. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        reset();
        setSelectedTags([]);
        setError(null);
        setSuccess(false);
    };

    return (
        <motion.div
            className="border border-form-stroke rounded-lg p-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
            {/* Header */}
            <motion.div
                className="flex items-center gap-3 mb-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/20">
                    <PlusCircleIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-white">Add New Transaction</h2>
                </div>
            </motion.div>

            {/* Status Messages */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        className="mb-4 p-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400"
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            {error}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {success && (
                    <motion.div
                        className="mb-4 p-4 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400"
                        initial={{ opacity: 0, scale: 0.95, x: -20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Transaction added successfully!
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Transaction Type Selection */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                        Transaction Type
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {transactionTypes.map((type, index) => {
                            const Icon = type.icon;
                            const isSelected = currentType === type.value;

                            return (
                                <motion.label
                                    key={type.value}
                                    className={`relative cursor-pointer p-4 rounded-lg border-2 transition-all duration-200 ${isSelected
                                        ? `${type.bgColor} ${type.borderColor}`
                                        : 'border-gray-600/50 hover:border-gray-500/50 hover:bg-white/5'
                                        }`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.35 + index * 0.05 }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <input
                                        type="radio"
                                        value={type.value}
                                        {...register('type')}
                                        className="sr-only"
                                    />
                                    <div className="flex flex-col items-center text-center gap-2">
                                        <Icon className={`h-6 w-6 ${isSelected ? type.color : 'text-gray-400'}`} />
                                        <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                                            {type.label}
                                        </span>
                                    </div>
                                </motion.label>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Source/Investment Name */}
                <AnimatePresence mode="wait">
                    {currentType !== 'investment' ? (
                        <motion.div
                            key="source-field"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Source
                            </label>
                            <input
                                type="text"
                                {...register('source')}
                                className="w-full px-4 py-3 bg-navbar-hover border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                placeholder={currentType === 'income' ? 'e.g., Salary, Freelance, Bonus' : 'e.g., Groceries, Rent, Transportation'}
                            />
                            {errors.source && (
                                <motion.p
                                    className="mt-2 text-sm text-red-400"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    {errors.source.message}
                                </motion.p>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="investment-field"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Investment Name
                            </label>
                            <input
                                type="text"
                                {...register('investment_name')}
                                className="w-full px-4 py-3 bg-navbar-hover border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                placeholder="e.g., Apple Stock, Bitcoin, 401k, Mutual Fund"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Amount and Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Amount (₹)
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <span className="text-gray-400 text-lg">₹</span>
                            </div>
                            <input
                                type="number"
                                step="0.01"
                                {...register('amount')}
                                className="w-full pl-8 pr-4 py-3 bg-navbar-hover border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                placeholder="0.00"
                            />
                        </div>
                        {errors.amount && (
                            <motion.p
                                className="mt-2 text-sm text-red-400"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                {errors.amount.message}
                            </motion.p>
                        )}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.45 }}
                    >
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Date
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
                                <CalendarIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="date"
                                {...register('date')}
                                className="w-full pl-10 pr-4 py-3 bg-navbar-hover border border-gray-600/50 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors [color-scheme:dark] cursor-pointer"
                                onClick={(e) => {
                                    // Ensure the date picker opens
                                    e.currentTarget.showPicker?.();
                                }}
                            />
                        </div>
                        {errors.date && (
                            <motion.p
                                className="mt-2 text-sm text-red-400"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                {errors.date.message}
                            </motion.p>
                        )}
                    </motion.div>
                </div>

                {/* Tags */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        <TagIcon className="h-4 w-4" />
                        Tags (Optional)
                    </label>
                    <TagSelector
                        value={selectedTags}
                        onChange={setSelectedTags}
                        placeholder="Add tags to categorize this transaction..."
                    />
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    className="flex justify-end gap-3 pt-4 border-t border-gray-600/50"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <motion.button
                        type="button"
                        onClick={handleReset}
                        className="px-6 py-3 text-gray-300 hover:text-white bg-gray-700/50 hover:bg-gray-700 border border-gray-600/50 rounded-lg transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        Reset
                    </motion.button>
                    <motion.button
                        type="submit"
                        disabled={isSubmitting}
                        className={`px-6 py-3 rounded-lg font-medium transition-all ${selectedTypeConfig
                            ? `${selectedTypeConfig.bgColor} ${selectedTypeConfig.borderColor} ${selectedTypeConfig.color} border`
                            : 'bg-blue-600 text-white border border-blue-500'
                            } hover:scale-105 disabled:opacity-50 disabled:scale-100`}
                        whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
                        whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                    >
                        {isSubmitting ? (
                            <motion.div
                                className="flex items-center gap-2"
                                animate={{ opacity: [1, 0.5, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                            >
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                Adding...
                            </motion.div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <PlusCircleIcon className="h-4 w-4" />
                                Add {selectedTypeConfig?.label}
                            </div>
                        )}
                    </motion.button>
                </motion.div>
            </form>
        </motion.div>
    );
} 