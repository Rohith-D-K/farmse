import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';
import { 
    Store, 
    ShoppingBag, 
    Users, 
    RefreshCcw, 
    Calendar, 
    BadgeCheck, 
    AlertCircle,
    TrendingUp,
    Briefcase,
    MessageCircle,
    Truck,
    ArrowRight
} from 'lucide-react';

export const Dashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const isVerifiedRetailer = user?.role === 'retailer' && user?.retailerStatus === 'verified';

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (isVerifiedRetailer) {
                try {
                    const data = await api.retailer.getAnalytics();
                    setAnalytics(data);
                } catch (error) {
                    console.error('Error fetching retailer analytics:', error);
                }
            }
            setLoading(false);
        };
        fetchAnalytics();
    }, [isVerifiedRetailer]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                            {user?.role === 'retailer' ? '🏪' : '🛍️'}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                                    {t('buyer_dashboard.welcome', { name: user?.name?.split(' ')[0] })}
                                </h1>
                                {user?.role === 'retailer' && (
                                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                        user.retailerStatus === 'verified' ? 'bg-green-100 text-green-700' : 
                                        user.retailerStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                        {user.retailerStatus === 'verified' && <BadgeCheck className="w-3 h-3" />}
                                        {user.retailerStatus || 'Pending'}
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                                <span className="text-gray-400">📍</span> {user?.location}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button
                            onClick={() => navigate('/profile')}
                            className="flex-1 md:flex-none px-4 py-2 bg-gray-50 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors"
                        >
                            {t('common.profile')}
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex-1 md:flex-none px-4 py-2 border border-red-100 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors"
                        >
                            {t('common.logout')}
                        </button>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Actions & Info */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Quick Actions Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <button onClick={() => navigate('/marketplace')} className="dashboard-action-card group bg-green-600 text-white border-none">
                                <Store className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
                                <span className="font-bold text-sm">Marketplace</span>
                                <span className="text-[10px] opacity-80 mt-1">Browse fresh produce</span>
                            </button>
                            
                            <button onClick={() => navigate('/marketplace?tab=harvests')} className="dashboard-action-card group">
                                <Calendar className="w-6 h-6 mb-2 text-orange-500 group-hover:scale-110 transition-transform" />
                                <span className="font-bold text-sm text-gray-800">Harvests</span>
                                <span className="text-[10px] text-gray-500 mt-1">Upcoming crops</span>
                            </button>

                            <button onClick={() => navigate('/orders')} className="dashboard-action-card group">
                                <ShoppingBag className="w-6 h-6 mb-2 text-blue-500 group-hover:scale-110 transition-transform" />
                                <span className="font-bold text-sm text-gray-800">My Orders</span>
                                <span className="text-[10px] text-gray-500 mt-1">Normal purchases</span>
                            </button>

                            <button onClick={() => navigate('/orders?type=community')} className="dashboard-action-card group">
                                <Users className="w-6 h-6 mb-2 text-purple-500 group-hover:scale-110 transition-transform" />
                                <span className="font-bold text-sm text-gray-800">Community</span>
                                <span className="text-[10px] text-gray-500 mt-1">Group buying deals</span>
                            </button>

                            <button onClick={() => navigate('/orders?type=subscription')} className="dashboard-action-card group">
                                <RefreshCcw className="w-6 h-6 mb-2 text-indigo-500 group-hover:scale-110 transition-transform" />
                                <span className="font-bold text-sm text-gray-800">Subscriptions</span>
                                <span className="text-[10px] text-gray-500 mt-1">Regular deliveries</span>
                            </button>

                            <button onClick={() => navigate('/chat/bot')} className="dashboard-action-card group">
                                <MessageCircle className="w-6 h-6 mb-2 text-teal-500 group-hover:scale-110 transition-transform" />
                                <span className="font-bold text-sm text-gray-800">AI Assistant</span>
                                <span className="text-[10px] text-gray-500 mt-1">24/7 Farm help</span>
                            </button>
                        </div>

                        {/* Retailer Verified Section */}
                        {isVerifiedRetailer && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Briefcase className="w-5 h-5 text-indigo-600" />
                                    Retailer Business Center
                                </h2>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden ring-4 ring-indigo-50">
                                        <div className="relative z-10">
                                            <h3 className="font-bold text-lg mb-1">Bulk Sourcing</h3>
                                            <p className="text-indigo-100 text-xs mb-4">Contract directly with farmers for large quantities at wholesale prices.</p>
                                            <button 
                                                onClick={() => navigate('/marketplace?filter=bulk')}
                                                className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-colors flex items-center gap-1"
                                            >
                                                Start Bulk Order <ArrowRight className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <Truck className="absolute -bottom-4 -right-4 w-24 h-24 text-indigo-500 opacity-30" />
                                    </div>

                                    <div className="bg-white border-2 border-indigo-100 p-6 rounded-2xl hover:border-indigo-300 transition-colors">
                                        <h3 className="font-bold text-lg text-gray-900 mb-1">Price Negotiation</h3>
                                        <p className="text-gray-500 text-xs mb-4">Propose your price for available harvests and secure the best deals.</p>
                                        <button 
                                            onClick={() => navigate('/orders?tab=negotiations')}
                                            className="text-indigo-600 text-xs font-bold flex items-center gap-1 hover:gap-2 transition-all"
                                        >
                                            View Active Negotiations <ArrowRight className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="font-bold text-gray-900">Retailer Analytics</h3>
                                        <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-full">LIVE PREVIEW</span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Orders</p>
                                            <p className="text-2xl font-black text-gray-900">{analytics?.totalOrders || 0}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Quantity (kg)</p>
                                            <p className="text-2xl font-black text-gray-900">{analytics?.totalQuantityPurchased || 0}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Spent</p>
                                            <p className="text-2xl font-black text-green-600">₹{analytics?.moneySpent || 0}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Top Crop</p>
                                            <p className="text-2xl font-black text-indigo-600 truncate">{analytics?.mostPurchasedCrop || 'N/A'}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Placeholder Chart */}
                                    <div className="mt-8 h-32 flex items-end justify-between gap-2">
                                        {[40, 70, 45, 90, 65, 80, 50, 85, 60, 95, 75, 100].map((h, i) => (
                                            <div 
                                                key={i} 
                                                style={{ height: `${h}%` }} 
                                                className={`flex-1 rounded-t-sm transition-all duration-1000 ${i === 11 ? 'bg-indigo-600' : 'bg-indigo-100'}`}
                                            ></div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between mt-2 text-[9px] font-bold text-gray-400 px-1 italic">
                                        <span>MONTHLY SPEND TREND (LAST 12 MONTHS)</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Retailer Pending Notice */}
                        {user?.role === 'retailer' && user?.retailerStatus !== 'verified' && (
                            <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-2xl flex gap-4">
                                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-yellow-600 shrink-0">
                                    <AlertCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-yellow-800">Verification Pending</h3>
                                    <p className="text-yellow-700 text-sm mt-1">
                                        Your retailer application is currently being reviewed by our team. 
                                        Once verified, you will unlock bulk pricing, negotiation tools, and priority delivery options.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* How it Works Section */}
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 mb-8 border-b border-gray-100 pb-4">
                                Smart Marketplace: How it Works
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-4">
                                    <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center font-bold">1</div>
                                    <h4 className="font-bold text-gray-900">Preorder Harvest</h4>
                                    <p className="text-xs text-gray-500 leading-relaxed">Book crops while they are still growing. Farmers get guaranteed buyers, and you get fresh produce at lower, fixed prices.</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold">2</div>
                                    <h4 className="font-bold text-gray-900">Community Buying</h4>
                                    <p className="text-xs text-gray-500 leading-relaxed">Join forces with neighbors to reach the farmer's minimum quantity. Split shipping costs and get massive volume discounts.</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center font-bold">3</div>
                                    <h4 className="font-bold text-gray-900">Smart Pricing</h4>
                                    <p className="text-xs text-gray-500 leading-relaxed">Prices are adjusted based on demand and location. We use AI to suggest fair prices for both farmers and buyers based on market trends.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Sidemenu/Small Widgets */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-bold text-gray-900 mb-4 block">Market Insights</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                        <span className="text-sm font-medium">Onion Prices</span>
                                    </div>
                                    <span className="text-sm font-bold text-green-600">↑ 12%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-red-400"></span>
                                        <span className="text-sm font-medium">Tomato Supply</span>
                                    </div>
                                    <span className="text-sm font-bold text-red-500">↓ Low</span>
                                </div>
                                <button 
                                    onClick={() => navigate('/chat/bot?q=market trends')}
                                    className="w-full mt-2 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                                >
                                    Ask AI for Trends
                                </button>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-white shadow-lg">
                            <TrendingUp className="w-8 h-8 mb-4 opacity-50" />
                            <h3 className="font-bold text-lg mb-2 leading-tight">Harvest Season is Here!</h3>
                            <p className="text-green-100 text-xs mb-4">Carrots and Cauliflowers are now open for preorders. Save up to 40% on bulk bookings.</p>
                            <button 
                                onClick={() => navigate('/marketplace')}
                                className="w-full py-2 bg-white text-green-700 rounded-xl text-xs font-bold hover:bg-green-50 transition-colors"
                            >
                                Browse New Harvests
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
