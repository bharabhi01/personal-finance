'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getTransactions } from '@/lib/database';
import { X, Check, PlusCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TagSelectorProps {
    value: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
    className?: string;
}

export default function TagSelector({
    value = [],
    onChange,
    placeholder = 'Select or add tags',
    className = ''
}: TagSelectorProps) {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [newTagInput, setNewTagInput] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Fetch all unique tags from transactions
    useEffect(() => {
        if (!user) return;

        const fetchTags = async () => {
            try {
                setLoading(true);
                // Get all transactions to extract tags
                const transactions = await getTransactions(user.id);

                // Extract all tags from transactions and flatten the array
                const allTags = transactions.flatMap(transaction => transaction.tags);

                // Get unique tag names and sort alphabetically
                const uniqueTags = Array.from(new Set(allTags))
                    .filter(tag => tag && tag.trim() !== '')  // Filter out empty tags
                    .sort();

                setAvailableTags(uniqueTags);
            } catch (err) {
                console.error('Error fetching tags from transactions:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchTags();
    }, [user]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleToggleTag = (tag: string) => {
        if (value.includes(tag)) {
            onChange(value.filter(t => t !== tag));
        } else {
            onChange([...value, tag]);
        }
    };

    const handleRemoveTag = (tag: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(value.filter(t => t !== tag));
    };

    const handleNewTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewTagInput(e.target.value);
    };

    const handleAddNewTag = () => {
        const newTag = newTagInput.trim();
        if (newTag && !value.includes(newTag)) {
            // Add to selected tags without adding to availableTags
            onChange([...value, newTag]);
            setNewTagInput('');

            // Focus back on input after adding
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddNewTag();
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    // Filter available tags based on search input and show selected temporary tags
    const filteredAvailableTags = availableTags.filter(
        tag => newTagInput === '' || tag.toLowerCase().includes(newTagInput.toLowerCase())
    );

    // Check if the current input matches any existing tag
    const isNewTag = newTagInput.trim() !== '' &&
        !availableTags.some(tag =>
            tag.toLowerCase() === newTagInput.trim().toLowerCase());

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {/* Selected Tags Display */}
            <motion.div
                onClick={() => setIsOpen(!isOpen)}
                className="flex flex-wrap items-center gap-2 px-4 py-3 bg-navbar-hover border border-gray-600/50 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 cursor-pointer min-h-[48px]"
                whileHover={{ borderColor: "#3B82F6" }}
                transition={{ duration: 0.2 }}
            >
                {value.length > 0 ? (
                    <div className="flex flex-wrap gap-2 flex-grow">
                        <AnimatePresence>
                            {value.map((tag, index) => (
                                <motion.span
                                    key={tag}
                                    className={`flex items-center rounded-full px-2 py-1 text-xs
                                        ${availableTags.includes(tag)
                                            ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                                            : 'bg-green-600/20 text-green-300 border border-green-500/30'}`}
                                    initial={{ opacity: 0, scale: 0.8, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.8, y: -10 }}
                                    transition={{
                                        duration: 0.2,
                                        delay: index * 0.05
                                    }}
                                    whileHover={{ scale: 1.05 }}
                                >
                                    {tag}
                                    {availableTags.includes(tag) ? null : (
                                        <span className="ml-1 text-xs text-green-400 opacity-75">(new)</span>
                                    )}
                                    <motion.button
                                        onClick={(e) => handleRemoveTag(tag, e)}
                                        className={`ml-1 ${availableTags.includes(tag)
                                            ? 'text-blue-400 hover:text-blue-300'
                                            : 'text-green-400 hover:text-green-300'}`}
                                        whileHover={{ scale: 1.2 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <X size={14} />
                                    </motion.button>
                                </motion.span>
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <span className="text-gray-400 text-sm">{placeholder}</span>
                )}
                <div className="ml-auto">
                    <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <ChevronDown size={16} className="text-gray-400" />
                    </motion.div>
                </div>
            </motion.div>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="absolute z-10 mt-1 w-full bg-gradient-navbar backdrop-blur-md rounded-lg shadow-lg border border-gray-600/50 max-h-60 overflow-hidden"
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                    >
                        {/* New Tag Input */}
                        <motion.div
                            className="p-3 border-b border-gray-600/50"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                        >
                            <div className="flex items-center">
                                <input
                                    type="text"
                                    ref={inputRef}
                                    value={newTagInput}
                                    onChange={handleNewTagInputChange}
                                    onKeyDown={handleKeyDown}
                                    className="flex-grow bg-transparent border-none focus:ring-0 text-sm p-1 text-white placeholder-gray-400 focus:outline-none"
                                    placeholder="Search or add new tag..."
                                    autoFocus
                                />
                                {isNewTag && (
                                    <motion.button
                                        onClick={handleAddNewTag}
                                        disabled={!newTagInput.trim()}
                                        className="ml-2 text-blue-400 hover:text-blue-300 disabled:text-gray-600"
                                        title="Add new tag"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                    >
                                        <PlusCircle size={18} />
                                    </motion.button>
                                )}
                            </div>
                        </motion.div>

                        {/* Tag List */}
                        <div className="max-h-48 overflow-y-auto">
                            {loading ? (
                                <motion.div
                                    className="p-3 text-sm text-gray-400"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    Loading tags...
                                </motion.div>
                            ) : filteredAvailableTags.length > 0 ? (
                                <motion.ul
                                    className="py-1"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    {filteredAvailableTags.map((tag, index) => (
                                        <motion.li
                                            key={tag}
                                            onClick={() => handleToggleTag(tag)}
                                            className={`px-3 py-2 flex items-center justify-between text-sm cursor-pointer transition-colors ${value.includes(tag)
                                                ? 'bg-blue-600/20 text-blue-300 border-l-2 border-blue-400'
                                                : 'text-gray-300 hover:bg-gray-700/50'
                                                }`}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{
                                                delay: index * 0.03,
                                                duration: 0.2
                                            }}
                                            whileHover={{
                                                x: 5,
                                                transition: { duration: 0.2 }
                                            }}
                                        >
                                            <span>{tag}</span>
                                            {value.includes(tag) && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <Check size={16} className="text-blue-400" />
                                                </motion.div>
                                            )}
                                        </motion.li>
                                    ))}
                                </motion.ul>
                            ) : (
                                <motion.div
                                    className="p-3 text-sm text-gray-400"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    {newTagInput.trim()
                                        ? `No matches found. Press Enter to add "${newTagInput}" as a new tag.`
                                        : 'No tags available. Add your first tag!'}
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
} 