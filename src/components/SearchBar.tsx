'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
    onSearch: (query: string) => void;
    placeholder?: string;
    className?: string;
}

export default function SearchBar({
    onSearch,
    placeholder = 'Search by source...',
    className = ''
}: SearchBarProps) {
    const [searchTerm, setSearchTerm] = useState('');

    // Debounce search to avoid too many rerenders
    useEffect(() => {
        const handler = setTimeout(() => {
            onSearch(searchTerm);
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm, onSearch]);

    return (
        <div className={`relative ${className}`}>
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search size={18} className="text-gray-400" />
            </div>
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={placeholder}
            />
            {searchTerm && (
                <button
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    onClick={() => {
                        setSearchTerm('');
                        onSearch('');
                    }}
                >
                    <span className="text-xl font-medium">×</span>
                </button>
            )}
        </div>
    );
} 