'use client';

import { useState } from 'react';
import TransactionList from '@/components/TransactionList';
import SearchBar from '@/components/SearchBar';

export default function InvestmentsPage() {
    const [refreshKey, setRefreshKey] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    // Function to refresh the data
    const refreshData = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Investments</h1>
            </div>

            <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Investment History</h2>
                    <div className="w-64">
                        <SearchBar onSearch={setSearchQuery} placeholder="Search investments..." />
                    </div>
                </div>
                <TransactionList
                    key={`investments-list-${refreshKey}`}
                    type="investment"
                    limit={50}
                    onUpdateList={refreshData}
                    searchQuery={searchQuery}
                />
            </div>
        </div>
    );
} 