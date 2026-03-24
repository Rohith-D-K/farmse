import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { LogOut, Search, ShoppingCart, User, Globe, MessageSquare, ListOrdered, Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिंदी' },
    { code: 'ta', label: 'தமிழ்' },
    { code: 'te', label: 'తెలుగు' },
    { code: 'kn', label: 'ಕನ್ನಡ' }
];

export const TopHeader: React.FC = () => {
    const { user, logout } = useAuth();
    const { getTotalItems } = useCart();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [showLangMenu, setShowLangMenu] = useState(false);
    const { i18n, t } = useTranslation();

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
        <header className="sticky top-0 z-40 w-full border-b border-farmse-green/10"
            style={{ background: 'rgba(249,246,240,0.92)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}>
            <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-3">

                {/* Logo & Brand */}
                <div
                    className="flex items-center gap-2 cursor-pointer flex-shrink-0"
                    onClick={() => {
                        if (user.role === 'admin') navigate('/admin/dashboard');
                        else if (user.role === 'farmer') navigate('/farmer/dashboard');
                        else navigate('/marketplace');
                    }}
                >
                    {/* Leaf mark */}
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-base shadow-card flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #2D7A4F 0%, #1A5C3A 100%)' }}>
                        🌿
                    </div>
                    <span className="text-xl hidden sm:block tracking-tight" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#1A2E1F' }}>
                        Farm<span style={{ color: '#2D7A4F' }}>se</span>
                    </span>
                </div>

                {/* Desktop Search (Buyer/Retailer only, md+) */}
                <div className="hidden md:flex flex-1 max-w-sm mx-6">
                    {(user.role === 'buyer' || user.role === 'retailer') && (
                        <div className="relative w-full" id="tour-search-bar">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-farmse-muted" strokeWidth={1.5} />
                            <input
                                type="text"
                                placeholder={t('marketplace.search_placeholder')}
                                value={searchTerm}
                                onChange={handleSearch}
                                className="w-full pl-10 pr-4 py-2.5 rounded-pill text-sm border border-farmse-green/20 bg-white/80 focus:outline-none focus:ring-2 focus:ring-farmse-green/20 focus:border-farmse-green transition-all placeholder:text-gray-400"
                                style={{ fontFamily: 'var(--font-body)' }}
                            />
                        </div>
                    )}
                    {user.role !== 'buyer' && user.role !== 'retailer' && <div className="w-full" />}
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-1">

                    {/* Language Switcher */}
                    <div className="relative" id="tour-language-switcher">
                        <button
                            onClick={() => setShowLangMenu(!showLangMenu)}
                            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-farmse-green-light transition-colors"
                            title="Change Language"
                        >
                            <Globe className="w-[18px] h-[18px] text-farmse-muted" strokeWidth={1.5} />
                        </button>
                        {showLangMenu && (
                            <div className="absolute right-0 top-full mt-2 bg-white rounded-card shadow-card-hover border border-farmse-green/10 py-1 z-50 min-w-[148px]">
                                {LANGUAGES.map(lang => (
                                    <button
                                        key={lang.code}
                                        onClick={() => { i18n.changeLanguage(lang.code); setShowLangMenu(false); }}
                                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${i18n.language === lang.code ? 'text-farmse-green font-semibold bg-farmse-green-light' : 'text-gray-700 hover:bg-farmse-surface'}`}
                                        style={{ fontFamily: 'var(--font-body)' }}
                                    >
                                        {lang.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Messages */}
                    <button
                        onClick={() => navigate('/messages')}
                        className="hidden sm:flex w-9 h-9 items-center justify-center rounded-full hover:bg-farmse-green-light transition-colors"
                        title="Messages"
                    >
                        <MessageSquare className="w-[18px] h-[18px] text-farmse-muted" strokeWidth={1.5} />
                    </button>

                    {/* Notification bell placeholder */}
                    <button
                        className="hidden sm:flex w-9 h-9 items-center justify-center rounded-full hover:bg-farmse-green-light transition-colors relative"
                        title="Notifications"
                    >
                        <Bell className="w-[18px] h-[18px] text-farmse-muted" strokeWidth={1.5} />
                    </button>

                    {/* Orders (buyer/retailer) */}
                    {(user.role === 'buyer' || user.role === 'retailer') && (
                        <button
                            onClick={() => navigate('/orders')}
                            className="hidden sm:flex w-9 h-9 items-center justify-center rounded-full hover:bg-farmse-green-light transition-colors"
                            title="My Orders"
                        >
                            <ListOrdered className="w-[18px] h-[18px] text-farmse-muted" strokeWidth={1.5} />
                        </button>
                    )}

                    {/* Cart (buyer/retailer) */}
                    {(user.role === 'buyer' || user.role === 'retailer') && (
                        <button
                            onClick={() => navigate('/checkout')}
                            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-farmse-green-light transition-colors relative"
                        >
                            <ShoppingCart className="w-[18px] h-[18px] text-farmse-muted" strokeWidth={1.5} />
                            {cartItemCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                                    style={{ background: '#F5A623', fontFamily: 'var(--font-body)' }}>
                                    {cartItemCount}
                                </span>
                            )}
                        </button>
                    )}

                    {/* Divider */}
                    <div className="w-px h-6 bg-farmse-green/10 mx-1 hidden sm:block" />

                    {/* Avatar + name */}
                    <div className="flex items-center gap-2">
                        <div className="hidden sm:block text-right">
                            <p className="text-xs font-semibold text-farmse-dark leading-tight" style={{ fontFamily: 'var(--font-body)' }}>{user.name}</p>
                            <p className="text-[10px] text-farmse-muted capitalize leading-tight">{user.role}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, #2D7A4F, #1A5C3A)', fontFamily: 'var(--font-body)' }}>
                            {user.name[0].toUpperCase()}
                        </div>
                    </div>

                    {/* Profile */}
                    <button
                        onClick={() => navigate('/profile')}
                        className="hidden md:flex w-9 h-9 items-center justify-center rounded-full hover:bg-farmse-green-light text-farmse-muted hover:text-farmse-green transition-all"
                        title="Profile"
                    >
                        <User className="w-[18px] h-[18px]" strokeWidth={1.5} />
                    </button>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="hidden sm:flex w-9 h-9 items-center justify-center rounded-full hover:bg-red-50 text-farmse-muted hover:text-red-500 transition-all"
                        title="Logout"
                    >
                        <LogOut className="w-[18px] h-[18px]" strokeWidth={1.5} />
                    </button>
                </div>
            </div>
        </header>
    );
};
