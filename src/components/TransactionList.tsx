'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getTransactions, deleteTransaction } from '@/lib/database';
import { Transaction, TransactionType } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Trash2 } from 'lucide-react';

interface TransactionListProps {
    type?: TransactionType;
    limit?: number;
    startDate?: string;
    endDate?: string;
    onUpdateList?: () => void;
    searchQuery?: string;
}

export default function TransactionList({
    type,
    limit = 10,
    startDate,
    endDate,
    onUpdateList,
    searchQuery = ''
}: TransactionListProps) {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;

        const fetchTransactions = async () => {
            try {
                setLoading(true);
                const data = await getTransactions(user.id, type, startDate, endDate);
                setTransactions(data.slice(0, limit));
                setError(null);
            } catch (err) {
                console.error('Error fetching transactions:', err);
                setError('Failed to load transactions');
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, [user, type, limit, startDate, endDate, onUpdateList]);

    const handleDelete = async (id: string) => {
        if (!user) return;
        if (!confirm('Are you sure you want to delete this transaction?')) return;

        try {
            await deleteTransaction(id);
            setTransactions(transactions.filter(transaction => transaction.id !== id));
            if (onUpdateList) onUpdateList();
        } catch (err) {
            console.error('Error deleting transaction:', err);
            alert('Failed to delete transaction');
        }
    };

    const getTypeColor = (type: TransactionType) => {
        switch (type) {
            case 'expense':
                return 'text-red-600';
            case 'income':
                return 'text-green-600';
            case 'investment':
                return 'text-purple-600';
            default:
                return 'text-gray-600';
        }
    };

    // Filter transactions based on search query
    const filteredTransactions = useMemo(() => {
        if (!searchQuery) return transactions;

        return transactions.filter(transaction => {
            const source = transaction.type === 'investment'
                ? (transaction as any).investment_name || transaction.source
                : transaction.source;

            return source.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [transactions, searchQuery]);

    if (loading) {
        return <div className="text-center py-4">Loading transactions...</div>;
    }

    if (error) {
        return <div className="text-red-600 py-4">{error}</div>;
    }

    if (filteredTransactions.length === 0) {
        return (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
                <p className="text-gray-500">
                    {searchQuery ? `No transactions found matching "${searchQuery}"` : "No transactions found."}
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white divide-y divide-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Source
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tags
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {filteredTransactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(transaction.date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`${getTypeColor(transaction.type)} font-medium capitalize`}>
                                    {transaction.type}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {transaction.type === 'investment'
                                    ? (transaction as any).investment_name || transaction.source
                                    : transaction.source}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <span className={getTypeColor(transaction.type)}>
                                    {transaction.type === 'expense' ? '-' : ''}{formatCurrency(transaction.amount)}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex flex-wrap gap-1">
                                    {transaction.tags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <button
                                    onClick={() => handleDelete(transaction.id)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
} 