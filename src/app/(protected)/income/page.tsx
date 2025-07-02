'use client';

import { useState } from 'react';
import TransactionList from '@/components/TransactionList';
import TrendChart from '@/components/charts/TrendChart';
import SearchBar from '@/components/SearchBar';
import TagFilter from '@/components/TagFilter';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { DateRange } from '@/types';
import { formatDateForIST, startOfMonthIST } from '@/lib/utils';
import { motion } from 'framer-motion';

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

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: [0.25, 0.46, 0.45, 0.94] as const
            }
        }
    };

    return (
        <motion.div
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header */}
            <motion.div
                className="flex justify-between items-center"
                variants={itemVariants}
            >
                <h1 className="text-2xl font-bold text-white"></h1>
                <DateRangePicker
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                />
            </motion.div>

            {/* Income Trend Chart */}
            <motion.div
                variants={itemVariants}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
            >
                <TrendChart
                    key={`income-trend-chart-${refreshKey}-${dateRange.startDate.getTime()}-${dateRange.endDate.getTime()}`}
                    startDate={formatDateForIST(dateRange.startDate)}
                    endDate={formatDateForIST(dateRange.endDate)}
                    incomeOnly={true}
                />
            </motion.div>

            {/* Income History Table Card */}
            <motion.div
                variants={itemVariants}
                className="bg-gradient-transactions p-6 rounded-lg shadow-lg"
            >
                {/* Controls Header */}
                <motion.div
                    className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <motion.h2
                        className="text-xl font-semibold text-white"
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        Income History
                    </motion.h2>

                    {/* Search and Filters - Horizontal Layout */}
                    <motion.div
                        className="flex flex-col md:flex-row items-stretch md:items-center justify-between md:justify-end gap-4 w-full lg:w-auto"
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                    >
                        {/* Search Bar */}
                        <div className="flex-1 md:flex-initial md:order-1 lg:mr-auto">
                            <SearchBar
                                onSearch={setSearchQuery}
                                placeholder="Search income sources..."
                                className="w-full max-w-lg"
                            />
                        </div>

                        {/* Filters - Rightmost side */}
                        <div className="flex items-center gap-3 flex-shrink-0 md:order-2">
                            <TagFilter
                                onTagsChange={setSelectedTags}
                                transactionType="income"
                                key={`tag-filter-${refreshKey}`}
                            />
                            <DateRangePicker
                                dateRange={dateRange}
                                onDateRangeChange={setDateRange}
                            />
                        </div>
                    </motion.div>
                </motion.div>

                {/* Transaction List */}
                <TransactionList
                    key={`income-list-${refreshKey}-${dateRange.startDate.getTime()}-${dateRange.endDate.getTime()}`}
                    type="income"
                    startDate={formatDateForIST(dateRange.startDate)}
                    endDate={formatDateForIST(dateRange.endDate)}
                    onUpdateList={refreshData}
                    searchQuery={searchQuery}
                    tagFilters={selectedTags}
                />
            </motion.div>
        </motion.div>
    );
} 