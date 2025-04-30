'use client';

import { useState } from 'react';
import TransactionList from '@/components/TransactionList';
import IncomeChart from '@/components/charts/IncomeChart';
import SearchBar from '@/components/SearchBar';

export default function IncomePage() {
    const [refreshKey, setRefreshKey] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    // Get current month's date range
    const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    // Function to refresh the data
    const refreshData = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Income</h1>
            </div>

            <div className="mb-6">
                <IncomeChart key={`income-chart-${refreshKey}`} />
            </div>

            <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Income History</h2>
                    <div className="w-64">
                        <SearchBar onSearch={setSearchQuery} placeholder="Search income sources..." />
                    </div>
                </div>
                <TransactionList
                    key={`income-list-${refreshKey}`}
                    type="income"
                    startDate={currentMonthStart}
                    endDate={today}
                    onUpdateList={refreshData}
                    searchQuery={searchQuery}
                />
            </div>
        </div>
    );
} 