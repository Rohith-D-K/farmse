import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Home, ShoppingBag } from 'lucide-react';

export const OrderConfirmation: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { order, orders } = location.state || {}; // Support both single and multi-order

    // Normalize to array
    const confirmedOrders = orders || (order ? [order] : []);

    if (confirmedOrders.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <p className="text-xl font-semibold text-gray-900 mb-4">No order details found</p>
                    <button
                        onClick={() => navigate('/marketplace')}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        Go to Marketplace
                    </button>
                </div>
            </div>
        );
    }

    // Calculate total if multiple
    const totalAmount = confirmedOrders.reduce((sum: number, o: any) => sum + o.totalPrice, 0);

    return (
        <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-500">
                <div className="bg-green-600 p-8 text-center">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Order Confirmed!</h1>
                    <p className="text-green-100">Thank you for your purchase.</p>
                </div>

                <div className="p-8 space-y-6">
                    <div className="text-center space-y-2">
                        <p className="text-gray-500">Total Amount Paid</p>
                        <p className="text-4xl font-bold text-gray-900">₹{totalAmount.toFixed(2)}</p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 max-h-60 overflow-y-auto">
                        <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Order Details</h3>

                        {confirmedOrders.map((ord: any, index: number) => (
                            <div key={ord.id || index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                                <div className="text-left">
                                    <p className="font-medium text-gray-900">Order #{ord.id?.slice(0, 8) || '...'}</p>
                                    <p className="text-sm text-gray-500">{ord.quantity} kg</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-900">₹{ord.totalPrice}</p>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 capitalize">
                                        {ord.orderStatus || 'pending'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={() => navigate('/orders')}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
                        >
                            <ShoppingBag className="w-5 h-5" />
                            Track Orders
                        </button>

                        <button
                            onClick={() => navigate('/marketplace')}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                        >
                            <Home className="w-5 h-5" />
                            Continue Shopping
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
