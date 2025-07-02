'use client';

import { useState, useRef, useEffect } from 'react';
import { CalendarIcon, ChevronDownIcon } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import {
    toIndianTime,
    startOfDayIST,
    endOfDayIST,
    startOfMonthIST,
    formatDateForIST,
    formatDatePicker
} from '@/lib/utils';

interface DateRangePickerProps {
    dateRange: DateRange;
    onDateRangeChange: (dateRange: DateRange) => void;
}

const presetOptions = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'Last 7 Days' },
    { key: 'month', label: 'This Month' },
    { key: 'lastMonth', label: 'Last Month' },
    { key: 'year', label: 'This Year' },
    { key: 'allTime', label: 'All Time' },
] as const;

export default function DateRangePicker({ dateRange, onDateRangeChange }: DateRangePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [activePreset, setActivePreset] = useState<string | null>(null);
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

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dateValue = e.target.value;
        if (!dateValue) return;

        const [year, month, day] = dateValue.split('-').map(num => parseInt(num, 10));
        const newStartDate = new Date(year, month - 1, day, 0, 0, 0);

        onDateRangeChange({
            ...dateRange,
            startDate: newStartDate
        });
        setActivePreset(null);
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dateValue = e.target.value;
        if (!dateValue) return;

        const [year, month, day] = dateValue.split('-').map(num => parseInt(num, 10));
        const newEndDate = new Date(year, month - 1, day, 23, 59, 59);

        onDateRangeChange({
            ...dateRange,
            endDate: newEndDate
        });
        setActivePreset(null);
    };

    const applyPreset = (preset: 'today' | 'week' | 'month' | 'lastMonth' | 'year' | 'allTime') => {
        const now = new Date();
        const istNow = toIndianTime(now);
        let startDate: Date;
        let endDate: Date;

        switch (preset) {
            case 'today':
                startDate = startOfDayIST(now);
                endDate = endOfDayIST(now);
                break;
            case 'week':
                startDate = startOfDayIST(now);
                startDate.setDate(startDate.getDate() - 7);
                endDate = endOfDayIST(now);
                break;
            case 'month':
                startDate = startOfMonthIST(now);
                endDate = endOfDayIST(now);
                break;
            case 'lastMonth':
                const lastMonthDate = new Date(istNow.getFullYear(), istNow.getMonth() - 1, 1);
                startDate = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth(), 1, 0, 0, 0);
                endDate = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1, 0, 23, 59, 59);
                break;
            case 'year':
                startDate = new Date(istNow.getFullYear(), 0, 1, 0, 0, 0);
                endDate = endOfDayIST(now);
                break;
            case 'allTime':
                startDate = new Date(2000, 0, 1, 0, 0, 0);
                endDate = endOfDayIST(now);
                break;
            default:
                startDate = startOfDayIST(now);
                endDate = endOfDayIST(now);
                break;
        }

        onDateRangeChange({ startDate, endDate });
        setActivePreset(preset);
        setIsOpen(false);
    };

    const formatDateRange = () => {
        const start = formatDatePicker(toIndianTime(dateRange.startDate));
        const end = formatDatePicker(toIndianTime(dateRange.endDate));

        if (start === end) {
            return start;
        }

        return `${start} - ${end}`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <motion.div
                className="flex items-center space-x-2 px-3 py-2 bg-navbar-hover rounded-lg border border-gray-600/50 cursor-pointer hover:bg-gray-700/50 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
            >
                <CalendarIcon className="h-4 w-4 text-gray-300" />
                <span className="text-sm text-white font-medium">
                    {formatDateRange()}
                </span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                </motion.div>
            </motion.div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-72 z-50"
                    >
                        <div className="bg-gradient-navbar backdrop-blur-sm rounded-lg shadow-xl border border-gray-600/50 overflow-hidden">
                            <div className="p-4">
                                {/* Quick Presets */}
                                <div className="mb-4">
                                    <h4 className="text-sm font-medium text-gray-300 mb-3">Quick Select</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {presetOptions.map((preset, index) => (
                                            <motion.button
                                                key={preset.key}
                                                onClick={() => applyPreset(preset.key as any)}
                                                className={`
                                                    px-3 py-2 rounded-lg text-sm transition-colors
                                                    ${activePreset === preset.key
                                                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                                        : 'text-gray-300 hover:text-white hover:bg-navbar-hover'
                                                    }
                                                `}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.03 }}
                                            >
                                                {preset.label}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Custom Date Range */}
                                <div className="border-t border-gray-600/50 pt-4">
                                    <h4 className="text-sm font-medium text-gray-300 mb-3">Custom Range</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">Start (MM/DD/YYYY)</label>
                                            <input
                                                type="date"
                                                className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors [color-scheme:dark]"
                                                value={formatDateForIST(dateRange.startDate)}
                                                onChange={handleStartDateChange}
                                                max={formatDateForIST(dateRange.endDate)}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">End (MM/DD/YYYY)</label>
                                            <input
                                                type="date"
                                                className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors [color-scheme:dark]"
                                                value={formatDateForIST(dateRange.endDate)}
                                                onChange={handleEndDateChange}
                                                min={formatDateForIST(dateRange.startDate)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Apply Button */}
                                <motion.div
                                    className="pt-4 border-t border-gray-600/50 mt-4"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                                    >
                                        Apply
                                    </button>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
} 