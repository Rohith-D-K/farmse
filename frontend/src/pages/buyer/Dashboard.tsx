import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';
import { useEffect, useState } from 'react';

export const Dashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [analytics, setAnalytics] = useState<any>(null);

    useEffect(() => {
        if (user?.role === 'retailer') {
            api.retailer.getAnalytics().then(setAnalytics).catch(console.error);
        }
    }, [user]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{t('buyer_dashboard.welcome', { name: user?.name })} 🛒</h1>
                        <p className="text-gray-500 mt-1 flex items-center">
                            <span className="mr-1">📍</span> {user?.location}
                        </p>
                        {user?.deliveryLocation && (
                            <p className="text-gray-500 mt-1 flex items-center text-sm">
                                <span className="mr-1">🚚</span> Delivery: {user.deliveryLocation}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                    >
                        {t('common.logout')}
                    </button>
                </div>

                <div className="relative rounded-2xl overflow-hidden border border-gray-100 shadow-sm min-h-[200px]">
                    <img src="/produce/banner.avif" alt="Fresh produce" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-900/75 via-gray-900/55 to-transparent" />
                    <div className="relative z-10 p-6 text-white max-w-md">
                        <h2 className="text-2xl font-bold">{t('buyer_dashboard.fresh_produce')}</h2>
                        <p className="text-sm text-gray-100 mt-2">{t('buyer_dashboard.fresh_produce_desc')}</p>
                        <button
                            onClick={() => navigate('/marketplace')}
                            className="mt-4 px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
                        >
                            {t('buyer_dashboard.shop_now')}
                        </button>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div
                        onClick={() => navigate('/marketplace')}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-md transition-shadow group"
                    >
                        <h2 className="text-xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">🌾 {t('buyer_dashboard.browse_marketplace')}</h2>
                        <p className="mt-2 text-gray-500">{t('buyer_dashboard.browse_desc')}</p>
                        <div className="mt-4">
                            <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                                {t('buyer_dashboard.go_to_marketplace')}
                            </button>
                        </div>
                    </div>

                    <div
                        onClick={() => navigate('/orders')}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-md transition-shadow group"
                    >
                        <h2 className="text-xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">📦 {t('buyer_dashboard.my_orders')}</h2>
                        <p className="mt-2 text-gray-500">{t('buyer_dashboard.my_orders_desc')}</p>
                        <div className="mt-4">
                            <button className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                                {t('buyer_dashboard.view_orders')}
                            </button>
                        </div>
                    </div>
                </div>

                {user?.role === 'retailer' && analytics && (
                    <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6 mt-6">
                        <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4 mb-4">Retailer Analytics Dashboard</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-center">
                                <p className="text-sm text-indigo-600 font-medium">Total Orders</p>
                                <p className="text-2xl font-bold text-indigo-900">{analytics.totalOrders}</p>
                            </div>
                            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-center">
                                <p className="text-sm text-indigo-600 font-medium">Quantity (kg)</p>
                                <p className="text-2xl font-bold text-indigo-900">{analytics.totalQuantityPurchased}</p>
                            </div>
                            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-center">
                                <p className="text-sm text-indigo-600 font-medium">Money Spent</p>
                                <p className="text-2xl font-bold text-indigo-900">₹{analytics.moneySpent}</p>
                            </div>
                            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-center">
                                <p className="text-sm text-indigo-600 font-medium">Top Crop</p>
                                <p className="text-xl font-bold text-indigo-900 mt-1">{analytics.mostPurchasedCrop}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Info Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4 mb-4">{t('buyer_dashboard.how_it_works')}</h2>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <span className="text-2xl bg-green-50 p-2 rounded-lg">1️⃣</span>
                            <div>
                                <h4 className="font-semibold text-gray-900">{t('buyer_dashboard.step1_title')}</h4>
                                <p className="text-sm text-gray-600">{t('buyer_dashboard.step1_desc')}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <span className="text-2xl bg-green-50 p-2 rounded-lg">2️⃣</span>
                            <div>
                                <h4 className="font-semibold text-gray-900">{t('buyer_dashboard.step2_title')}</h4>
                                <p className="text-sm text-gray-600">{t('buyer_dashboard.step2_desc')}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <span className="text-2xl bg-green-50 p-2 rounded-lg">3️⃣</span>
                            <div>
                                <h4 className="font-semibold text-gray-900">{t('buyer_dashboard.step3_title')}</h4>
                                <p className="text-sm text-gray-600">{t('buyer_dashboard.step3_desc')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
