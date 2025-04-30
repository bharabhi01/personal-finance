'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { addTransaction } from '@/lib/database';
import { TransactionType } from '@/types';

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

interface TransactionFormProps {
    onTransactionAdded?: () => void;
}

export default function TransactionForm({ onTransactionAdded }: TransactionFormProps) {
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [transactionType, setTransactionType] = useState<TransactionType>('expense');

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
        watch,
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

            const tags = data.tags ? data.tags.split(',').map(tag => tag.trim()) : [];

            const transaction = {
                user_id: user.id,
                amount: data.amount,
                date: data.date,
                type: data.type,
                tags,
                source: data.type !== 'investment' ? (data.source || '') : '',
                ...(data.type === 'investment' && { investment_name: data.investment_name || '' })
            };

            await addTransaction(transaction);

            setSuccess(true);
            reset();

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

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Add New Transaction</h2>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    Transaction added successfully!
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Transaction Type
                        </label>
                        <div className="flex space-x-2">
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

                    <div className="md:col-span-2">
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

                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => reset()}
                        className="mr-2 bg-gray-100 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Reset
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Adding...' : 'Add Transaction'}
                    </button>
                </div>
            </form>
        </div>
    );
} 