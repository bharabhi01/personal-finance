'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { Transaction, TransactionType } from '@/types';
import { updateTransaction } from '@/lib/database';

const transactionSchema = z.object({
    amount: z.coerce.number().positive('Amount must be positive'),
    source: z.string().optional(),
    investment_name: z.string().optional(),
    tags: z.string().optional(),
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
            tags: transaction.tags.join(', ')
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
                tags: transaction.tags.join(', ')
            });
        }
    }, [transaction, isOpen, reset]);

    const onSubmit = async (data: TransactionFormValues) => {
        try {
            setIsSubmitting(true);
            setError(null);

            const tags = data.tags ? data.tags.split(',').map(tag => tag.trim()) : [];

            const updatedTransaction = {
                amount: data.amount,
                date: data.date,
                type: data.type as TransactionType,
                tags,
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-semibold">Edit Transaction</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Transaction Type
                                </label>
                                <div className="flex space-x-4">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            value="expense"
                                            {...register('type')}
                                            className="form-radio h-4 w-4 text-blue-600"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Expense</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            value="income"
                                            {...register('type')}
                                            className="form-radio h-4 w-4 text-green-600"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Income</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            value="investment"
                                            {...register('type')}
                                            className="form-radio h-4 w-4 text-purple-600"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Investment</span>
                                    </label>
                                </div>
                            </div>

                            <div>
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
                                    <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                                )}
                            </div>

                            {currentType !== 'investment' ? (
                                <div>
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
                                        <p className="mt-1 text-sm text-red-600">{errors.source.message}</p>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Investment Name
                                    </label>
                                    <input
                                        type="text"
                                        {...register('investment_name')}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="e.g., Stocks, Bonds, 401k"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date
                                </label>
                                <input
                                    type="date"
                                    {...register('date')}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                                {errors.date && (
                                    <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tags (comma separated)
                                </label>
                                <input
                                    type="text"
                                    {...register('tags')}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="e.g., food, utilities, essentials"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
} 