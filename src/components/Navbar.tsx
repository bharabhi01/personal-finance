'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, IndianRupee, LineChart, LogOut, PiggyBank, CreditCard, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
    {
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        label: 'Transactions',
        href: '/transactions',
        icon: IndianRupee,
    },
    {
        label: 'Expenses',
        href: '/expenses',
        icon: CreditCard,
    },
    {
        label: 'Income',
        href: '/income',
        icon: PiggyBank,
    },
    {
        label: 'Investments',
        href: '/investments',
        icon: LineChart,
    },
];

export default function Navbar() {
    const pathname = usePathname();
    const { user, signOut } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <motion.nav
            className="px-6 py-4"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            <div className="max-w-4xl mx-auto bg-gradient-navbar rounded-lg px-6 py-4 shadow-lg">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <motion.div
                        className="flex items-center space-x-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                            <IndianRupee className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-lg font-bold text-white">FinanceTracker</span>
                    </motion.div>

                    {/* Navigation Items */}
                    <div className="flex items-center space-x-1">
                        {navItems.map((item, index) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;

                            return (
                                <motion.div
                                    key={item.href}
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        duration: 0.5,
                                        delay: index * 0.1,
                                        ease: "easeOut"
                                    }}
                                >
                                    <Link href={item.href}>
                                        <motion.div
                                            className={cn(
                                                'flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors',
                                                isActive
                                                    ? 'bg-navbar-hover text-white border border-gray-600/50'
                                                    : 'text-gray-300 hover:text-white hover:bg-navbar-hover'
                                            )}
                                            whileHover={{
                                                scale: 1.05,
                                                transition: { duration: 0.2 }
                                            }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <Icon className="h-4 w-4" />
                                            <span className="text-sm font-medium hidden md:block">{item.label}</span>
                                        </motion.div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* User Profile */}
                    {user && (
                        <motion.div
                            className="relative flex-shrink-0"
                            ref={dropdownRef}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.6 }}
                        >
                            <motion.button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center space-x-2 px-3 py-2 bg-navbar-hover rounded-lg border border-gray-600/50 hover:bg-gray-700/50 transition-colors"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <motion.div
                                    className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs font-medium border border-gray-600"
                                    whileHover={{
                                        boxShadow: "0 0 15px rgba(75, 85, 99, 0.4)",
                                        transition: { duration: 0.3 }
                                    }}
                                >
                                    {user.email.charAt(0).toUpperCase()}
                                </motion.div>
                                <motion.div
                                    animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <ChevronDown className="h-4 w-4 text-gray-400" />
                                </motion.div>
                            </motion.button>

                            {/* Dropdown Menu */}
                            <AnimatePresence>
                                {isDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute right-0 mt-2 w-52 bg-gradient-navbar backdrop-blur-sm rounded-lg shadow-xl border border-gray-600/50 z-50 overflow-hidden"
                                    >
                                        <motion.div
                                            className="px-4 py-3 border-b border-gray-600/50"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.1 }}
                                        >
                                            <p className="text-xs font-medium text-gray-400">Signed in as</p>
                                            <p className="text-sm text-white truncate font-medium">{user.email}</p>
                                        </motion.div>
                                        <div className="p-2">
                                            <motion.button
                                                onClick={() => {
                                                    signOut();
                                                    setIsDropdownOpen(false);
                                                }}
                                                className="w-full flex items-center px-3 py-2 text-sm text-gray-300 hover:text-red-400 hover:bg-navbar-hover transition-colors rounded-lg"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.15 }}
                                            >
                                                <LogOut className="mr-3 h-4 w-4" />
                                                Sign Out
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.nav>
    );
} 