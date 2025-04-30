'use client';

import { useState } from 'react';
import TransactionList from '@/components/TransactionList';
import ExpensesChart from '@/components/charts/ExpensesChart';
import SearchBar from '@/components/SearchBar';

export default function ExpensesPage() {
    const [refreshKey, setRefreshKey] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    // Function to refresh the data
    const refreshData = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Expenses</h1>
            </div>

            <div className="mb-6">
                <ExpensesChart key={`expenses-chart-${refreshKey}`} />
            </div>

            <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Expense History</h2>
                    <div className="w-64">
                        <SearchBar onSearch={setSearchQuery} placeholder="Search expenses..." />
                    </div>
                </div>
                <TransactionList
                    key={`expenses-list-${refreshKey}`}
                    type="expense"
                    limit={50}
                    onUpdateList={refreshData}
                    searchQuery={searchQuery}
                />
            </div>
        </div>
    );
} 