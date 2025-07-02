'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { IndianRupee, User, Mail, Lock, Eye, EyeOff, TrendingUp, TrendingDown, PiggyBank, CreditCard, BarChart3, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RegisterPage() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { signUp } = useAuth();
    const router = useRouter();

    // Financial feature cards data
    const featureCards = [
        {
            id: 1,
            title: "Monthly Income",
            value: "₹85,430",
            change: "+12.5%",
            icon: TrendingUp,
            color: "text-green-400",
            bgColor: "bg-green-500/10"
        },
        {
            id: 2,
            title: "Total Expenses",
            value: "₹52,120",
            change: "-8.2%",
            icon: CreditCard,
            color: "text-red-400",
            bgColor: "bg-red-500/10"
        },
        {
            id: 3,
            title: "Investments",
            value: "₹1,24,500",
            change: "+15.8%",
            icon: BarChart3,
            color: "text-purple-400",
            bgColor: "bg-purple-500/10"
        },
        {
            id: 4,
            title: "Savings Goal",
            value: "₹33,310",
            change: "68% Complete",
            icon: PiggyBank,
            color: "text-blue-400",
            bgColor: "bg-blue-500/10"
        },
        {
            id: 5,
            title: "Top Expense",
            value: "₹12,800",
            change: "Groceries",
            icon: TrendingDown,
            color: "text-orange-400",
            bgColor: "bg-orange-500/10"
        },
        {
            id: 6,
            title: "Net Worth",
            value: "₹2,87,650",
            change: "+22.3%",
            icon: DollarSign,
            color: "text-emerald-400",
            bgColor: "bg-emerald-500/10"
        }
    ];

    // Redirect to sign in after successful registration
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => {
                router.push('/login');
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [success, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password should be at least 6 characters');
            return;
        }

        try {
            setError(null);
            setLoading(true);
            await signUp(email, password);
            setSuccess(true);
        } catch (err: any) {
            console.error('Registration error:', err);
            setError(err.message || 'Failed to create account');
            setSuccess(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div
                className="w-full max-w-6xl bg-gradient-transactions backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-gray-600/30"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            >
                <div className="flex flex-col lg:flex-row min-h-[600px]">
                    {/* Left Side - Feature Cards */}
                    <motion.div
                        className="lg:w-1/2 relative overflow-hidden bg-gradient-transactions/50 p-2"
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <div className="absolute inset-2 rounded-3xl bg-gradient-to-br from-blue-900/40 via-blue-800/30 to-gray-900/50 backdrop-blur-sm overflow-hidden">
                            {/* Scrolling Feature Cards */}
                            <div className="relative h-full">
                                {/* Top fade overlay */}
                                <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-blue-900/60 to-transparent z-10 rounded-t-3xl"></div>

                                {/* Bottom fade overlay */}
                                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-blue-900/60 to-transparent z-10 rounded-b-3xl"></div>

                                {/* Animated cards container */}
                                <motion.div
                                    className="flex flex-col space-y-4 p-6 pt-20"
                                    animate={{
                                        y: [0, -featureCards.length * 120]
                                    }}
                                    transition={{
                                        duration: featureCards.length * 3,
                                        repeat: Infinity,
                                        ease: "linear",
                                        repeatType: "loop"
                                    }}
                                >
                                    {/* Render cards twice for seamless loop */}
                                    {[...featureCards, ...featureCards].map((card, index) => {
                                        const Icon = card.icon;
                                        return (
                                            <motion.div
                                                key={`${card.id}-${index}`}
                                                className={`${card.bgColor} backdrop-blur-sm rounded-xl p-4 border border-white/10 min-h-[100px]`}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: index * 0.1 }}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <div className={`p-2 rounded-lg ${card.bgColor}`}>
                                                            <Icon className={`h-5 w-5 ${card.color}`} />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-white font-medium text-sm">{card.title}</h3>
                                                            <p className="text-gray-300 text-xs">{card.change}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-white font-bold text-lg">{card.value}</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </motion.div>
                            </div>
                        </div>


                    </motion.div>

                    {/* Right Side - Sign Up Form */}
                    <motion.div
                        className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center bg-gradient-transactions/50"
                        initial={{ x: 100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                    >
                        <div className="w-full max-w-md mx-auto">
                            <motion.div
                                className="text-center mb-8"
                                initial={{ y: 30, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.6, delay: 0.6 }}
                            >
                                <h2 className="text-3xl font-bold text-white mb-2">Create Your Account</h2>
                                <p className="text-gray-400">Join thousands managing their finances smarter</p>
                            </motion.div>

                            {/* Error Message */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                    >
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Success Message */}
                            <AnimatePresence>
                                {success && (
                                    <motion.div
                                        className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg mb-6"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                    >
                                        Account created successfully! Redirecting to sign in...
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <form className="space-y-6" onSubmit={handleSubmit}>
                                {/* First Name and Last Name */}
                                <motion.div
                                    className="grid grid-cols-2 gap-4"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.8 }}
                                >
                                    <div>
                                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
                                            First Name
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                            <input
                                                id="firstName"
                                                type="text"
                                                required
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                className="w-full pl-10 pr-3 py-2.5 bg-navbar-hover border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                placeholder="John"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
                                            Last Name
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                            <input
                                                id="lastName"
                                                type="text"
                                                required
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                className="w-full pl-10 pr-3 py-2.5 bg-navbar-hover border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                placeholder="Doe"
                                            />
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Email */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.9 }}
                                >
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <input
                                            id="email"
                                            type="email"
                                            autoComplete="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-10 pr-3 py-2.5 bg-navbar-hover border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                </motion.div>

                                {/* Password */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 1.0 }}
                                >
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            autoComplete="new-password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-10 pr-12 py-2.5 bg-navbar-hover border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-300"
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </motion.div>

                                {/* Confirm Password */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 1.1 }}
                                >
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            autoComplete="new-password"
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full pl-10 pr-12 py-2.5 bg-navbar-hover border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-300"
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </motion.div>

                                {/* Sign Up Button */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 1.2 }}
                                >
                                    <motion.button
                                        type="submit"
                                        disabled={loading || success}
                                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                                        whileHover={{ scale: loading || success ? 1 : 1.02 }}
                                        whileTap={{ scale: loading || success ? 1 : 0.98 }}
                                    >
                                        {loading ? (
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                                Creating Account...
                                            </div>
                                        ) : success ? (
                                            'Account Created! Redirecting...'
                                        ) : (
                                            'Sign Up'
                                        )}
                                    </motion.button>
                                </motion.div>
                            </form>

                            {/* Sign In Link */}
                            <motion.div
                                className="mt-8 text-center"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5, delay: 1.3 }}
                            >
                                <p className="text-gray-400">
                                    Already have an account?{' '}
                                    <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                                        Sign In
                                    </Link>
                                </p>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
} 