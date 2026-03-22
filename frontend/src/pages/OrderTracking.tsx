import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { 
    Package, 
    Truck, 
    CheckCircle2, 
    Clock, 
    ShieldCheck, 
    MapPin, 
    Loader2,
    AlertCircle,
    MessageSquare,
    ChevronRight,
    ArrowLeft
} from 'lucide-react';

import { useSocket } from '../contexts/SocketContext';

export const OrderTracking: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { socket } = useSocket();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchOrder = async () => {
        try {
            const orders = await api.orders.getAll();
            const foundOrder = orders.find(o => o.id === id);
            if (!foundOrder) throw new Error('Order not found');
            setOrder(foundOrder);
        } catch (err: any) {
            setError(err.message || 'Failed to load order tracking');
        } finally {
            setLoading(false);
        }
    };

    const handleFinalizePayment = async () => {
        try {
            await api.orders.finalizePayment(id!);
            fetchOrder();
            alert('Payment finalized successfully!');
        } catch (error: any) {
            alert(error.message || 'Failed to finalize payment');
        }
    };

    const handleStartChat = async () => {
        if (!order) return;
        try {
            const chat = await api.chats.start({
                productId: order.productId,
                farmerId: order.farmerId || order.id
            });
            navigate(`/chat/${chat.id}`);
        } catch (error: any) {
            alert('Failed to start chat: ' + (error.message || 'Unknown error'));
        }
    };

    useEffect(() => {
        fetchOrder();

        if (socket) {
            const handleUpdate = (data: any) => {
                if (data.orderId === id) {
                    fetchOrder();
                }
            };

            socket.on('order_status_updated', handleUpdate);
            return () => {
                socket.off('order_status_updated', handleUpdate);
            };
        }
    }, [id, socket]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
        </div>
    );

    if (error || !order) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button onClick={() => navigate('/orders')} className="btn-primary px-8">Back to Orders</button>
        </div>
    );

    const stages = [
        { key: 'pending', label: 'Order Placed', icon: Clock },
        { key: 'accepted', label: 'Accepted', icon: Package },
        { key: 'packed', label: 'Packed', icon: ShieldCheck },
        { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
        { key: 'delivered', label: 'Delivered', icon: CheckCircle2 }
    ];

    const currentStageIndex = stages.findIndex(s => s.key === order.orderStatus);
    const isCancelled = order.orderStatus === 'cancelled' || order.orderStatus === 'rejected';

    return (
        <div className="max-w-2xl mx-auto pb-20 md:pb-8">
            <div className="flex items-center gap-4 mb-8">
                <button 
                    onClick={() => navigate('/orders')} 
                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Order Tracking</h1>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order #{id?.split('-')[0].toUpperCase()}</p>
                </div>
            </div>

            {/* Status Progress Bar */}
            <div className="card-premium p-8 mb-6">
                <div className="relative">
                    {/* Background Line */}
                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-100 -z-10"></div>
                    {/* Progress Line */}
                    {!isCancelled && currentStageIndex >= 0 && (
                        <div 
                            className="absolute top-5 left-0 h-0.5 bg-green-500 transition-all duration-1000 -z-10"
                            style={{ width: `${(currentStageIndex / (stages.length - 1)) * 100}%` }}
                        ></div>
                    )}

                    <div className="flex justify-between items-start">
                        {stages.map((stage, index) => {
                            const Icon = stage.icon;
                            const isActive = index <= currentStageIndex;
                            const isCurrent = index === currentStageIndex;
                            
                            return (
                                <div key={stage.key} className="flex flex-col items-center text-center w-20">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${
                                        isActive ? 'bg-green-600 border-green-50 text-white shadow-lg shadow-green-100' : 'bg-white border-gray-50 text-gray-300'
                                    } ${isCurrent && !isCancelled ? 'animate-pulse' : ''}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <p className={`mt-3 text-[10px] font-bold uppercase tracking-wider ${
                                        isActive ? 'text-green-700' : 'text-gray-400'
                                    }`}>{stage.label}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {isCancelled && (
                    <div className="mt-8 p-6 bg-red-50 rounded-3xl border border-red-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-red-700 uppercase tracking-widest">
                                Order {order.orderStatus === 'rejected' ? 'Rejected' : 'Cancelled'}
                            </p>
                            <p className="text-xs text-red-600/70 font-medium">This transaction has been terminated.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Payment Section (Visible to Buyer when delivered but payment pending) */}
            {order.orderStatus === 'delivered' && order.paymentStatus === 'pending' && (
                <div className="bg-green-600 rounded-3xl p-8 text-white shadow-xl shadow-green-100 mb-6 relative overflow-hidden">
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
                            <CheckCircle2 className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-xl font-black mb-2">Order Delivered!</h3>
                        <p className="text-green-100 text-sm mb-6">Your order has been verified. Please finalize your payment to complete the order.</p>
                        
                        <button 
                            onClick={handleFinalizePayment}
                            className="w-full max-w-xs bg-white text-green-700 py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-green-50 transition-colors"
                        >
                            Complete Payment Now
                        </button>
                    </div>
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                </div>
            )}

            {/* OTP Section (Visible only to Buyer when out_for_delivery) */}
            {order.orderStatus === 'out_for_delivery' && order.otp && (
                <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-100 mb-6 relative overflow-hidden">
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
                            <ShieldCheck className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-xl font-black mb-2">Delivery OTP</h3>
                        <p className="text-indigo-100 text-sm mb-6">Share this code with the farmer only when you receive your items.</p>
                        
                        <div className="flex gap-4">
                            {order.otp.split('').map((digit: string, i: number) => (
                                <div key={i} className="w-14 h-16 bg-white text-indigo-700 rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg">
                                    {digit}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                </div>
            )}

            {/* Order Info */}
            <div className="space-y-4">
                <div className="card-premium p-6">
                    <div className="flex gap-4">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden border border-gray-100 flex-shrink-0">
                            <img 
                                src={order.productImage} 
                                alt={order.cropName} 
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <h3 className="text-lg font-bold text-gray-900">{order.cropName}</h3>
                                <span className="text-xs font-black text-green-600 bg-green-50 px-2 py-1 rounded-full">{order.orderType?.toUpperCase() || 'NORMAL'}</span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{order.quantity} kg • ₹{order.totalPrice}</p>
                            <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
                                <Clock className="w-3.5 h-3.5" />
                                Ordered on {new Date(order.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="card-premium p-5 flex items-start gap-4">
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Delivery To</p>
                            <p className="text-sm font-bold text-gray-900 mt-1 leading-snug">{order.productLocation || 'Farmer Location'}</p>
                        </div>
                    </div>
                    {user?.id !== order.farmerId && (
                        <button 
                            onClick={handleStartChat}
                            className="card-premium p-5 flex items-start gap-4 hover:shadow-md transition-all group w-full text-left"
                        >
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                <MessageSquare className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Support</p>
                                <p className="text-sm font-bold text-gray-900 mt-1">Chat with Farmer</p>
                                <p className="text-[10px] text-blue-600 font-bold uppercase mt-1">Start Conversation</p>
                            </div>
                            <div className="self-center">
                                <ChevronRight className="w-4 h-4 text-gray-300" />
                            </div>
                        </button>
                    )}
                </div>

                <div className="card-premium p-6">
                    <h4 className="text-sm font-black text-gray-900 mb-4 uppercase tracking-widest">Payment Details</h4>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="font-bold text-gray-900">₹{order.totalPrice}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Method</span>
                            <span className="font-bold text-gray-900 uppercase">{order.paymentMethod.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="pt-3 border-t border-gray-50 flex justify-between items-center">
                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Status</span>
                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                                order.paymentStatus === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                                {order.paymentStatus?.toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
