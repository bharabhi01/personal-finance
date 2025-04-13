'use client';

import { useEffect, useState } from 'react';
import DashboardSummary from '@/components/DashboardSummary';
import TransactionList from '@/components/TransactionList';
import IncomeChart from '@/components/charts/IncomeChart';
import ExpensesChart from '@/components/charts/ExpensesChart';
import SavingsChart from '@/components/charts/SavingsChart';
import { useAuth } from '@/context/AuthContext';

export default function Dashboard() {
    const { user } = useAuth();
    const [refreshKey, setRefreshKey] = useState(0);

    // Function to refresh data
    const refreshData = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Dashboard</h1>
            </div>

            <DashboardSummary key={`summary-${refreshKey}`} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <IncomeChart key={`income-chart-${refreshKey}`} />
                <ExpensesChart key={`expenses-chart-${refreshKey}`} />
            </div>

            <div className="mt-6">
                <SavingsChart key={`savings-chart-${refreshKey}`} />
            </div>

            <div className="mt-6">
                <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
                <TransactionList
                    key={`transactions-${refreshKey}`}
                    limit={5}
                    onUpdateList={refreshData}
                />
            </div>
        </div>
    );
} 