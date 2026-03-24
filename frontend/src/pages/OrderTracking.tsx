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
    ArrowLeft,
    Check
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
            navigate(`/chat/${chat.id}`, { state: { from: `/order-tracking/${id}` } });
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
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-surface)' }}>
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-green)' }} strokeWidth={1.5} />
        </div>
    );

    if (error || !order) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center" style={{ background: 'var(--color-surface)' }}>
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" strokeWidth={1.5} />
            <h2 className="text-xl font-bold text-farmse-dark mb-2" style={{ fontFamily: 'var(--font-display)' }}>Error</h2>
            <p className="text-farmse-muted mb-6">{error}</p>
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
        <div className="max-w-2xl mx-auto pb-20 md:pb-8" style={{ background: 'var(--color-surface)', minHeight: '100vh' }}>

            {/* Back + Title */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/orders')}
                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-card border border-farmse-green/10 hover:bg-farmse-green-light transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" style={{ color: 'var(--color-green)' }} strokeWidth={1.5} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-farmse-dark" style={{ fontFamily: 'var(--font-display)' }}>Order Tracking</h1>
                    <p className="text-[10px] font-bold text-farmse-muted uppercase tracking-widest">Order #{id?.split('-')[0].toUpperCase()}</p>
                </div>
            </div>
            {/* Vertical Timeline Stepper */}
            <div className="card-premium p-6 mb-5">
                <h3 className="text-sm font-bold text-farmse-dark mb-5 uppercase tracking-widest" style={{ fontFamily: 'var(--font-body)' }}>
                    Order Progress
                </h3>

                {isCancelled ? (
                    <div className="p-5 rounded-card flex items-center gap-4" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#FEE2E2' }}>
                            <AlertCircle className="w-5 h-5 text-red-600" strokeWidth={1.5} />
                        </div>
                        <div>
                            <p className="font-bold text-red-700 text-sm">
                                Order {order.orderStatus === 'rejected' ? 'Rejected' : 'Cancelled'}
                            </p>
                            <p className="text-xs text-red-600/70 mt-0.5">This transaction has been terminated.</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {stages.map((stage, index) => {
                            const Icon = stage.icon;
                            const isDone    = index < currentStageIndex;
                            const isActive  = index === currentStageIndex;
                            const isPending = index > currentStageIndex;
                            const isLast    = index === stages.length - 1;

                            return (
                                <div key={stage.key} className="flex gap-4">
                                    {/* Circle + connector */}
                                    <div className="flex flex-col items-center">
                                        {isDone && (
                                            <div className="timeline-dot-done">
                                                <Check className="w-4 h-4" strokeWidth={2.5} />
                                            </div>
                                        )}
                                        {isActive && (
                                            <div className="timeline-dot-active">
                                                <Icon className="w-4 h-4" strokeWidth={1.5} />
                                            </div>
                                        )}
                                        {isPending && (
                                            <div className="timeline-dot-pending">
                                                <Icon className="w-4 h-4" strokeWidth={1.5} />
                                            </div>
                                        )}
                                        {!isLast && (
                                            <div className={isDone ? 'timeline-line-done' : 'timeline-line-pending'} />
                                        )}
                                    </div>

                                    {/* Label + timestamp */}
                                    <div className={`pb-6 flex-1 ${isLast ? 'pb-0' : ''}`}>
                                        <p className={`text-sm font-bold leading-tight mt-1.5 ${
                                            isDone || isActive ? 'text-farmse-dark' : 'text-gray-400'
                                        }`} style={{ fontFamily: 'var(--font-body)' }}>
                                            {stage.label}
                                        </p>
                                        {(isDone || isActive) && (
                                            <p className="text-[10px] text-farmse-muted mt-0.5">
                                                {isActive ? 'In progress' : 'Completed'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Payment Section (Visible to Buyer when delivered but payment pending) */}
            {order.orderStatus === 'delivered' && order.paymentStatus === 'pending' && (
                <div className="rounded-card p-6 text-white mb-5 relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #2D7A4F 0%, #1A5C3A 100%)', boxShadow: 'var(--shadow-card)' }}>
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4" style={{ backdropFilter: 'blur(8px)' }}>
                            <CheckCircle2 className="w-8 h-8 text-white" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-lg font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>Order Delivered!</h3>
                        <p className="text-white/80 text-sm mb-5">Your order has been verified. Please finalize your payment.</p>
                        <button
                            onClick={handleFinalizePayment}
                            className="w-full max-w-xs bg-white py-3.5 rounded-card font-bold hover:bg-farmse-surface transition-colors active:scale-[0.97]"
                            style={{ color: 'var(--color-green)', fontFamily: 'var(--font-body)' }}
                        >
                            Complete Payment Now
                        </button>
                    </div>
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                </div>
            )}

            {/* OTP Section (Visible only to Buyer when out_for_delivery) */}
            {order.orderStatus === 'out_for_delivery' && order.otp && (
                <div className="rounded-card p-6 text-white mb-5 relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)', boxShadow: 'var(--shadow-card)' }}>
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4" style={{ backdropFilter: 'blur(8px)' }}>
                            <ShieldCheck className="w-8 h-8 text-white" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-lg font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>Delivery OTP</h3>
                        <p className="text-white/80 text-sm mb-5">Share this code with the farmer only when you receive your items.</p>
                        <div className="flex gap-3">
                            {order.otp.split('').map((digit: string, i: number) => (
                                <div key={i} className="w-12 h-14 bg-white rounded-xl flex items-center justify-center text-2xl font-bold shadow-lg"
                                    style={{ color: '#4338ca' }}>
                                    {digit}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                </div>
            )}

            {/* Order Info Cards */}
            <div className="space-y-3">
                {/* Product card */}
                <div className="card-premium p-5">
                    <div className="flex gap-4">
                        <div className="w-20 h-20 rounded-card overflow-hidden flex-shrink-0" style={{ border: '1px solid rgba(45,122,79,0.12)' }}>
                            <img src={order.productImage} alt={order.cropName} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <h3 className="text-base font-bold text-farmse-dark" style={{ fontFamily: 'var(--font-body)' }}>{order.cropName}</h3>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                    style={{ background: 'var(--color-green-light)', color: 'var(--color-green)' }}>
                                    {order.orderType?.toUpperCase() || 'NORMAL'}
                                </span>
                            </div>
                            <p className="text-sm text-farmse-muted mt-1">{order.quantity} kg • ₹{order.totalPrice}</p>
                            <div className="flex items-center gap-1.5 mt-2 text-xs text-farmse-muted">
                                <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                                Ordered on {new Date(order.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Delivery location */}
                    <div className="card-premium p-4 flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-amber-light)' }}>
                            <MapPin className="w-5 h-5" style={{ color: 'var(--color-amber)' }} strokeWidth={1.5} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-farmse-muted uppercase tracking-widest">Delivery To</p>
                            <p className="text-sm font-semibold text-farmse-dark mt-1 leading-snug">{order.productLocation || 'Farmer Location'}</p>
                        </div>
                    </div>

                    {/* Chat with farmer */}
                    {user?.id !== order.farmerId && (
                        <button
                            onClick={handleStartChat}
                            className="card-premium p-4 flex items-start gap-3 hover:shadow-card-hover transition-all group w-full text-left"
                        >
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                                style={{ background: 'var(--color-green-light)' }}>
                                <MessageSquare className="w-5 h-5" style={{ color: 'var(--color-green)' }} strokeWidth={1.5} />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-bold text-farmse-muted uppercase tracking-widest">Support</p>
                                <p className="text-sm font-semibold text-farmse-dark mt-1">Chat with Farmer</p>
                                <p className="text-[10px] font-bold uppercase mt-1" style={{ color: 'var(--color-green)' }}>Start Conversation</p>
                            </div>
                            <div className="self-center">
                                <ChevronRight className="w-4 h-4 text-gray-300" strokeWidth={1.5} />
                            </div>
                        </button>
                    )}
                </div>

                {/* Payment details */}
                <div className="card-premium p-5">
                    <h4 className="text-sm font-bold text-farmse-dark mb-4 uppercase tracking-widest" style={{ fontFamily: 'var(--font-body)' }}>Payment Details</h4>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-farmse-muted">Subtotal</span>
                            <span className="font-bold text-farmse-dark">₹{order.totalPrice}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-farmse-muted">Method</span>
                            <span className="font-bold text-farmse-dark uppercase">{order.paymentMethod.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="pt-3 border-t border-farmse-green/10 flex justify-between items-center">
                            <span className="text-xs font-bold text-farmse-muted uppercase tracking-widest">Status</span>
                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                                order.paymentStatus === 'completed'
                                    ? 'bg-farmse-green-light text-farmse-green'
                                    : 'bg-farmse-amber-light text-amber-700'
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
