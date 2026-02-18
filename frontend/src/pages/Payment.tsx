import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useCart } from '../contexts/CartContext';

export const Payment: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { clearCart } = useCart();

    // Support both single product (legacy) and multi-item (cart) flows
    const state = location.state || {};
    const { deliveryMethod, totalPrice, isDirectBuy } = state;

    // Normalize to array of items
    const items = state.items || (state.product ? [{
        productId: state.product.id,
        cropName: state.product.cropName,
        price: state.product.price,
        quantity: state.quantity,
        location: state.product.location
    }] : []);

    const [paymentMethod, setPaymentMethod] = useState<'upi' | 'bank_transfer'>('upi');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (items.length === 0 || !deliveryMethod) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 text-center max-w-md w-full">
                    <p className="text-xl text-gray-900 font-semibold mb-4">Invalid checkout session</p>
                    <button
                        onClick={() => navigate('/marketplace')}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                        Go to Marketplace
                    </button>
                </div>
            </div>
        );
    }

    const handlePlaceOrder = async () => {
        setError('');
        setLoading(true);

        try {
            const placedOrders = [];

            // Create an order for each item
            for (const item of items) {
                const order = await api.orders.create({
                    productId: item.productId,
                    quantity: item.quantity,
                    deliveryMethod,
                    paymentMethod
                });
                placedOrders.push(order);
            }

            // Clear cart if not a direct buy
            if (!isDirectBuy) {
                clearCart();
            }

            navigate('/order-confirmation', {
                state: {
                    orders: placedOrders,
                    isMultiOrder: placedOrders.length > 1
                }
            });
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to place order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-green-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-3xl mx-auto space-y-6">
                <button
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
                >
                    ← Back
                </button>

                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-xl font-bold text-gray-900">Payment</h2>
                        <p className="mt-1 text-sm text-gray-500">Complete your order</p>
                    </div>

                    <div className="p-6 space-y-8">
                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        {/* Order Summary */}
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                            <h3 className="font-semibold text-gray-900 mb-4">Order Summary ({items.length} items)</h3>
                            <div className="space-y-3 text-sm">
                                {items.map((item: any, index: number) => (
                                    <div key={index} className="flex justify-between pb-2 border-b border-gray-100 last:border-0">
                                        <div>
                                            <span className="font-medium text-gray-900 block">{item.cropName}</span>
                                            <span className="text-xs text-gray-500">{item.quantity} kg x ₹{item.price}</span>
                                        </div>
                                        <span className="font-medium text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}

                                <div className="flex justify-between pt-2">
                                    <span className="text-gray-600">Delivery Method</span>
                                    <span className="font-medium text-gray-900 capitalize">{deliveryMethod.replace('_', ' ')}</span>
                                </div>
                                <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-lg">
                                    <span className="text-gray-900">Total Amount</span>
                                    <span className="text-green-600">₹{totalPrice.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-4">Select Payment Method</h3>
                            <div className="space-y-3">
                                <label
                                    className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'upi'
                                        ? 'border-green-500 bg-green-50'
                                        : 'border-gray-200 hover:border-green-200'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="upi"
                                        checked={paymentMethod === 'upi'}
                                        onChange={() => setPaymentMethod('upi')}
                                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                                    />
                                    <div className="ml-4">
                                        <span className="block text-sm font-bold text-gray-900">💳 UPI Payment</span>
                                        <span className="block text-sm text-gray-500">Pay using GPay, PhonePe, Paytm, etc.</span>
                                    </div>
                                </label>

                                <label
                                    className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'bank_transfer'
                                        ? 'border-green-500 bg-green-50'
                                        : 'border-gray-200 hover:border-green-200'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="bank_transfer"
                                        checked={paymentMethod === 'bank_transfer'}
                                        onChange={() => setPaymentMethod('bank_transfer')}
                                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                                    />
                                    <div className="ml-4">
                                        <span className="block text-sm font-bold text-gray-900">🏦 Bank Transfer</span>
                                        <span className="block text-sm text-gray-500">Direct transfer to farmer's account</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm flex items-start">
                            <span className="text-xl mr-2">💡</span>
                            <p className="mt-0.5">This is a demo application. No actual payment will be processed, but the order will be recorded in the system.</p>
                        </div>

                        <button
                            onClick={handlePlaceOrder}
                            disabled={loading}
                            className="w-full py-4 px-6 bg-green-600 text-white rounded-xl text-lg font-bold hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-200 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Processing Order...' : `Pay ₹${totalPrice.toFixed(2)}`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
