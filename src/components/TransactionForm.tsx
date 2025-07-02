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

export default function TransactionForm({ onTransactionAdded }: TransactionFormProps) {
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [transactionType, setTransactionType] = useState<TransactionType>('expense');
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
    };

    return (
        <motion.div
            className="bg-white rounded-lg shadow-md p-6 mb-6"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
            <motion.h2
                className="text-xl font-semibold mb-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
            >
                Add New Transaction
            </motion.h2>

            <AnimatePresence>
                {error && (
                    <motion.div
                        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {success && (
                    <motion.div
                        className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4"
                        initial={{ opacity: 0, scale: 0.95, x: -20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        Transaction added successfully!
                    </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Transaction Type
                        </label>
                        <div className="flex space-x-2">
                            {['expense', 'income', 'investment'].map((type, index) => (
                                <motion.label
                                    key={type}
                                    className="inline-flex items-center"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.35 + index * 0.05 }}
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <input
                                        type="radio"
                                        value={type}
                                        {...register('type')}
                                        className="form-radio h-4 w-4 text-blue-600"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 capitalize">{type}</span>
                                </motion.label>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Amount
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            {...register('amount')}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        {errors.amount && (
                            <motion.p
                                className="mt-1 text-sm text-red-600"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                {errors.amount.message}
                            </motion.p>
                        )}
                    </motion.div>

                    {currentType !== 'investment' ? (
                        <motion.div
                            key="source-field"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ delay: 0.5 }}
                        >
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Source
                            </label>
                            <input
                                type="text"
                                {...register('source')}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder={currentType === 'income' ? 'e.g., Salary, Freelance' : 'e.g., Groceries, Rent'}
                            />
                            {errors.source && (
                                <motion.p
                                    className="mt-1 text-sm text-red-600"
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
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ delay: 0.5 }}
                        >
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Investment Name
                            </label>
                            <input
                                type="text"
                                {...register('investment_name')}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="e.g., Stocks, Bonds, 401k"
                            />
                        </motion.div>
                    )}

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date
                        </label>
                        <input
                            type="date"
                            {...register('date')}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        {errors.date && (
                            <motion.p
                                className="mt-1 text-sm text-red-600"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                {errors.date.message}
                            </motion.p>
                        )}
                    </motion.div>
                </div>

                <motion.div
                    className="mb-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                >
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tags
                    </label>
                    <TagSelector
                        value={selectedTags}
                        onChange={setSelectedTags}
                        placeholder="Select or add tags..."
                    />
                </motion.div>

                <motion.div
                    className="flex justify-end space-x-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                >
                    <motion.button
                        type="button"
                        onClick={handleReset}
                        className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Reset
                    </motion.button>
                    <motion.button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {isSubmitting ? (
                            <motion.span
                                animate={{ opacity: [1, 0.5, 1] }}
                                transition={{ repeat: Infinity, duration: 1 }}
                            >
                                Adding...
                            </motion.span>
                        ) : (
                            'Add Transaction'
                        )}
                    </motion.button>
                </motion.div>
            </form>
        </motion.div>
    );
} 