'use client';

import { useState } from 'react';
import TransactionList from '@/components/TransactionList';
import IncomeChart from '@/components/charts/IncomeChart';
import SearchBar from '@/components/SearchBar';
import TagFilter from '@/components/TagFilter';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { DateRange } from '@/types';
import { formatDateForIST, startOfMonthIST } from '@/lib/utils';

export default function IncomePage() {
    const [refreshKey, setRefreshKey] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    // Setup default date range (current month)
    const now = new Date();
    const firstDayOfMonth = startOfMonthIST(now);

    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: firstDayOfMonth,
        endDate: now
    });

    // Function to refresh data
    const refreshData = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Income</h1>
                <DateRangePicker
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                />
            </div>

            <div className="mb-6">
                <IncomeChart
                    key={`income-chart-${refreshKey}-${dateRange.startDate.getTime()}-${dateRange.endDate.getTime()}`}
                    startDate={formatDateForIST(dateRange.startDate)}
                    endDate={formatDateForIST(dateRange.endDate)}
                />
            </div>

            <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Income History</h2>
                    <div className="w-64">
                        <SearchBar onSearch={setSearchQuery} placeholder="Search income sources..." />
                    </div>
                </div>

                <div className="mb-4">
                    <TagFilter
                        onTagsChange={setSelectedTags}
                        transactionType="income"
                        key={`tag-filter-${refreshKey}`}
                    />
                </div>

                <TransactionList
                    key={`income-list-${refreshKey}-${dateRange.startDate.getTime()}-${dateRange.endDate.getTime()}`}
                    type="income"
                    startDate={formatDateForIST(dateRange.startDate)}
                    endDate={formatDateForIST(dateRange.endDate)}
                    onUpdateList={refreshData}
                    searchQuery={searchQuery}
                    tagFilters={selectedTags}
                />
            </div>
        </div>
    );
} 