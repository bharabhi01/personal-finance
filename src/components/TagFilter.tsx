'use client';

import { useState, useEffect, useRef } from 'react';
import { getTransactions } from '@/lib/database';
import { useAuth } from '@/context/AuthContext';
import { ChevronDownIcon, TagIcon, XIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    // Remove individual tag
    const removeTag = (tagToRemove: string) => {
        const newSelectedTags = selectedTags.filter(tag => tag !== tagToRemove);
        setSelectedTags(newSelectedTags);
        onTagsChange(newSelectedTags);
    };

    // If there are no tags available, don't render the component
    if (availableTags.length === 0 && !loading) {
        return null;
    }

    const getDisplayText = () => {
        if (selectedTags.length === 0) return 'Filter by Tags';
        if (selectedTags.length === 1) return selectedTags[0];
        return `${selectedTags.length} tags selected`;
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 px-3 py-2 bg-navbar-hover rounded-lg border border-gray-600/50 hover:bg-gray-700/50 transition-colors min-w-[140px]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
            >
                <TagIcon className="h-4 w-4 text-gray-300" />
                <span className="text-sm text-white font-medium truncate">
                    {loading ? 'Loading...' : getDisplayText()}
                </span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                </motion.div>
            </motion.button>

            <AnimatePresence>
                {isOpen && !loading && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-64 z-50"
                    >
                        <div className="bg-gradient-navbar backdrop-blur-sm rounded-lg shadow-xl border border-gray-600/50 overflow-hidden">
                            {/* Header */}
                            <div className="px-4 py-3 border-b border-gray-600/50">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium text-white">Filter by Tags</h4>
                                    {selectedTags.length > 0 && (
                                        <button
                                            onClick={clearTags}
                                            className="text-xs text-gray-400 hover:text-white transition-colors"
                                        >
                                            Clear all
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Selected Tags */}
                            {selectedTags.length > 0 && (
                                <div className="px-4 py-3 border-b border-gray-600/50 bg-black/20">
                                    <div className="flex flex-wrap gap-1">
                                        {selectedTags.map((tag) => (
                                            <motion.span
                                                key={tag}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded-md border border-blue-500/30"
                                            >
                                                {tag}
                                                <button
                                                    onClick={() => removeTag(tag)}
                                                    className="hover:text-blue-300 transition-colors"
                                                >
                                                    <XIcon className="h-3 w-3" />
                                                </button>
                                            </motion.span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Available Tags */}
                            <div className="max-h-48 overflow-y-auto">
                                {error ? (
                                    <div className="px-4 py-3 text-sm text-red-400">{error}</div>
                                ) : availableTags.length === 0 ? (
                                    <div className="px-4 py-3 text-sm text-gray-400">No tags available</div>
                                ) : (
                                    <div className="p-2">
                                        {availableTags.map((tag, index) => (
                                            <motion.button
                                                key={tag}
                                                onClick={() => toggleTag(tag)}
                                                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${selectedTags.includes(tag)
                                                        ? 'bg-blue-600/20 text-blue-400'
                                                        : 'text-gray-300 hover:text-white hover:bg-navbar-hover'
                                                    }`}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.03 }}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span>{tag}</span>
                                                    {selectedTags.includes(tag) && (
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                    )}
                                                </div>
                                            </motion.button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
} 