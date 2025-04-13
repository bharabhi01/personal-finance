'use client';

import { useState } from 'react';
import TransactionForm from '@/components/TransactionForm';
import TransactionList from '@/components/TransactionList';

export default function TransactionsPage() {
    const [refreshKey, setRefreshKey] = useState(0);

    // Function to refresh the transaction list
    const refreshTransactions = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">All Transactions</h1>
            </div>

            <TransactionForm />

            <div className="mt-6">
                <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
                <TransactionList
                    key={`transactions-${refreshKey}`}
                    limit={50}
                    onUpdateList={refreshTransactions}
                />
            </div>
        </div>
    );
} 