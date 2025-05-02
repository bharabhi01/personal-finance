'use client';

import { useEffect, useState } from 'react';
import DashboardSummary from '@/components/DashboardSummary';
import TransactionList from '@/components/TransactionList';
import IncomeChart from '@/components/charts/IncomeChart';
import ExpensesChart from '@/components/charts/ExpensesChart';
import SavingsChart from '@/components/charts/SavingsChart';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { useAuth } from '@/context/AuthContext';
import { DateRange } from '@/types';
import { formatDateForIST, startOfMonthIST } from '@/lib/utils';

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

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <DateRangePicker
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                />
            </div>

            <DashboardSummary
                key={`summary-${refreshKey}-${dateRange.startDate.getTime()}-${dateRange.endDate.getTime()}`}
                startDate={formatDateForIST(dateRange.startDate)}
                endDate={formatDateForIST(dateRange.endDate)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <IncomeChart
                    key={`income-chart-${refreshKey}-${dateRange.startDate.getTime()}-${dateRange.endDate.getTime()}`}
                    startDate={formatDateForIST(dateRange.startDate)}
                    endDate={formatDateForIST(dateRange.endDate)}
                />
                <ExpensesChart
                    key={`expenses-chart-${refreshKey}-${dateRange.startDate.getTime()}-${dateRange.endDate.getTime()}`}
                    startDate={formatDateForIST(dateRange.startDate)}
                    endDate={formatDateForIST(dateRange.endDate)}
                />
            </div>

            <div className="mt-6">
                <SavingsChart
                    key={`savings-chart-${refreshKey}-${dateRange.startDate.getTime()}-${dateRange.endDate.getTime()}`}
                    startDate={formatDateForIST(dateRange.startDate)}
                    endDate={formatDateForIST(dateRange.endDate)}
                />
            </div>

            <div className="mt-6">
                <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
                <TransactionList
                    key={`transactions-${refreshKey}-${dateRange.startDate.getTime()}-${dateRange.endDate.getTime()}`}
                    limit={5}
                    onUpdateList={refreshData}
                    startDate={formatDateForIST(dateRange.startDate)}
                    endDate={formatDateForIST(dateRange.endDate)}
                />
            </div>
        </div>
    );
} 