'use client';

import { useState } from 'react';
import { Calendar, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from '@/types';

interface DateRangePickerProps {
    dateRange: DateRange;
    onDateRangeChange: (dateRange: DateRange) => void;
}

export default function DateRangePicker({ dateRange, onDateRangeChange }: DateRangePickerProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newStartDate = e.target.value ? new Date(e.target.value) : new Date();
        onDateRangeChange({
            ...dateRange,
            startDate: newStartDate
        });
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEndDate = e.target.value ? new Date(e.target.value) : new Date();
        onDateRangeChange({
            ...dateRange,
            endDate: newEndDate
        });
    };

    // Preset date ranges
    const applyPreset = (preset: 'today' | 'week' | 'month' | 'year' | 'allTime') => {
        const now = new Date();
        let startDate: Date;

        switch (preset) {
            case 'today':
                startDate = new Date(now);
                break;
            case 'week':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            case 'allTime':
                startDate = new Date(2000, 0, 1); // Arbitrary past date
                break;
            default:
                startDate = new Date(now);
                break;
        }

        onDateRangeChange({
            startDate,
            endDate: now
        });

        setIsOpen(false);
    };

    const formatDateForInput = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    return (
        <div className="relative">
            <div
                className="flex items-center justify-between p-2 border rounded-md cursor-pointer hover:bg-gray-50"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center space-x-2">
                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                        {format(dateRange.startDate, 'dd MMM yyyy')} - {format(dateRange.endDate, 'dd MMM yyyy')}
                    </span>
                </div>
            </div>

            {isOpen && (
                <div className="absolute right-0 mt-2 bg-white border rounded-md shadow-lg z-10 w-72 p-4">
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input
                                type="date"
                                className="w-full border rounded-md p-2 text-sm"
                                value={formatDateForInput(dateRange.startDate)}
                                onChange={handleStartDateChange}
                                max={formatDateForInput(dateRange.endDate)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <input
                                type="date"
                                className="w-full border rounded-md p-2 text-sm"
                                value={formatDateForInput(dateRange.endDate)}
                                onChange={handleEndDateChange}
                                min={formatDateForInput(dateRange.startDate)}
                            />
                        </div>

                        <div className="border-t pt-2">
                            <p className="text-xs text-gray-500 mb-2">Quick Selections</p>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => applyPreset('today')} className="text-xs py-1 px-2 bg-gray-100 hover:bg-gray-200 rounded">
                                    Today
                                </button>
                                <button onClick={() => applyPreset('week')} className="text-xs py-1 px-2 bg-gray-100 hover:bg-gray-200 rounded">
                                    Last 7 Days
                                </button>
                                <button onClick={() => applyPreset('month')} className="text-xs py-1 px-2 bg-gray-100 hover:bg-gray-200 rounded">
                                    This Month
                                </button>
                                <button onClick={() => applyPreset('year')} className="text-xs py-1 px-2 bg-gray-100 hover:bg-gray-200 rounded">
                                    This Year
                                </button>
                                <button onClick={() => applyPreset('allTime')} className="text-xs py-1 px-2 bg-gray-100 hover:bg-gray-200 rounded col-span-2">
                                    All Time
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-xs py-1 px-3 bg-gray-100 hover:bg-gray-200 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-xs py-1 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 