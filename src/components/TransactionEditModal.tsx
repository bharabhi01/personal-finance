'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { Transaction, TransactionType } from '@/types';
import { updateTransaction } from '@/lib/database';
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

interface TransactionEditModalProps {
    transaction: Transaction & { investment_name?: string };
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

export default function TransactionEditModal({
    transaction,
    isOpen,
    onClose,
    onUpdate
}: TransactionEditModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedTags, setSelectedTags] = useState<string[]>(transaction.tags || []);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
        watch,
        setValue,
    } = useForm<TransactionFormValues>({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            type: transaction.type,
            amount: transaction.amount,
            source: transaction.source || '',
            investment_name: (transaction as any).investment_name || '',
            date: transaction.date,
        }
    });

    const currentType = watch('type');

    // Reset form when transaction changes
    useEffect(() => {
        if (isOpen) {
            reset({
                type: transaction.type,
                amount: transaction.amount,
                source: transaction.source || '',
                investment_name: (transaction as any).investment_name || '',
                date: transaction.date,
            });
            setSelectedTags(transaction.tags || []);
        }
    }, [transaction, isOpen, reset]);

    const onSubmit = async (data: TransactionFormValues) => {
        try {
            setIsSubmitting(true);
            setError(null);

            const updatedTransaction = {
                amount: data.amount,
                date: data.date,
                type: data.type as TransactionType,
                tags: selectedTags,
                ...(data.type !== 'investment' ? { source: data.source || '' } : {}),
                ...(data.type === 'investment' ? { investment_name: data.investment_name || '', source: '' } : {})
            };

            await updateTransaction(transaction.id, updatedTransaction);
            onUpdate();
            onClose();
        } catch (err) {
            console.error('Error updating transaction:', err);
            setError('Failed to update transaction. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
                        initial={{ scale: 0.8, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: 50 }}
                        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <motion.div
                            className="flex justify-between items-center p-6 border-b"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <h2 className="text-xl font-semibold">Edit Transaction</h2>
                            <motion.button
                                onClick={onClose}
                                className="text-gray-500 hover:text-gray-700"
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                            >
                                <X size={20} />
                            </motion.button>
                        </motion.div>

                        <div className="p-6">
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

                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div className="space-y-4">
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Transaction Type
                                        </label>
                                        <div className="flex space-x-4">
                                            {['expense', 'income', 'investment'].map((type, index) => (
                                                <motion.label
                                                    key={type}
                                                    className="inline-flex items-center"
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.25 + index * 0.05 }}
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
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 }}
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
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.4 }}
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
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.4 }}
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
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.5 }}
                                    >
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Date (MM/DD/YYYY)
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

                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.6 }}
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
                                </div>

                                <motion.div
                                    className="mt-6 flex justify-end space-x-3"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.7 }}
                                >
                                    <motion.button
                                        type="button"
                                        onClick={onClose}
                                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Cancel
                                    </motion.button>
                                    <motion.button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        {isSubmitting ? (
                                            <motion.span
                                                animate={{ opacity: [1, 0.5, 1] }}
                                                transition={{ repeat: Infinity, duration: 1 }}
                                            >
                                                Saving...
                                            </motion.span>
                                        ) : (
                                            'Save Changes'
                                        )}
                                    </motion.button>
                                </motion.div>
                            </form>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
} 