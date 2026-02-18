import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { LogOut, Search, ShoppingCart, User } from 'lucide-react';

export const TopHeader: React.FC = () => {
    const { user, logout } = useAuth();
    const { getTotalItems } = useCart();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (value.trim()) {
            navigate(`/marketplace?search=${encodeURIComponent(value)}`);
        } else {
            navigate('/marketplace');
        }
    };

    // Sync local state with URL param (e.g. on back button)
    useEffect(() => {
        setSearchTerm(searchParams.get('search') || '');
    }, [searchParams]);

    if (!user) return null;

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    const cartItemCount = getTotalItems();

    return (
        <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo & Brand */}
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate(user.role === 'farmer' ? '/farmer/dashboard' : '/marketplace')}>
                    <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                        F
                    </div>
                    <span className="text-xl font-bold text-gray-900 tracking-tight hidden sm:block">Farm<span className="text-green-600">Se</span></span>
                </div>

                {/* Desktop Search (Visible on md+) */}
                <div className="hidden md:flex flex-1 max-w-md mx-8">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search for fresh crops..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                        />
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    {user.role === 'buyer' && (
                        <button
                            onClick={() => navigate('/checkout')}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
                        >
                            <ShoppingCart className="w-5 h-5 text-gray-600" />
                            {cartItemCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                    {cartItemCount}
                                </span>
                            )}
                        </button>
                    )}

                    <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
                        <div className="hidden sm:block text-right">
                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                        </div>
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-medium">
                            {user.name[0].toUpperCase()}
                        </div>
                        <button
                            onClick={() => navigate('/profile')}
                            className="hidden md:block p-2 hover:bg-green-50 text-gray-400 hover:text-green-600 rounded-full transition-all"
                            title="Profile"
                        >
                            <User className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleLogout}
                            className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};
