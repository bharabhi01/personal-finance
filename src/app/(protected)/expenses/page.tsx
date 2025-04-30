'use client';

import { useState } from 'react';
import TransactionList from '@/components/TransactionList';
import ExpensesChart from '@/components/charts/ExpensesChart';
import SearchBar from '@/components/SearchBar';
import TagFilter from '@/components/TagFilter';

export default function ExpensesPage() {
    const [refreshKey, setRefreshKey] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

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

                <div className="mb-4">
                    <TagFilter
                        onTagsChange={setSelectedTags}
                        transactionType="expense"
                        key={`tag-filter-${refreshKey}`}
                    />
                </div>

                <TransactionList
                    key={`expenses-list-${refreshKey}`}
                    type="expense"
                    startDate={currentMonthStart}
                    endDate={today}
                    onUpdateList={refreshData}
                    searchQuery={searchQuery}
                    tagFilters={selectedTags}
                />
            </div>
        </div>
    );
} 