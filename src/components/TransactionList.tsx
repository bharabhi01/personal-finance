'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getTransactions, deleteTransaction } from '@/lib/database';
import { Transaction, TransactionType } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Trash2, ChevronLeft, ChevronRight, Edit } from 'lucide-react';
import TransactionEditModal from './TransactionEditModal';

interface TransactionListProps {
    type?: TransactionType;
    limit?: number;
    startDate?: string;
    endDate?: string;
    onUpdateList?: () => void;
    searchQuery?: string;
    tagFilters?: string[];
}

export default function TransactionList({
    type,
    limit = 10,
    startDate,
    endDate,
    onUpdateList,
    searchQuery = '',
    tagFilters = []
}: TransactionListProps) {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(limit);
    const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    useEffect(() => {
        if (!user) return;

        const fetchTransactions = async () => {
            try {
                setLoading(true);
                // Get the first day of the current month if no start date is provided
                const currentStartDate = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
                // Get today's date if no end date is provided
                const currentEndDate = endDate || new Date().toISOString().split('T')[0];

                const data = await getTransactions(user.id, type, currentStartDate, currentEndDate);
                setAllTransactions(data);
                setTransactions(data);
                setError(null);
            } catch (err) {
                console.error('Error fetching transactions:', err);
                setError('Failed to load transactions');
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, [user, type, startDate, endDate, onUpdateList]);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, tagFilters]);

    const handleDelete = async (id: string) => {
        if (!user) return;
        if (!confirm('Are you sure you want to delete this transaction?')) return;

        try {
            await deleteTransaction(id);
            setAllTransactions(allTransactions.filter(transaction => transaction.id !== id));
            setTransactions(transactions.filter(transaction => transaction.id !== id));
            if (onUpdateList) onUpdateList();
        } catch (err) {
            console.error('Error deleting transaction:', err);
            alert('Failed to delete transaction');
        }
    };

    const handleEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditingTransaction(null);
    };

    const handleTransactionUpdated = () => {
        if (onUpdateList) onUpdateList();
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

    // Filter transactions based on search query and tags
    const filteredTransactions = useMemo(() => {
        return allTransactions.filter(transaction => {
            // Source filter
            const source = transaction.type === 'investment'
                ? (transaction as any).investment_name || transaction.source
                : transaction.source;

            const matchesSearch = !searchQuery ||
                source.toLowerCase().includes(searchQuery.toLowerCase());

            // Tag filter
            const matchesTags = tagFilters.length === 0 ||
                tagFilters.some(tag => transaction.tags.includes(tag));

            return matchesSearch && matchesTags;
        });
    }, [allTransactions, searchQuery, tagFilters]);

    // Calculate pagination
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

    // Get current page items
    const currentTransactions = useMemo(() => {
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        return filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
    }, [filteredTransactions, currentPage, itemsPerPage]);

    // Handle page change
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // Handle items per page change
    const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1); // Reset to first page when changing items per page
    };

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
                    {searchQuery || tagFilters.length > 0
                        ? "No transactions found matching your filters."
                        : "No transactions found."}
                </p>
            </div>
        );
    }

    return (
        <div>
            <div className="overflow-x-auto mb-4">
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
                        {currentTransactions.map((transaction) => (
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
                                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium 
                                                    ${tagFilters.includes(tag)
                                                        ? 'bg-blue-500 text-white'
                                                        : 'bg-blue-100 text-blue-800'}`}
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleEdit(transaction)}
                                            className="text-blue-500 hover:text-blue-700"
                                            title="Edit"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(transaction.id)}
                                            className="text-red-500 hover:text-red-700"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination controls */}
            <div className="flex justify-between items-center mt-4">
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">Rows per page:</span>
                    <select
                        value={itemsPerPage}
                        onChange={handleItemsPerPageChange}
                        className="border border-gray-300 rounded p-1 text-sm"
                    >
                        <option value={10}>10</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>

                <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-700">
                        {`${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of ${filteredTransactions.length}`}
                    </span>

                    <div className="flex space-x-1">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {editingTransaction && (
                <TransactionEditModal
                    transaction={editingTransaction}
                    isOpen={isEditModalOpen}
                    onClose={closeEditModal}
                    onUpdate={handleTransactionUpdated}
                />
            )}
        </div>
    );
} 