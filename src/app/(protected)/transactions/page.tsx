'use client';

import { useState } from 'react';
import TransactionForm from '@/components/TransactionForm';
import TransactionList from '@/components/TransactionList';
import SearchBar from '@/components/SearchBar';
import TagFilter from '@/components/TagFilter';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { DateRange } from '@/types';
import { formatDateForIST, startOfMonthIST } from '@/lib/utils';

export default function TransactionsPage() {
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
                <h1 className="text-2xl font-bold">Transactions</h1>
            </div>

            <TransactionForm onTransactionAdded={refreshData} />

            <div className="mt-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div className="w-full md:w-64">
                        <SearchBar
                            onSearch={setSearchQuery}
                            placeholder="Search transactions..."
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <DateRangePicker
                            dateRange={dateRange}
                            onDateRangeChange={setDateRange}
                        />
                    </div>
                </div>

                <div className="mb-4">
                    <TagFilter
                        onTagsChange={setSelectedTags}
                        key={`tag-filter-${refreshKey}`}
                    />
                </div>

                <TransactionList
                    key={`transaction-list-${refreshKey}-${dateRange.startDate.getTime()}-${dateRange.endDate.getTime()}`}
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