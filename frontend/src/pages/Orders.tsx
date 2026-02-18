import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Package, Truck, CheckCircle, Clock } from 'lucide-react';

interface Order {
    id: string;
    productId: string;
    quantity: number;
    totalPrice: number;
    deliveryMethod: string;
    paymentMethod: string;
    paymentStatus: string;
    orderStatus: string;
    createdAt: string;
}

export const Orders: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const data = await api.orders.getAll();
            setOrders(data);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock className="w-5 h-5 text-yellow-600" />;
            case 'accepted': return <Package className="w-5 h-5 text-blue-600" />;
            case 'delivered': return <Truck className="w-5 h-5 text-purple-600" />;
            case 'completed': return <CheckCircle className="w-5 h-5 text-green-600" />;
            default: return <Clock className="w-5 h-5 text-gray-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
            case 'accepted': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'delivered': return 'bg-purple-50 text-purple-700 border-purple-100';
            case 'completed': return 'bg-green-50 text-green-700 border-green-100';
            default: return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20 md:pb-0">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Your Orders</h1>
            </div>

            <div className="space-y-4">
                {orders.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900">No orders yet</h3>
                        <p className="text-gray-500 mb-6">Looks like you haven't placed any orders yet.</p>
                        <button onClick={() => navigate('/marketplace')} className="btn-primary px-6 py-2">
                            Start Shopping
                        </button>
                    </div>
                ) : (
                    orders.map((order) => (
                        <div key={order.id} className="card-premium p-5 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
                                        <Package className="w-5 h-5 text-gray-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">Order #{order.id.substring(0, 8)}</h3>
                                        <p className="text-xs text-gray-500">
                                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${getStatusColor(order.orderStatus)}`}>
                                    {getStatusIcon(order.orderStatus)}
                                    <span className="capitalize">{order.orderStatus}</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center py-3 border-t border-dashed border-gray-200">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{order.quantity} kg Crop</p>
                                    <p className="text-xs text-gray-500 capitalize">{order.deliveryMethod.replace('_', ' ')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-gray-900">₹{order.totalPrice.toFixed(2)}</p>
                                    <p className="text-xs text-gray-500 uppercase">{order.paymentMethod}</p>
                                </div>
                            </div>

                            {/* Actions (if any specific to orders list) */}
                            {user?.role === 'buyer' && order.orderStatus === 'delivered' && (
                                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                                    <button
                                        onClick={() => navigate('/review', { state: { order } })}
                                        className="text-sm font-bold text-green-600 hover:text-green-700 hover:underline"
                                    >
                                        Write a Review
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
