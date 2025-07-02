'use client';

import { useEffect, useState } from 'react';
import DashboardSummary from '@/components/DashboardSummary';
import TransactionList from '@/components/TransactionList';
import TrendChart from '@/components/charts/TrendChart';
import BreakdownChart from '@/components/charts/BreakdownChart';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { useAuth } from '@/context/AuthContext';
import { DateRange } from '@/types';
import { formatDateForIST, startOfMonthIST } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function Dashboard() {
    const { user } = useAuth();
    const [refreshKey, setRefreshKey] = useState(0);

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

    // Get user's first name for welcome message
    const userName = user?.email.split('@')[0] || 'User';
    const displayName = userName.charAt(0).toUpperCase() + userName.slice(1);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.3
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
            {/* Header Section */}
            <motion.div
                className="flex justify-between items-center"
                variants={itemVariants}
            >
                <div>
                    <motion.h1
                        className="text-2xl font-bold text-white"
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        Welcome, <span className="font-varela-round">{displayName}</span>
                    </motion.h1>
                </div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <DateRangePicker
                        dateRange={dateRange}
                        onDateRangeChange={setDateRange}
                    />
                </motion.div>
            </motion.div>

            {/* Summary Cards */}
            <motion.div variants={itemVariants}>
                <DashboardSummary
                    key={`summary-${refreshKey}-${dateRange.startDate.getTime()}-${dateRange.endDate.getTime()}`}
                    startDate={formatDateForIST(dateRange.startDate)}
                    endDate={formatDateForIST(dateRange.endDate)}
                />
            </motion.div>

            {/* Charts Section */}
            <motion.div
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                variants={itemVariants}
            >
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                >
                    <TrendChart
                        key={`trend-chart-${refreshKey}-${dateRange.startDate.getTime()}-${dateRange.endDate.getTime()}`}
                        startDate={formatDateForIST(dateRange.startDate)}
                        endDate={formatDateForIST(dateRange.endDate)}
                    />
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                >
                    <BreakdownChart
                        key={`breakdown-chart-${refreshKey}-${dateRange.startDate.getTime()}-${dateRange.endDate.getTime()}`}
                        startDate={formatDateForIST(dateRange.startDate)}
                        endDate={formatDateForIST(dateRange.endDate)}
                    />
                </motion.div>
            </motion.div>

            {/* Recent Transactions */}
            <motion.div
                variants={itemVariants}
            >
                <motion.div
                    className="bg-gradient-transactions p-6 rounded-lg shadow-lg"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.9 }}
                >
                    <motion.h2
                        className="text-xl font-semibold text-white mb-6"
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.8 }}
                    >
                        Recent Transactions
                    </motion.h2>
                    <TransactionList
                        key={`recent-transactions-${refreshKey}-${dateRange.startDate.getTime()}-${dateRange.endDate.getTime()}`}
                        limit={5}
                        startDate={formatDateForIST(dateRange.startDate)}
                        endDate={formatDateForIST(dateRange.endDate)}
                        onUpdateList={refreshData}
                    />
                </motion.div>
            </motion.div>
        </motion.div>
    );
} 