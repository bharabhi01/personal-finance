'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getTransactions, deleteTransaction } from '@/lib/database';
import { Transaction, TransactionType } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Trash2, ChevronLeft, ChevronRight, Edit } from 'lucide-react';
import TransactionEditModal from './TransactionEditModal';
import { motion, AnimatePresence } from 'framer-motion';

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
        return (
            <motion.div
                className="text-center py-4 text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-6 h-6 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"
                />
                Loading transactions...
            </motion.div>
        );
    }

    if (error) {
        return <div className="text-red-400 py-4">{error}</div>;
    }

    if (filteredTransactions.length === 0) {
        return (
            <div className="text-center py-6 rounded-lg">
                <p className="text-gray-400">
                    {searchQuery || tagFilters.length > 0
                        ? "No transactions found matching your filters."
                        : "No transactions found."}
                </p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="overflow-x-auto mb-4">
                <motion.table
                    className="min-w-full divide-y divide-gray-600 rounded-lg overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <thead>
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Date
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Type
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Source
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Amount
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Tags
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-600">
                        <AnimatePresence>
                            {currentTransactions.map((transaction, index) => (
                                <motion.tr
                                    key={transaction.id}
                                    className="hover:bg-black/20"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{
                                        delay: index * 0.05,
                                        duration: 0.3
                                    }}
                                    whileHover={{
                                        backgroundColor: "rgba(0, 0, 0, 0.1)",
                                        transition: { duration: 0.2 }
                                    }}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                        {formatDate(transaction.date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`${getTypeColor(transaction.type)} font-medium capitalize`}>
                                            {transaction.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                        {transaction.type === 'investment'
                                            ? (transaction as any).investment_name || transaction.source
                                            : transaction.source}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <span className={getTypeColor(transaction.type)}>
                                            {transaction.type === 'expense' ? '-' : ''}{formatCurrency(transaction.amount)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
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
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                        <div className="flex space-x-2">
                                            <motion.button
                                                onClick={() => handleEdit(transaction)}
                                                className="text-blue-400 hover:text-blue-300"
                                                title="Edit"
                                                whileHover={{ scale: 1.2 }}
                                                whileTap={{ scale: 0.9 }}
                                            >
                                                <Edit size={16} />
                                            </motion.button>
                                            <motion.button
                                                onClick={() => handleDelete(transaction.id)}
                                                className="text-red-400 hover:text-red-300"
                                                title="Delete"
                                                whileHover={{ scale: 1.2 }}
                                                whileTap={{ scale: 0.9 }}
                                            >
                                                <Trash2 size={16} />
                                            </motion.button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </motion.table>
            </div>

            {/* Pagination controls */}
            <div className="flex justify-between items-center mt-4">
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-300">Rows per page:</span>
                    <select
                        value={itemsPerPage}
                        onChange={handleItemsPerPageChange}
                        className="border border-gray-600 bg-gray-700 text-white rounded p-1 text-sm"
                    >
                        <option value={10}>10</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>

                <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-300">
                        {`${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of ${filteredTransactions.length}`}
                    </span>

                    <div className="flex space-x-1">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-1 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="p-1 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300"
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
        </motion.div>
    );
} 