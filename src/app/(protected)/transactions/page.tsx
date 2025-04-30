'use client';

import { useState } from 'react';
import TransactionForm from '@/components/TransactionForm';
import TransactionList from '@/components/TransactionList';
import SearchBar from '@/components/SearchBar';

export default function TransactionsPage() {
    const [refreshKey, setRefreshKey] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    // Function to refresh the transaction list
    const refreshTransactions = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">All Transactions</h1>
            </div>

            <TransactionForm onTransactionAdded={refreshTransactions} />

            <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Transaction History</h2>
                    <div className="w-64">
                        <SearchBar onSearch={setSearchQuery} />
                    </div>
                </div>
                <TransactionList
                    key={`transactions-${refreshKey}`}
                    limit={50}
                    onUpdateList={refreshTransactions}
                    searchQuery={searchQuery}
                />
            </div>
        </div>
    );
} 