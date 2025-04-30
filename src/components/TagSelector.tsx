'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getTransactions } from '@/lib/database';
import { X, Check, PlusCircle, ChevronDown, ChevronUp } from 'lucide-react';

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
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="flex flex-wrap items-center gap-2 p-2 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 cursor-pointer min-h-[42px]"
            >
                {value.length > 0 ? (
                    <div className="flex flex-wrap gap-2 flex-grow">
                        {value.map(tag => (
                            <span
                                key={tag}
                                className={`flex items-center rounded-full px-2 py-1 text-xs
                                    ${availableTags.includes(tag)
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-green-100 text-green-800'}`}
                            >
                                {tag}
                                {availableTags.includes(tag) ? null : (
                                    <span className="ml-1 text-xs text-green-600 opacity-75">(new)</span>
                                )}
                                <button
                                    onClick={(e) => handleRemoveTag(tag, e)}
                                    className="ml-1 text-blue-500 hover:text-blue-700"
                                >
                                    <X size={14} />
                                </button>
                            </span>
                        ))}
                    </div>
                ) : (
                    <span className="text-gray-500 text-sm">{placeholder}</span>
                )}
                <div className="ml-auto">
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto">
                    {/* New Tag Input */}
                    <div className="p-2 border-b">
                        <div className="flex items-center">
                            <input
                                type="text"
                                ref={inputRef}
                                value={newTagInput}
                                onChange={handleNewTagInputChange}
                                onKeyDown={handleKeyDown}
                                className="flex-grow border-none focus:ring-0 text-sm p-1"
                                placeholder="Search or add new tag..."
                                autoFocus
                            />
                            {isNewTag && (
                                <button
                                    onClick={handleAddNewTag}
                                    disabled={!newTagInput.trim()}
                                    className="ml-2 text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                                    title="Add new tag"
                                >
                                    <PlusCircle size={18} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tag List */}
                    {loading ? (
                        <div className="p-2 text-sm text-gray-500">Loading tags...</div>
                    ) : filteredAvailableTags.length > 0 ? (
                        <ul className="py-1">
                            {filteredAvailableTags.map(tag => (
                                <li
                                    key={tag}
                                    onClick={() => handleToggleTag(tag)}
                                    className={`px-3 py-2 flex items-center justify-between text-sm cursor-pointer hover:bg-gray-100 ${value.includes(tag) ? 'bg-blue-50' : ''
                                        }`}
                                >
                                    <span>{tag}</span>
                                    {value.includes(tag) && <Check size={16} className="text-blue-600" />}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-2 text-sm text-gray-500">
                            {newTagInput.trim()
                                ? `No matches found. Press Enter to add "${newTagInput}" as a new tag.`
                                : 'No tags available. Add your first tag!'}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
} 