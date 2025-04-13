'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, IndianRupee, LineChart, LogOut, PiggyBank, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

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

    return (
        <div className="bg-white border-r h-screen fixed top-0 left-0 w-64 p-4 flex flex-col justify-between">
            <div>
                <div className="mb-6">
                    <h1 className="font-bold text-2xl text-blue-600">FinanceTracker</h1>
                </div>

                <nav className="space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                                pathname === item.href
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-700 hover:bg-gray-100'
                            )}
                        >
                            <item.icon className="mr-3 h-5 w-5 text-current" />
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </div>

            {user && (
                <div className="border-t pt-4">
                    <div className="flex items-center mb-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-2">
                            {user.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-gray-700 truncate">{user.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => signOut()}
                        className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    );
} 