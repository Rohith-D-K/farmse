import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { 
    Plus, 
    Package, 
    TrendingUp, 
    AlertCircle, 
    Trash2, 
    Edit2, 
    MapPin, 
    ShieldCheck, 
    ShieldAlert, 
    ShoppingBag,
    Loader2,
    ChevronRight,
    DollarSign,
    Info,
    Calendar,
    ArrowUpRight,
    Search
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getImageForCrop } from '../../utils/productImages';

interface Product {
    id: string;
    cropName: string;
    price: number;
    quantity: number;
    location: string;
    image: string;
}

interface Order {
    id: string;
    productId: string;
    cropName: string;
    productImage: string;
    quantity: number;
    totalPrice: number;
    deliveryMethod: string;
    paymentMethod: string;
    paymentStatus: string;
    orderStatus: string;
    createdAt: string;
}

export const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [harvests, setHarvests] = useState<any[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [trends, setTrends] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [productsData, ordersData, harvestsData, trendsData] = await Promise.all([
                api.products.getMy(),
                api.orders.getAll(),
                api.harvests.getAll(),
                api.price.getTrends()
            ]);
            setProducts(productsData);
            setOrders(ordersData);
            setHarvests(harvestsData.filter((h: any) => h.farmerId === user?.id));
            setTrends(trendsData);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            await api.products.delete(id);
            setProducts(products.filter(p => p.id !== id));
        } catch (error: any) {
            alert(error.message || 'Failed to delete product');
        }
    };

    const handleDeleteHarvest = async (id: string, preorderPercent: number) => {
        if (preorderPercent >= 60) {
            alert('Cannot delete harvest: More than 60% of the harvest has already been preordered. Please consider cancelling if necessary, which will trigger refunds.');
            return;
        }
        if (!confirm('Are you sure you want to delete this harvest Listing? This cannot be undone.')) return;
        try {
            await api.harvests.delete(id);
            setHarvests(harvests.filter(h => h.id !== id));
        } catch (error: any) {
            alert(error.message || 'Failed to delete harvest');
        }
    };

    const handleCancelHarvest = async (id: string) => {
        if (!confirm('Are you sure you want to cancel this harvest? All preorders will be cancelled and buyers notified. This should only be used in case of crop failure.')) return;
        try {
            await api.harvests.cancel(id);
            alert('Harvest cancelled successfully.');
            fetchData();
        } catch (error: any) {
            alert(error.message || 'Failed to cancel harvest');
        }
    };

    const handleAcceptOrder = async (id: string) => {
        try {
            await api.orders.accept(id);
            setOrders(orders.map(o => o.id === id ? { ...o, orderStatus: 'accepted' } : o));
        } catch (error: any) {
            alert(error.message || 'Failed to accept order');
        }
    };

    const [otpInput, setOtpInput] = useState<{ [key: string]: string }>({});
    const [verifyingOrder, setVerifyingOrder] = useState<string | null>(null);

    const handlePackOrder = async (id: string) => {
        try {
            await api.orders.pack(id);
            setOrders(orders.map(o => o.id === id ? { ...o, orderStatus: 'packed' } : o));
        } catch (error: any) {
            alert(error.message || 'Failed to pack order');
        }
    };

    const handleShipOrder = async (id: string) => {
        try {
            await api.orders.ship(id);
            setOrders(orders.map(o => o.id === id ? { ...o, orderStatus: 'out_for_delivery' } : o));
        } catch (error: any) {
            alert(error.message || 'Failed to ship order');
        }
    };

    const handleVerifyOtp = async (id: string) => {
        const otp = otpInput[id];
        if (!otp || otp.length !== 4) {
            alert('Please enter a valid 4-digit OTP');
            return;
        }

        setVerifyingOrder(id);
        try {
            await api.orders.verifyOtp(id, otp);
            setOrders(orders.map(o => o.id === id ? { ...o, orderStatus: 'delivered', paymentStatus: 'completed' } : o));
            setOtpInput({ ...otpInput, [id]: '' });
        } catch (error: any) {
            alert(error.message || 'Invalid OTP');
        } finally {
            setVerifyingOrder(null);
        }
    };

    const handleRejectOrder = async (id: string) => {
        if (!confirm('Are you sure you want to reject this order?')) return;
        try {
            await api.orders.reject(id);
            setOrders(orders.map(o => o.id === id ? { ...o, orderStatus: 'rejected' } : o));
        } catch (error: any) {
            alert(error.message || 'Failed to reject order');
        }
    };

    // Calculations
    const totalEarnings = orders
        .filter(o => ['accepted', 'delivered', 'completed'].includes(o.orderStatus))
        .reduce((sum, o) => sum + o.totalPrice, 0);

    const activeListingsCount = products.filter(p => p.quantity > 0).length;
    const lowStockCount = products.filter(p => p.quantity > 0 && p.quantity < 10).length;
    const incomingOrders = orders.filter(o => o.orderStatus === 'pending');

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-32 max-w-7xl mx-auto p-4 md:p-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-200">
                        <Package className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('farmer.dashboard')}</h1>
                        <p className="text-gray-500 text-sm font-medium flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-green-500" /> {user?.location}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/farmer/add-product')}
                        className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                    >
                        <Plus className="w-5 h-5" /> {t('farmer.add_product')}
                    </button>
                    <button
                        onClick={() => navigate('/farmer/add-harvest')}
                        className="flex-1 md:flex-none border-2 border-green-100 text-green-700 px-6 py-3 rounded-2xl font-bold hover:bg-green-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Calendar className="w-5 h-5" /> List Harvest
                    </button>
                </div>
            </div>

            {/* Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col justify-between h-full">
                        <div className="p-2 bg-green-50 w-fit rounded-xl">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="mt-4">
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Earnings</p>
                            <p className="text-3xl font-black text-gray-900 mt-1">₹{totalEarnings.toLocaleString()}</p>
                        </div>
                    </div>
                    <ArrowUpRight className="absolute top-4 right-4 w-12 h-12 text-green-50 group-hover:text-green-100 transition-colors" />
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="p-2 bg-blue-50 w-fit rounded-xl">
                        <Package className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="mt-4">
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Active Products</p>
                        <p className="text-3xl font-black text-gray-900 mt-1">{activeListingsCount}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="p-2 bg-orange-50 w-fit rounded-xl">
                        <TrendingUp className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="mt-4">
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Pending Orders</p>
                        <p className="text-3xl font-black text-gray-900 mt-1">{incomingOrders.length}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="p-2 bg-red-50 w-fit rounded-xl">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="mt-4">
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Low Stock</p>
                        <p className="text-3xl font-black text-red-600 mt-1">{lowStockCount}</p>
                    </div>
                </div>
            </div>

            {/* Demand Insights & Market Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Demand Insights */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                            Demand Insights
                        </h2>
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">LIVE TRENDS</span>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                        {trends.length > 0 ? trends.slice(0, 4).map((trend: any) => (
                            <div key={trend.cropName} className="space-y-4">
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-500 font-bold uppercase">{t(`crops.${trend.cropName.toLowerCase()}`, {defaultValue: trend.cropName})}</span>
                                    <span className="text-lg font-black text-gray-900">
                                        {trend.level === 'high' ? 'High Demand' : trend.level === 'medium' ? 'Stable' : trend.level === 'low' ? 'Low Demand' : 'Unknown'}
                                    </span>
                                    <span className={`text-[10px] font-bold mt-1 inline-flex items-center gap-1 ${
                                        trend.level === 'high' ? 'text-green-600' : trend.level === 'low' ? 'text-red-500' : 'text-blue-600'
                                    }`}>
                                        {trend.level === 'high' ? <><ArrowUpRight className="w-3 h-3" /> UP</> : trend.level === 'low' ? 'OVER SUPPLY' : 'BALANCED'}
                                    </span>
                                </div>
                                <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div className={`h-full ${
                                        trend.level === 'high' ? 'bg-green-500' : trend.level === 'low' ? 'bg-red-500' : 'bg-blue-500'
                                    }`} style={{ width: trend.level === 'high' ? '90%' : trend.level === 'medium' ? '50%' : '20%' }}></div>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-4 py-8 text-center text-gray-400 text-sm italic">
                                Loading market trends...
                            </div>
                        )}
                    </div>

                    <div className="mt-8 bg-gray-50 p-4 rounded-2xl flex items-center gap-4 border border-gray-100">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                            <Info className="w-5 h-5" />
                        </div>
                        <p className="text-sm text-gray-600 leading-snug">
                            <span className="font-bold text-gray-900">AI Tip:</span> Retailers are searching for <span className="font-bold underline">Wheat</span> in bulk near your area. Consider listing your upcoming harvest early to secure preorders.
                        </p>
                    </div>
                </div>

                {/* Market Search / Quick Links */}
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-3">
                            <Search className="w-6 h-6 opacity-75" />
                            <h3 className="font-bold text-xl">Market Price Check</h3>
                        </div>
                        <p className="text-indigo-100 text-sm">Compare your prices with other farmers in a 50km radius using our AI engine.</p>
                        <button 
                            onClick={() => navigate('/chat/bot?q=what is the market price for onions')}
                            className="w-full py-4 bg-white text-indigo-700 rounded-2xl font-bold text-sm hover:bg-indigo-50 transition-colors shadow-lg"
                        >
                            Compare Prices Now
                        </button>
                    </div>
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white opacity-5 rounded-full blur-3xl"></div>
                </div>
            </div>

            {/* Upcoming Harvests Section */}
            <div className="space-y-6">
                <div className="flex justify-between items-end px-2">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900">Your Harvests</h2>
                        <p className="text-gray-500 text-sm">Manage pre-orders and harvest protection status.</p>
                    </div>
                </div>

                {harvests.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900">No Harvests Listed</h3>
                        <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">Listing a harvest allows buyers to preorder crops before you even pick them!</p>
                        <button onClick={() => navigate('/farmer/add-harvest')} className="mt-4 px-6 py-2 bg-green-600 text-white rounded-xl font-bold text-sm">Create First Harvest</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {harvests.map((harvest) => {
                            const preorderPercent = Math.min(100, Math.round((harvest.currentPreorderQuantity / harvest.estimatedQuantity) * 100));
                            const isProtected = preorderPercent >= 60;

                            return (
                                <div key={harvest.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:border-green-200 transition-all hover:shadow-md group">
                                    <div className="relative h-48">
                                        <img 
                                            src={harvest.image} 
                                            alt={harvest.cropName} 
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            onError={(e) => { (e.target as HTMLImageElement).src = getImageForCrop(harvest.cropName); }}
                                        />
                                        <div className={`absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${
                                            isProtected ? 'bg-indigo-600 text-white' : 'bg-white text-orange-600'
                                        }`}>
                                            {isProtected ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                                            {isProtected ? 'SAFE' : 'LISTING'}
                                        </div>
                                        <div className="absolute bottom-4 left-4 right-4">
                                            <div className="bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/20">
                                                <h3 className="text-white font-bold text-lg leading-tight">{t(`crops.${harvest.cropName}`, {defaultValue: harvest.cropName})}</h3>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-white/80 text-xs font-medium">Exp: {new Date(harvest.expectedHarvestDate).toLocaleDateString()}</span>
                                                    <span className="text-green-400 font-black text-sm">₹{harvest.basePricePerKg}/kg</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 space-y-4">
                                        <div>
                                            <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                                                <span>PREORDER STATUS</span>
                                                <span className={preorderPercent >= 60 ? 'text-indigo-600' : 'text-orange-600'}>{preorderPercent}% BOOKED</span>
                                            </div>
                                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full transition-all duration-1000 ${preorderPercent >= 60 ? 'bg-indigo-600' : 'bg-orange-500'}`} 
                                                    style={{ width: `${preorderPercent}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => navigate(`/harvest/${harvest.id}`)}
                                                className="flex-1 py-2.5 bg-gray-50 text-gray-900 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors"
                                            >
                                                Stats
                                            </button>
                                            <button 
                                                onClick={() => navigate(`/farmer/edit-harvest/${harvest.id}`)}
                                                className="flex-1 py-2.5 bg-gray-50 text-gray-900 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors flex items-center justify-center gap-1.5"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" /> Edit
                                            </button>
                                        </div>

                                        <div className="flex gap-2 pt-2 border-t border-gray-50">
                                            <button 
                                                onClick={() => handleCancelHarvest(harvest.id)}
                                                className="flex-1 py-2 text-red-600 text-[10px] font-bold uppercase tracking-wider hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                Cancel Harvest
                                            </button>
                                            <button 
                                                disabled={isProtected}
                                                onClick={() => handleDeleteHarvest(harvest.id, preorderPercent)}
                                                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors ${
                                                    isProtected ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'
                                                }`}
                                            >
                                                Delete Listing
                                            </button>
                                        </div>
                                        {isProtected && (
                                            <p className="text-[10px] text-gray-400 italic text-center">
                                                * Cannot delete listing above 60% preorder.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Products List Section */}
            <div className="space-y-6">
                <h2 className="text-2xl font-black text-gray-900 px-2">Your Products</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((product) => (
                        <div key={product.id} className="bg-white p-4 rounded-3xl border border-gray-100 flex gap-4 hover:shadow-md transition-shadow">
                            <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
                                <img src={product.image || getImageForCrop(product.cropName)} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 flex flex-col justify-between py-1">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-gray-900">{t(`crops.${product.cropName}`, {defaultValue: product.cropName})}</h3>
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                                            product.quantity < 10 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                                        }`}>
                                            {product.quantity} kg
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold text-gray-500 mt-1">₹{product.price}/kg</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => navigate(`/farmer/edit-product/${product.id}`)} className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1"><Edit2 className="w-3 h-3" /> Edit</button>
                                    <button onClick={() => handleDelete(product.id)} className="text-[10px] font-bold text-red-400 hover:text-red-600 flex items-center gap-1"><Trash2 className="w-3 h-3" /> Delete</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Orders Section */}
            <div className="space-y-6">
                 <h2 className="text-2xl font-black text-gray-900 px-2 flex items-center gap-2">
                    Orders Received
                    {incomingOrders.length > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{incomingOrders.length} NEW</span>}
                </h2>
                
                {orders.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-3xl border border-gray-100">
                        <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-500 font-bold">No orders yet.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                        <th className="px-6 py-4">Product</th>
                                        <th className="px-6 py-4">Qty / Price</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {orders.slice(0, 10).map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                                                        <img src={order.productImage || getImageForCrop(order.cropName)} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 leading-none">{t(`crops.${order.cropName}`, {defaultValue: order.cropName})}</p>
                                                        <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tighter">ID: {order.id.slice(0, 8)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-gray-900">{order.quantity} kg</p>
                                                <p className="text-xs text-green-600 font-bold">₹{order.totalPrice}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-2">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black shadow-sm uppercase w-fit ${
                                                        order.orderStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                        order.orderStatus === 'accepted' ? 'bg-blue-100 text-blue-700' :
                                                        order.orderStatus === 'packed' ? 'bg-orange-100 text-orange-700' :
                                                        order.orderStatus === 'out_for_delivery' ? 'bg-indigo-100 text-indigo-700' :
                                                        order.orderStatus === 'delivered' ? 'bg-green-100 text-green-700' :
                                                        'bg-gray-100 text-gray-400'
                                                    }`}>
                                                        {order.orderStatus.replace(/_/g, ' ')}
                                                    </span>
                                                    <span className={`text-[9px] font-bold uppercase tracking-wider ${order.paymentStatus === 'completed' ? 'text-green-600' : 'text-orange-500'}`}>
                                                        Payment: {order.paymentStatus}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex flex-col gap-2 items-end">
                                                    {order.orderStatus === 'pending' && (
                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleAcceptOrder(order.id)} className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-[10px] font-bold hover:bg-green-600 hover:text-white transition-all">Accept</button>
                                                            <button onClick={() => handleRejectOrder(order.id)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold hover:bg-red-600 hover:text-white transition-all">Reject</button>
                                                        </div>
                                                    )}
                                                    {order.orderStatus === 'accepted' && (
                                                        <button onClick={() => handlePackOrder(order.id)} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold shadow-lg shadow-blue-100 active:scale-95">Mark Packed</button>
                                                    )}
                                                    {order.orderStatus === 'packed' && (
                                                        <button onClick={() => handleShipOrder(order.id)} className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold shadow-lg shadow-indigo-100 active:scale-95">Ship Order</button>
                                                    )}
                                                    {order.orderStatus === 'out_for_delivery' && (
                                                        <div className="flex flex-col gap-2 items-end">
                                                            <input 
                                                                type="text" 
                                                                placeholder="Enter OTP" 
                                                                maxLength={4} 
                                                                value={otpInput[order.id] || ''}
                                                                onChange={(e) => setOtpInput({ ...otpInput, [order.id]: e.target.value })}
                                                                className="w-24 px-2 py-1.5 border border-indigo-200 rounded-lg text-xs font-bold text-center focus:ring-2 focus:ring-indigo-500"
                                                            />
                                                            <button 
                                                                onClick={() => handleVerifyOtp(order.id)}
                                                                disabled={verifyingOrder === order.id}
                                                                className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-[10px] font-bold shadow-lg shadow-green-100 active:scale-95 flex items-center gap-2"
                                                            >
                                                                {verifyingOrder === order.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm Delivery'}
                                                            </button>
                                                        </div>
                                                    )}
                                                    {['delivered', 'completed'].includes(order.orderStatus) && (
                                                        <button onClick={() => navigate(`/orders`)} className="text-xs font-bold text-gray-400 hover:text-green-600 flex items-center gap-1">
                                                            View Details <ChevronRight className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
