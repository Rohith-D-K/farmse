import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { 
    Package,
    Truck,
    CheckCircle,
    Clock,
    XCircle,
    Calendar,
    ShoppingBag,
    ArrowLeft,
    Search,
    MessageSquare,
    User
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../contexts/SocketContext';
import { getImageForCrop } from '../utils/productImages';

interface Order {
    id: string;
    productId: string;
    cropName: string;
    productImage: string;
    productLocation: string;
    quantity: number;
    totalPrice: number;
    deliveryMethod: string;
    paymentMethod: string;
    paymentStatus: string;
    orderStatus: string;
    orderType: string;
    farmerId: string;
    buyerId: string;
    createdAt: string;
}

export const Orders: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { socket } = useSocket();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'active' | 'past' | 'cancelled' | 'preorders'>('active');

    useEffect(() => {
        fetchOrders();

        if (socket) {
            socket.on('order_status_updated', fetchOrders);
            return () => {
                socket.off('order_status_updated', fetchOrders);
            };
        }
    }, [socket]);

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
            case 'pending': return <Clock className="w-4 h-4" />;
            case 'accepted': return <Package className="w-4 h-4" />;
            case 'packed': return <ShoppingBag className="w-4 h-4" />;
            case 'out_for_delivery': return <Truck className="w-4 h-4" />;
            case 'delivered': return <CheckCircle className="w-4 h-4" />;
            case 'cancelled':
            case 'rejected': return <XCircle className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
            case 'accepted': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'packed': return 'bg-orange-50 text-orange-700 border-orange-100';
            case 'out_for_delivery': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
            case 'delivered': return 'bg-green-50 text-green-700 border-green-100';
            case 'cancelled':
            case 'rejected': return 'bg-red-50 text-red-700 border-red-100';
            default: return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    const handleFinalizePayment = async (orderId: string) => {
        try {
            await api.orders.finalizePayment(orderId);
            fetchOrders();
            alert('Payment finalized successfully!');
        } catch (error: any) {
            alert(error.message || 'Failed to finalize payment');
        }
    };

    const handleStartChat = async (order: Order) => {
        try {
            const chat = await api.chats.start({
                productId: order.productId,
                farmerId: (order as any).farmerId || order.id // Fallback to id if needed, though farmerId should be there
            });
            navigate(`/chat/${chat.id}`, { state: { from: '/orders' } });
        } catch (error: any) {
            alert('Failed to start chat: ' + (error.message || 'Unknown error'));
        }
    };

    const filteredOrders = orders.filter(order => {
        const isNotYetPaid = order.paymentStatus !== 'completed';
        const isCancelled = ['cancelled', 'rejected'].includes(order.orderStatus);
        
        if (activeTab === 'active') {
            return order.orderType !== 'preorder' && !isCancelled && isNotYetPaid;
        }
        if (activeTab === 'preorders') {
            return order.orderType === 'preorder' && !isCancelled && isNotYetPaid;
        }
        if (activeTab === 'past') {
            return order.paymentStatus === 'completed';
        }
        if (activeTab === 'cancelled') {
            return isCancelled;
        }
        return true;
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    const tabs = [
        { id: 'active', label: 'Active', icon: Clock },
        { id: 'past', label: 'Past', icon: CheckCircle },
        { id: 'cancelled', label: 'Cancelled', icon: XCircle },
        { id: 'preorders', label: 'Preorders', icon: Calendar }
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-24 md:pb-8 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">{t('orders.your_orders')}</h1>
                        <p className="text-sm text-gray-500 font-medium">Manage and track your farm purchases in real-time</p>
                    </div>
                </div>

                <div className="flex bg-gray-100/80 p-1.5 rounded-2xl backdrop-blur-sm self-start">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
                                activeTab === tab.id 
                                    ? 'bg-white text-green-700 shadow-md ring-1 ring-black/5' 
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <tab.icon className="w-3.5 h-3.5" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Package className="w-10 h-10 text-gray-200" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{t('orders.no_orders')}</h3>
                        <p className="text-gray-500 mb-8 max-w-xs mx-auto">Looks like you haven't placed any {activeTab} orders yet.</p>
                        <button onClick={() => navigate('/marketplace')} className="btn-primary px-8 py-3">
                            {t('orders.start_shopping')}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((order) => (
                            <div key={order.id} className="bg-white rounded-3xl border border-gray-100 p-6 flex flex-col md:flex-row gap-6 hover:shadow-lg hover:shadow-gray-100 transition-all border-l-4" style={{ borderLeftColor: order.orderStatus === 'delivered' ? '#22c55e' : order.orderStatus === 'cancelled' ? '#ef4444' : '#fbbf24' }}>
                                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0 group relative cursor-pointer" onClick={() => navigate(`/order-tracking/${order.id}`)}>
                                    <img 
                                        src={order.productImage} 
                                        alt={order.cropName} 
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                        onError={(e) => { (e.target as HTMLImageElement).src = getImageForCrop(order.cropName); }} 
                                    />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Search className="text-white w-6 h-6" />
                                    </div>
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div className="flex flex-wrap justify-between items-start gap-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-xl font-black text-gray-900 leading-none tracking-tight">{t(`crops.${order.cropName}`, {defaultValue: order.cropName})}</h3>
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${order.orderType === 'preorder' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {order.orderType || 'NORMAL'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                                Order <span className="text-gray-900">#{order.id.split('-')[0].toUpperCase()}</span>
                                            </p>
                                        </div>
                                        <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm flex items-center gap-1.5 ${getStatusColor(order.orderStatus)}`}>
                                            {getStatusIcon(order.orderStatus)}
                                            {order.orderStatus.replace(/_/g, ' ')}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-gray-50 rounded-3xl border border-gray-100">
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Quantity</p>
                                            <p className="text-sm font-black text-gray-900">{order.quantity} <span className="text-xs text-gray-400 font-bold lowercase">kg</span></p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Price</p>
                                            <p className="text-sm font-black text-green-600">₹{order.totalPrice.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Ordered On</p>
                                            <p className="text-sm font-black text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Payment</p>
                                            <div className="flex items-center gap-1">
                                                <div className={`w-1.5 h-1.5 rounded-full ${order.paymentStatus === 'completed' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                                                <p className={`text-[10px] font-black uppercase tracking-wider ${order.paymentStatus === 'completed' ? 'text-green-600' : 'text-orange-500'}`}>{order.paymentStatus}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-700 shadow-sm border border-green-100">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Farmer Verified</p>
                                                <p className="text-xs font-bold text-gray-700">Direct Delivery/Pickup</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                                            {(order.orderStatus === 'delivered' || order.orderStatus === 'completed' || order.paymentStatus === 'completed') && (
                                                <button
                                                    onClick={() => navigate('/review', { state: { order, from: '/orders' } })}
                                                    className="flex-1 sm:flex-none px-5 py-3 bg-green-50 text-green-700 text-[10px] font-black rounded-2xl hover:bg-green-100 transition-all uppercase tracking-widest shadow-sm ring-1 ring-green-100"
                                                >
                                                    Write Review
                                                </button>
                                            )}
                                            
                                            {user?.id !== order.farmerId && (
                                                <button 
                                                    onClick={() => handleStartChat(order)}
                                                    className="flex-1 sm:flex-none px-5 py-3 bg-blue-50 text-blue-700 text-[10px] font-black rounded-2xl hover:bg-blue-100 transition-all uppercase tracking-widest shadow-sm ring-1 ring-blue-100 flex items-center justify-center gap-2"
                                                >
                                                    <MessageSquare className="w-4 h-4" />
                                                    Contact Farmer
                                                </button>
                                            )}

                                            <button 
                                                onClick={() => navigate(`/order-tracking/${order.id}`)}
                                                className="flex-1 sm:flex-none px-6 py-3 bg-gray-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-gray-200 transition-all flex items-center justify-center gap-2 active:scale-95"
                                            >
                                                <Truck className="w-4 h-4" />
                                                Track Order
                                            </button>

                                            {order.orderStatus === 'delivered' && order.paymentStatus === 'pending' && (
                                                <button 
                                                    onClick={() => handleFinalizePayment(order.id)}
                                                    className="flex-1 sm:flex-none px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-2 animate-pulse-subtle"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    Complete Payment
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
