'use client';

import { useState } from 'react';
import TransactionForm from '@/components/TransactionForm';
import TransactionList from '@/components/TransactionList';
import ExpensesChart from '@/components/charts/ExpensesChart';

export default function ExpensesPage() {
    const [refreshKey, setRefreshKey] = useState(0);

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

            <TransactionForm />

            <div className="mt-6">
                <h2 className="text-xl font-semibold mb-4">Expense History</h2>
                <TransactionList
                    key={`expenses-list-${refreshKey}`}
                    type="expense"
                    limit={50}
                    onUpdateList={refreshData}
                />
            </div>
        </div>
    );
} 