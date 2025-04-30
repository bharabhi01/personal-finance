'use client';

import { useState } from 'react';
import TransactionForm from '@/components/TransactionForm';
import TransactionList from '@/components/TransactionList';
import SearchBar from '@/components/SearchBar';
import TagFilter from '@/components/TagFilter';

export default function TransactionsPage() {
    const [refreshKey, setRefreshKey] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    // Get current month's date range
    const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

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

                <div className="mb-4">
                    <TagFilter
                        onTagsChange={setSelectedTags}
                        key={`tag-filter-${refreshKey}`}
                    />
                </div>

                <TransactionList
                    key={`transactions-${refreshKey}`}
                    startDate={currentMonthStart}
                    endDate={today}
                    onUpdateList={refreshTransactions}
                    searchQuery={searchQuery}
                    tagFilters={selectedTags}
                />
            </div>
        </div>
    );
} 