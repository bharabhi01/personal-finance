'use client';

import { useState, useEffect } from 'react';
import { getTransactions } from '@/lib/database';
import { useAuth } from '@/context/AuthContext';
import { XCircle } from 'lucide-react';

interface TagFilterProps {
    onTagsChange: (selectedTags: string[]) => void;
    className?: string;
    transactionType?: 'expense' | 'income' | 'investment';
}

export default function TagFilter({
    onTagsChange,
    className = '',
    transactionType
}: TagFilterProps) {
    const { user } = useAuth();
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch all unique tags from transactions
    useEffect(() => {
        if (!user) return;

        const fetchTags = async () => {
            try {
                setLoading(true);

                // Get all transactions to extract tags
                const transactions = await getTransactions(user.id, transactionType);

                // Extract all tags from transactions and flatten the array
                const allTags = transactions.flatMap(transaction => transaction.tags);

                // Get unique tag names and sort alphabetically
                const uniqueTags = Array.from(new Set(allTags))
                    .filter(tag => tag && tag.trim() !== '')  // Filter out empty tags
                    .sort();

                setAvailableTags(uniqueTags);
                setError(null);
            } catch (err) {
                console.error('Error fetching tags from transactions:', err);
                setError('Failed to load tags');
            } finally {
                setLoading(false);
            }
        };

        fetchTags();
    }, [user, transactionType]);

    // Handle tag selection
    const toggleTag = (tag: string) => {
        const newSelectedTags = selectedTags.includes(tag)
            ? selectedTags.filter(t => t !== tag)
            : [...selectedTags, tag];

        setSelectedTags(newSelectedTags);
        onTagsChange(newSelectedTags);
    };

    // Clear all selected tags
    const clearTags = () => {
        setSelectedTags([]);
        onTagsChange([]);
    };

    // If there are no tags available, don't render the component
    if (availableTags.length === 0 && !loading) {
        return null;
    }

    return (
        <div className={`${className}`}>
            <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Filter by Tags</label>
                {selectedTags.length > 0 && (
                    <button
                        onClick={clearTags}
                        className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
                    >
                        <XCircle size={14} className="mr-1" />
                        Clear filters
                    </button>
                )}
            </div>

            {loading ? (
                <div className="text-sm text-gray-500">Loading tags...</div>
            ) : error ? (
                <div className="text-sm text-red-500">{error}</div>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                        <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={`
                                inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                                ${selectedTags.includes(tag)
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}
                                transition-colors duration-200
                            `}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
} 