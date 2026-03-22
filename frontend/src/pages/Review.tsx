import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useTranslation } from 'react-i18next';
import { Star, ArrowLeft, CheckCircle, Package, AlertCircle } from 'lucide-react';
import { getImageForCrop } from '../utils/productImages';

export const Review: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { order } = location.state || {};
    const { t } = useTranslation();

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleBack = () => {
        if (window.history.length > 2) {
            navigate(-1);
        } else {
            navigate('/orders');
        }
    };

    if (!order) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10 text-center max-w-md w-full animate-fade-in">
                    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Package className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">{t('review.order_not_found')}</h2>
                    <p className="text-gray-500 mb-8 font-medium">We couldn't find the details for this order. Please try again from your orders list.</p>
                    <button
                        onClick={() => navigate('/orders')}
                        className="w-full px-6 py-4 bg-gray-900 text-white rounded-2xl text-sm font-black hover:bg-black transition-all active:scale-95 shadow-lg shadow-gray-200"
                    >
                        {t('review.go_to_orders')}
                    </button>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (rating === 0) {
            setError('Please select a rating to continue');
            return;
        }

        setLoading(true);

        try {
            await api.reviews.create({
                orderId: order.id,
                productId: order.productId,
                rating,
                comment: comment.trim() || undefined
            });

            navigate('/orders', { state: { message: 'Review submitted successfully!' } });
        } catch (err: any) {
            setError(err.message || 'Failed to submit review. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAF9] pb-24 md:pb-12">
            <div className="max-w-3xl mx-auto px-4 pt-8 md:pt-12 space-y-8 animate-fade-in">
                {/* Header Section */}
                <div className="flex items-center gap-6">
                    <button 
                        onClick={handleBack} 
                        className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 hover:bg-gray-50 hover:shadow-md transition-all active:scale-90"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">{t('review.title')}</h1>
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mt-1">{t('review.subtitle')}</p>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-green-900/5 border border-gray-100 overflow-hidden">
                    <div className="p-8 md:p-10">
                        <form onSubmit={handleSubmit} className="space-y-10">
                            {error && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-2xl text-sm text-red-700 flex items-center gap-3 animate-shake">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <span className="font-bold">{error}</span>
                                </div>
                            )}

                            {/* Order Info Premium Card */}
                            <div className="bg-gray-50/50 rounded-3xl border border-gray-100 p-6 flex items-center gap-6">
                                <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                                    <img 
                                        src={order?.productImage} 
                                        alt="" 
                                        className="w-full h-full object-cover" 
                                        onError={(e) => { (e.target as HTMLImageElement).src = getImageForCrop(order?.cropName); }}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-gray-900 tracking-tight">{t(`crops.${order.cropName}`, {defaultValue: order.cropName})}</h3>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order <span className="text-gray-900">#{order.id.substring(0, 8).toUpperCase()}</span></p>
                                    <div className="flex gap-4 mt-3">
                                        <div className="bg-white px-3 py-1 rounded-lg border border-gray-100 shadow-sm">
                                            <p className="text-xs font-bold text-gray-700">{order.quantity} <span className="text-[9px] text-gray-400 font-black uppercase">kg</span></p>
                                        </div>
                                        <div className="bg-green-50 px-3 py-1 rounded-lg border border-green-100 shadow-sm">
                                            <p className="text-xs font-black text-green-600">₹{order.totalPrice.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Rating Section */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest">{t('review.rating')} *</label>
                                    {rating > 0 && (
                                        <span className="text-[10px] font-black text-green-600 uppercase tracking-widest bg-green-50 px-3 py-1 rounded-full border border-green-100">
                                            {rating === 1 && 'Poor'}
                                            {rating === 2 && 'Fair'}
                                            {rating === 3 && 'Good'}
                                            {rating === 4 && 'Excellent'}
                                            {rating === 5 && 'Outstanding'}
                                        </span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center bg-gray-50/30 p-8 rounded-3xl border border-dashed border-gray-200">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            className="group relative focus:outline-none transition-transform active:scale-90"
                                        >
                                            <Star 
                                                className={`w-12 h-12 md:w-14 md:h-14 transition-all duration-300 ${
                                                    star <= rating 
                                                        ? 'fill-yellow-400 text-yellow-400 scale-110 drop-shadow-xl' 
                                                        : 'text-gray-200 group-hover:text-gray-300'
                                                }`} 
                                            />
                                            {star <= rating && (
                                                <div className="absolute inset-0 animate-ping-slow opacity-20 pointer-events-none">
                                                    <Star className="w-12 h-12 md:w-14 md:h-14 fill-yellow-400 text-yellow-400" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Comment */}
                            <div className="space-y-3">
                                <label htmlFor="comment" className="block text-[11px] font-black text-gray-400 uppercase tracking-widest">
                                    {t('review.comment')}
                                </label>
                                <textarea
                                    id="comment"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder={t('review.comment_placeholder')}
                                    rows={5}
                                    className="block w-full px-6 py-4 bg-gray-50 border-none rounded-3xl shadow-inner focus:ring-2 focus:ring-green-500/20 focus:bg-white transition-all text-gray-900 placeholder-gray-300 transform"
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-3 px-10 py-5 bg-gray-900 hover:bg-black text-white text-sm font-black rounded-3xl shadow-2xl shadow-gray-200 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-5 h-5 text-green-400" />
                                            {t('review.submit').toUpperCase()}
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="flex-1 px-8 py-5 bg-white hover:bg-gray-50 text-gray-400 text-sm font-black rounded-3xl border border-gray-100 transition-all active:scale-95 uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
