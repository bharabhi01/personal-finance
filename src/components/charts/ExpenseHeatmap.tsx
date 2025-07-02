'use client';

import { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, startOfDay, subMonths } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { getTransactions } from '@/lib/database';
import { motion } from 'framer-motion';

interface ExpenseHeatmapProps {
    startDate?: string;
    endDate?: string;
}

interface DayData {
    date: Date;
    amount: number;
    transactionCount: number;
}

export default function ExpenseHeatmap({ startDate, endDate }: ExpenseHeatmapProps) {
    const { user } = useAuth();
    const [heatmapData, setHeatmapData] = useState<DayData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (!user) return;

        const fetchHeatmapData = async () => {
            try {
                setLoading(true);

                let fetchStartDate: string;
                let fetchEndDate: string;

                if (startDate && endDate) {
                    fetchStartDate = startDate;
                    fetchEndDate = endDate;
                } else {
                    // Default to last 12 months
                    const endDateObj = new Date();
                    const startDateObj = subMonths(endDateObj, 12);
                    fetchStartDate = startDateObj.toISOString().split('T')[0];
                    fetchEndDate = endDateObj.toISOString().split('T')[0];
                }

                // Fetch all expense transactions in the period
                const transactions = await getTransactions(
                    user.id,
                    'expense',
                    fetchStartDate,
                    fetchEndDate
                );

                // Create date range
                const start = new Date(fetchStartDate);
                const end = new Date(fetchEndDate);
                const allDays = eachDayOfInterval({ start, end });

                // Group transactions by date
                const dailyExpenses: Record<string, { amount: number; count: number }> = {};

                transactions.forEach(transaction => {
                    const transactionDate = startOfDay(new Date(transaction.date));
                    const dateKey = format(transactionDate, 'yyyy-MM-dd');

                    if (!dailyExpenses[dateKey]) {
                        dailyExpenses[dateKey] = { amount: 0, count: 0 };
                    }

                    dailyExpenses[dateKey].amount += transaction.amount;
                    dailyExpenses[dateKey].count += 1;
                });

                // Create heatmap data
                const data: DayData[] = allDays.map(date => {
                    const dateKey = format(date, 'yyyy-MM-dd');
                    const dayData = dailyExpenses[dateKey] || { amount: 0, count: 0 };

                    return {
                        date,
                        amount: dayData.amount,
                        transactionCount: dayData.count
                    };
                });

                setHeatmapData(data);
                setError(null);
            } catch (err) {
                console.error('Error fetching heatmap data:', err);
                setError('Failed to load heatmap data');
            } finally {
                setLoading(false);
            }
        };

        fetchHeatmapData();
    }, [user, startDate, endDate]);

    // Calculate intensity levels based on spending amounts
    const getIntensityLevel = (amount: number): number => {
        if (amount === 0) return 0;

        const maxAmount = Math.max(...heatmapData.map(d => d.amount));
        if (maxAmount === 0) return 0;

        const ratio = amount / maxAmount;

        if (ratio <= 0.2) return 1;
        if (ratio <= 0.4) return 2;
        if (ratio <= 0.6) return 3;
        if (ratio <= 0.8) return 4;
        return 5;
    };

    const getColorClass = (level: number): string => {
        switch (level) {
            case 0: return 'bg-gray-800 border-gray-700';
            case 1: return 'bg-red-900/30 border-red-800';
            case 2: return 'bg-red-800/50 border-red-700';
            case 3: return 'bg-red-700/70 border-red-600';
            case 4: return 'bg-red-600/80 border-red-500';
            case 5: return 'bg-red-500 border-red-400';
            default: return 'bg-gray-800 border-gray-700';
        }
    };

    const handleMouseEnter = (day: DayData, event: React.MouseEvent) => {
        setHoveredDay(day);
        setMousePosition({ x: event.clientX, y: event.clientY });
    };

    const handleMouseMove = (event: React.MouseEvent) => {
        setMousePosition({ x: event.clientX, y: event.clientY });
    };

    const handleMouseLeave = () => {
        setHoveredDay(null);
    };

    // Group data by weeks for grid layout (like GitHub)
    const getWeekData = () => {
        if (heatmapData.length === 0) return [];

        const weeks: DayData[][] = [];

        // Start from the first Sunday of the period
        const firstDay = heatmapData[0]?.date;
        if (!firstDay) return [];

        const startSunday = startOfWeek(firstDay, { weekStartsOn: 0 });

        // Create a map for quick data lookup
        const dataMap = new Map<string, DayData>();
        heatmapData.forEach(day => {
            const key = format(day.date, 'yyyy-MM-dd');
            dataMap.set(key, day);
        });

        // Generate all weeks from start to end
        let currentDate = new Date(startSunday);
        const lastDay = heatmapData[heatmapData.length - 1]?.date;
        if (!lastDay) return [];

        const endSunday = endOfWeek(lastDay, { weekStartsOn: 0 });

        while (currentDate <= endSunday) {
            const week: DayData[] = [];

            // Generate 7 days for this week
            for (let i = 0; i < 7; i++) {
                const dateKey = format(currentDate, 'yyyy-MM-dd');
                const existingData = dataMap.get(dateKey);

                if (existingData) {
                    week.push(existingData);
                } else {
                    // Create empty day data for days outside our range or with no transactions
                    week.push({
                        date: new Date(currentDate),
                        amount: 0,
                        transactionCount: 0
                    });
                }

                // Move to next day
                currentDate.setDate(currentDate.getDate() + 1);
            }

            weeks.push(week);
        }

        return weeks;
    };

    const weekData = getWeekData();
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (loading) {
        return (
            <div className="border border-card-stroke p-6 rounded-lg shadow-sm">
                <div className="h-48 flex items-center justify-center text-white">Loading heatmap...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="border border-card-stroke p-6 rounded-lg shadow-sm">
                <div className="text-red-400 py-4">{error}</div>
            </div>
        );
    }

    return (
        <div className="border border-card-stroke p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-white">Expense Activity</h2>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>Less</span>
                    <div className="flex gap-1">
                        {[0, 1, 2, 3, 4, 5].map(level => (
                            <div
                                key={level}
                                className={`w-3 h-3 rounded-sm border ${getColorClass(level)}`}
                            />
                        ))}
                    </div>
                    <span>More</span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <div className="min-w-full">
                    {/* Month labels row */}
                    <div className="flex mb-4">
                        <div className="flex gap-1 flex-1">
                            {weekData.map((week, weekIndex) => {
                                const firstDayOfWeek = week[0];
                                const isNewMonth = weekIndex === 0 ||
                                    (weekIndex > 0 && firstDayOfWeek.date.getMonth() !== weekData[weekIndex - 1][0].date.getMonth());

                                const marginClass = isNewMonth && weekIndex > 0 ? 'ml-4' : '';

                                return (
                                    <div key={weekIndex} className={`w-3 text-xs text-gray-400 text-center ${marginClass}`}>
                                        {isNewMonth && firstDayOfWeek.date.getDate() <= 7 ?
                                            monthLabels[firstDayOfWeek.date.getMonth()].slice(0, 3) :
                                            ''
                                        }
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Heatmap grid */}
                    <div className="flex">
                        <div className="flex gap-1">
                            {weekData.map((week, weekIndex) => {
                                const firstDayOfWeek = week[0];
                                const isNewMonth = weekIndex === 0 ||
                                    (weekIndex > 0 && firstDayOfWeek.date.getMonth() !== weekData[weekIndex - 1][0].date.getMonth());

                                const marginClass = isNewMonth && weekIndex > 0 ? 'ml-4' : '';

                                return (
                                    <div key={weekIndex} className={`flex flex-col gap-1 ${marginClass}`}>
                                        {week.map((day, dayIndex) => {
                                            const intensity = getIntensityLevel(day.amount);
                                            const isToday = isSameDay(day.date, new Date());

                                            return (
                                                <motion.div
                                                    key={`${weekIndex}-${dayIndex}`}
                                                    className={`w-3 h-3 rounded-sm border cursor-pointer ${getColorClass(intensity)} ${isToday ? 'ring-2 ring-blue-400' : ''}`}
                                                    onMouseEnter={(e) => handleMouseEnter(day, e)}
                                                    onMouseMove={handleMouseMove}
                                                    onMouseLeave={handleMouseLeave}
                                                    whileHover={{ scale: 1.2 }}
                                                    transition={{ duration: 0.1 }}
                                                />
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tooltip */}
            {hoveredDay && (
                <div
                    className="fixed z-50 bg-gray-900 text-white p-3 rounded-lg shadow-lg border border-gray-700 pointer-events-none"
                    style={{
                        left: mousePosition.x + 10,
                        top: mousePosition.y - 60,
                    }}
                >
                    <div className="text-sm font-medium">
                        {format(hoveredDay.date, 'MMM d, yyyy')}
                    </div>
                    <div className="text-xs text-gray-300">
                        ₹{hoveredDay.amount.toLocaleString()} spent
                    </div>
                    <div className="text-xs text-gray-400">
                        {hoveredDay.transactionCount} transactions
                    </div>
                </div>
            )}
        </div>
    );
} 