'use client';

import { useState } from 'react';
import TransactionForm from '@/components/TransactionForm';
import TransactionList from '@/components/TransactionList';

export default function InvestmentsPage() {
    const [refreshKey, setRefreshKey] = useState(0);

    // Function to refresh the data
    const refreshData = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Investments</h1>
            </div>

            <TransactionForm />

            <div className="mt-6">
                <h2 className="text-xl font-semibold mb-4">Investment History</h2>
                <TransactionList
                    key={`investments-list-${refreshKey}`}
                    type="investment"
                    limit={50}
                    onUpdateList={refreshData}
                />
            </div>
        </div>
    );
} 