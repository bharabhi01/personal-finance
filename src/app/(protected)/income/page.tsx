'use client';

import { useState } from 'react';
import TransactionForm from '@/components/TransactionForm';
import TransactionList from '@/components/TransactionList';
import IncomeChart from '@/components/charts/IncomeChart';

export default function IncomePage() {
    const [refreshKey, setRefreshKey] = useState(0);

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

            <TransactionForm />

            <div className="mt-6">
                <h2 className="text-xl font-semibold mb-4">Income History</h2>
                <TransactionList
                    key={`income-list-${refreshKey}`}
                    type="income"
                    limit={50}
                    onUpdateList={refreshData}
                />
            </div>
        </div>
    );
} 