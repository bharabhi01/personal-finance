'use client';

import { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from '@/types';
import {
    toIndianTime,
    startOfDayIST,
    endOfDayIST,
    startOfMonthIST,
    formatDateForIST
} from '@/lib/utils';

interface DateRangePickerProps {
    dateRange: DateRange;
    onDateRangeChange: (dateRange: DateRange) => void;
}

export default function DateRangePicker({ dateRange, onDateRangeChange }: DateRangePickerProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dateValue = e.target.value;
        if (!dateValue) return;

        // Parse the date in YYYY-MM-DD format and set it to IST
        const [year, month, day] = dateValue.split('-').map(num => parseInt(num, 10));
        const newStartDate = new Date(year, month - 1, day, 0, 0, 0);

        onDateRangeChange({
            ...dateRange,
            startDate: newStartDate
        });
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dateValue = e.target.value;
        if (!dateValue) return;

        // Parse the date in YYYY-MM-DD format and set it to IST
        const [year, month, day] = dateValue.split('-').map(num => parseInt(num, 10));
        const newEndDate = new Date(year, month - 1, day, 23, 59, 59);

        onDateRangeChange({
            ...dateRange,
            endDate: newEndDate
        });
    };

    // Preset date ranges
    const applyPreset = (preset: 'today' | 'week' | 'month' | 'lastMonth' | 'year' | 'allTime') => {
        const now = new Date(); // Current date in local time
        const istNow = toIndianTime(now); // Convert to IST
        let startDate: Date;
        let endDate: Date;

        switch (preset) {
            case 'today':
                startDate = startOfDayIST(now);
                endDate = endOfDayIST(now);
                break;
            case 'week':
                // 7 days before today in IST
                startDate = startOfDayIST(now);
                startDate.setDate(startDate.getDate() - 7);
                endDate = endOfDayIST(now);
                break;
            case 'month':
                // First day of current month in IST
                startDate = startOfMonthIST(now);
                endDate = endOfDayIST(now);
                break;
            case 'lastMonth':
                // Calculate last month's dates in IST
                const lastMonthDate = new Date(istNow.getFullYear(), istNow.getMonth() - 1, 1);
                startDate = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth(), 1, 0, 0, 0);
                // Last day of last month
                endDate = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1, 0, 23, 59, 59);
                break;
            case 'year':
                // First day of current year in IST
                startDate = new Date(istNow.getFullYear(), 0, 1, 0, 0, 0);
                endDate = endOfDayIST(now);
                break;
            case 'allTime':
                // A date far in the past for "all time" view
                startDate = new Date(2000, 0, 1, 0, 0, 0);
                endDate = endOfDayIST(now);
                break;
            default:
                startDate = startOfDayIST(now);
                endDate = endOfDayIST(now);
                break;
        }

        onDateRangeChange({
            startDate,
            endDate
        });

        setIsOpen(false);
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
                        {format(toIndianTime(dateRange.startDate), 'dd MMM yyyy')} - {format(toIndianTime(dateRange.endDate), 'dd MMM yyyy')}
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
                                value={formatDateForIST(dateRange.startDate)}
                                onChange={handleStartDateChange}
                                max={formatDateForIST(dateRange.endDate)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <input
                                type="date"
                                className="w-full border rounded-md p-2 text-sm"
                                value={formatDateForIST(dateRange.endDate)}
                                onChange={handleEndDateChange}
                                min={formatDateForIST(dateRange.startDate)}
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
                                <button onClick={() => applyPreset('lastMonth')} className="text-xs py-1 px-2 bg-gray-100 hover:bg-gray-200 rounded">
                                    Last Month
                                </button>
                                <button onClick={() => applyPreset('year')} className="text-xs py-1 px-2 bg-gray-100 hover:bg-gray-200 rounded">
                                    This Year
                                </button>
                                <button onClick={() => applyPreset('allTime')} className="text-xs py-1 px-2 bg-gray-100 hover:bg-gray-200 rounded">
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