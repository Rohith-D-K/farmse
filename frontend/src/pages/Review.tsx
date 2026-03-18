import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useTranslation } from 'react-i18next';

export const Review: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { order } = location.state || {};
    const { t } = useTranslation();

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!order) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 text-center max-w-md w-full">
                    <p className="text-xl text-gray-900 font-semibold mb-4">{t('review.order_not_found')}</p>
                    <button
                        onClick={() => navigate('/orders')}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
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
            setError('Please select a rating');
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
            setError(err.message || 'Failed to submit review');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-green-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-2xl mx-auto space-y-6">
                <button
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
                >
                    ← Back
                </button>

                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-xl font-bold text-gray-900">{t('review.title')}</h2>
                        <p className="mt-1 text-sm text-gray-500">{t('review.subtitle')}</p>
                    </div>

                    <div className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded text-sm text-red-700">
                                    {error}
                                </div>
                            )}

                            {/* Order Info */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <p className="text-sm text-gray-600">Order <span className="font-mono text-gray-900">#{order.id.substring(0, 8)}</span></p>
                                <p className="text-sm text-gray-600 mt-1">Quantity: <span className="font-medium text-gray-900">{order.quantity} kg</span></p>
                                <p className="text-sm font-bold text-green-600 mt-2">Total: ₹{order.totalPrice.toFixed(2)}</p>
                            </div>

                            {/* Rating */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('review.rating')} *</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            className={`text-4xl transition-all focus:outline-none ${star <= rating ? 'text-yellow-400 transform scale-110' : 'text-gray-300 hover:text-gray-400'
                                                }`}
                                        >
                                            ⭐
                                        </button>
                                    ))}
                                </div>
                                {rating > 0 && (
                                    <p className="text-sm font-medium text-green-600 mt-2">
                                        {rating === 1 && 'Poor'}
                                        {rating === 2 && 'Fair'}
                                        {rating === 3 && 'Good'}
                                        {rating === 4 && 'Very Good'}
                                        {rating === 5 && 'Excellent'}
                                    </p>
                                )}
                            </div>

                            {/* Comment */}
                            <div>
                                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('review.comment')}
                                </label>
                                <textarea
                                    id="comment"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder={t('review.comment_placeholder')}
                                    rows={5}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                />
                            </div>

                            <div className="flex gap-4 pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                                >
                                    {loading ? t('review.submitting') : t('review.submit')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/orders')}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
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
