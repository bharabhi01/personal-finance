'use client';

import { useState } from 'react';
import BudgetManager from '@/components/BudgetManager';
import BudgetAlert from '@/components/BudgetAlert';
import { motion } from 'framer-motion';
import { Target, Calendar, TrendingUp, AlertCircle, Info } from 'lucide-react';

export default function BudgetPage() {
    const [refreshKey, setRefreshKey] = useState(0);

    // Get current month for display
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const refreshData = () => {
        setRefreshKey(prev => prev + 1);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: [0.25, 0.46, 0.45, 0.94] as const
            }
        }
    };

    return (
        <motion.div
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header Section */}
            <motion.div
                className="flex items-center gap-4"
                variants={itemVariants}
            >
                <div className="p-3 bg-purple-600/20 rounded-lg border border-purple-500/30">
                    <Target className="text-purple-400" size={32} />
                </div>
                <div>
                    <motion.h1
                        className="text-3xl font-bold text-white"
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        Budget Management
                    </motion.h1>
                    <motion.p
                        className="text-gray-400 mt-1"
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                    >
                        Set and track your monthly spending limits
                    </motion.p>
                </div>
            </motion.div>

            {/* Current Month Info */}
            <motion.div
                className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg border border-blue-500/30 p-4"
                variants={itemVariants}
            >
                <div className="flex items-center gap-3">
                    <Calendar className="text-blue-400" size={20} />
                    <div>
                        <h3 className="font-semibold text-white">Current Period</h3>
                        <p className="text-gray-300 text-sm">{monthName}</p>
                    </div>
                </div>
            </motion.div>

            {/* Budget Alert */}
            <motion.div variants={itemVariants}>
                <BudgetAlert
                    key={`alert-${refreshKey}`}
                    month={currentMonth}
                />
            </motion.div>

            {/* Budget Manager */}
            <motion.div variants={itemVariants}>
                <BudgetManager
                    key={`manager-${refreshKey}`}
                    month={currentMonth}
                    onBudgetUpdate={refreshData}
                    compact={false}
                />
            </motion.div>

            {/* Information Cards */}
            <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                variants={itemVariants}
            >
                {/* Tips Card */}
                <motion.div
                    className="bg-gradient-to-br from-green-600/20 to-blue-600/20 rounded-lg border border-green-500/30 p-6"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <TrendingUp className="text-green-400" size={24} />
                        <h3 className="font-semibold text-white">Budget Tips</h3>
                    </div>
                    <ul className="space-y-2 text-gray-300 text-sm">
                        <li className="flex items-start gap-2">
                            <span className="text-green-400 mt-1">•</span>
                            <span>Set realistic monthly limits based on your income</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-400 mt-1">•</span>
                            <span>Aim to keep expenses below 70-80% of your income</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-400 mt-1">•</span>
                            <span>Review and adjust your budget monthly</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-400 mt-1">•</span>
                            <span>Track categories that exceed your expectations</span>
                        </li>
                    </ul>
                </motion.div>

                {/* Alerts Info Card */}
                <motion.div
                    className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 rounded-lg border border-yellow-500/30 p-6"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.9 }}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <AlertCircle className="text-yellow-400" size={24} />
                        <h3 className="font-semibold text-white">Alert Settings</h3>
                    </div>
                    <div className="space-y-3 text-gray-300 text-sm">
                        <div className="flex justify-between items-center">
                            <span>Warning at:</span>
                            <span className="text-yellow-400 font-medium">80% of budget</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Danger at:</span>
                            <span className="text-red-400 font-medium">100% of budget</span>
                        </div>
                        <div className="mt-4 p-3 bg-black/20 rounded border border-yellow-500/20">
                            <div className="flex items-start gap-2">
                                <Info className="text-yellow-400 mt-0.5" size={16} />
                                <span>Budget alerts appear on your dashboard when you approach your spending limit</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Monthly Progress Overview */}
            <motion.div
                className="bg-gradient-to-br from-gray-600/20 to-slate-600/20 rounded-lg border border-gray-500/30 p-6"
                variants={itemVariants}
            >
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <Target className="text-gray-400" size={20} />
                    How Budget Tracking Works
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-black/20 rounded p-4 border border-gray-600/30">
                        <div className="text-purple-400 font-medium mb-2">1. Set Your Budget</div>
                        <p className="text-gray-300">Define your monthly spending limit based on your income and financial goals.</p>
                    </div>
                    <div className="bg-black/20 rounded p-4 border border-gray-600/30">
                        <div className="text-blue-400 font-medium mb-2">2. Track Expenses</div>
                        <p className="text-gray-300">All your expense transactions are automatically counted towards your budget.</p>
                    </div>
                    <div className="bg-black/20 rounded p-4 border border-gray-600/30">
                        <div className="text-green-400 font-medium mb-2">3. Get Alerts</div>
                        <p className="text-gray-300">Receive warnings when you're close to your limit to help you stay on track.</p>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}