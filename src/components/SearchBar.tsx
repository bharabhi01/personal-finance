'use client';

import { useState, useEffect } from 'react';
import { SearchIcon, XIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface SearchBarProps {
    onSearch: (query: string) => void;
    placeholder?: string;
    className?: string;
}

export default function SearchBar({
    onSearch,
    placeholder = 'Search transactions...',
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
                <SearchIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 bg-navbar-hover border border-gray-600/50 rounded-lg text-white text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder={placeholder}
            />
            {searchTerm && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white transition-colors"
                    onClick={() => {
                        setSearchTerm('');
                        onSearch('');
                    }}
                >
                    <XIcon className="h-4 w-4" />
                </motion.button>
            )}
        </div>
    );
} 