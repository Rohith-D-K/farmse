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
    ArrowUpRight,
    Search,
    Star,
    Calendar,
    ChevronRight,
    DollarSign,
    MessageSquare
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
    const [loading, setLoading] = useState(true);
    const [productSearch, setProductSearch] = useState('');
    const [productCategory, setProductCategory] = useState('All');

    const [reviewsData, setReviewsData] = useState<{ reviews: any[], averageRating: number, totalReviews: number }>({ reviews: [], averageRating: 0, totalReviews: 0 });

    useEffect(() => {
        if (user?.id) {
            fetchData();
        }
    }, [user?.id]);

    const fetchData = async () => {
        if (!user?.id) return;
        try {
            const [productsData, ordersData, harvestsData, reviewsResponse] = await Promise.all([
                api.products.getMy(),
                api.orders.getAll(),
                api.harvests.getAll(),
                api.reviews.getFarmerReviews(user.id)
            ]);
            setProducts(productsData);
            setOrders(ordersData);
            setHarvests(harvestsData.filter((h: any) => h.farmerId === user.id));
            setReviewsData(reviewsResponse);

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

    const handleContactBuyer = async (order: Order) => {
        try {
            const chat = await api.chats.start({
                productId: order.productId,
                farmerId: user?.id || (order as any).farmerId
            });
            navigate(`/chat/${chat.id}`, { state: { from: '/farmer/dashboard' } });
        } catch (error: any) {
            alert('Failed to start chat: ' + (error.message || 'Unknown error'));
        }
    };

    const activeListingsCount = products.filter(p => p.quantity > 0).length;
    const lowStockCount = products.filter(p => p.quantity > 0 && p.quantity < 10).length;
    const CATEGORIES = ['All', 'Vegetables', 'Fruits', 'Grains', 'Dairy', 'Nuts', 'Greens', 'Herbs', 'Seeds', 'Organic Manure', 'Other'];

    const getCategory = (cropName: string) => {
        const name = cropName.toLowerCase();
        if (/(almond|cashew|walnut|peanut|nut)/i.test(name)) return 'Nuts';
        if (/(wheat|rice|corn|maize|barley|oat|grain|millet|dal|pulses)/i.test(name)) return 'Grains';
        if (/(milk|cheese|butter|ghee|paneer|dairy|curd)/i.test(name)) return 'Dairy';
        if (/(apple|banana|mango|grape|orange|strawberry|watermelon|lemon|fruit)/i.test(name)) return 'Fruits';
        if (/(mint|coriander|tulsi|basil|rosemary|thyme|herb|oregano)/i.test(name)) return 'Herbs';
        if (/(spinach|lettuce|kale|greens|leaves|celery)/i.test(name)) return 'Greens';
        if (/(seed|mustard|cumin|fennel|sesame)/i.test(name)) return 'Seeds';
        if (/(manure|compost|fertilizer|organic|soil|coco)/i.test(name)) return 'Organic Manure';
        if (/(tomato|potato|onion|carrot|cabbage|cauliflower|brinjal|cucumber|okra|beans|vegetable|pepper|chilli|garlic|ginger)/i.test(name)) return 'Vegetables';
        return 'Other';
    };

    const incomingOrders = orders.filter(o => o.orderStatus === 'pending');

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.cropName.toLowerCase().includes(productSearch.toLowerCase()) || 
                              t(`crops.${p.cropName}`, {defaultValue: p.cropName}).toLowerCase().includes(productSearch.toLowerCase());
        const matchesCategory = productCategory === 'All' || getCategory(p.cropName) === productCategory;
        return matchesSearch && matchesCategory;
    });

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

            {/* Reputation Section */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-6">
                <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center md:items-start">
                    <div className="flex flex-col items-center justify-center min-w-[200px] p-6 bg-yellow-50 rounded-3xl border border-yellow-100 text-center">
                        <div className="flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-sm mb-3">
                            <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
                        </div>
                        <p className="text-4xl font-black text-gray-900">{reviewsData.averageRating.toFixed(1)}</p>
                        <p className="text-xs font-bold text-yellow-700 uppercase tracking-widest mt-1">Average Rating</p>
                        <p className="text-xs text-yellow-600 mt-2 font-medium">Based on {reviewsData.totalReviews} reviews</p>
                    </div>
                    <div className="flex-1 w-full">
                        <h3 className="text-lg font-black text-gray-900 mb-4 px-2">Recent Buyer Reviews</h3>
                        {reviewsData.reviews.length === 0 ? (
                             <p className="text-sm text-gray-400 italic px-2">No reviews yet. Complete your first successful delivery to start earning ratings!</p>
                        ) : (
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {reviewsData.reviews.slice(0, 4).map((review) => (
                                    <div key={review.id} className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                                        <div className="flex items-center justify-between mb-2">
                                             <div className="flex items-center gap-1">
                                                 {[1, 2, 3, 4, 5].map(star => (
                                                     <Star key={star} className={`w-3.5 h-3.5 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                                                 ))}
                                             </div>
                                             <span className="text-[10px] font-bold text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        {review.comment && <p className="text-sm text-gray-700 italic line-clamp-2">"{review.comment}"</p>}
                                        <div className="mt-3 flex items-center justify-between">
                                            <p className="text-[11px] font-black text-gray-900">{review.buyerName || 'Verified Buyer'}</p>
                                            <p className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">{review.productName}</p>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        )}
                    </div>
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
                            const estQty = harvest.estimatedQuantity || 1;
                            const curQty = harvest.currentPreorderQuantity || 0;
                            const preorderPercent = Math.min(100, Math.max(0, Math.round((curQty / estQty) * 100)));
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
                <div className="flex flex-col gap-4 px-2">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 border-l-4 border-green-600 pl-3">Your Products</h2>
                            <p className="text-gray-500 text-sm mt-1">Manage your active marketplace listings.</p>
                        </div>
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Find product by name..."
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all shadow-sm"
                            />
                        </div>
                    </div>
                    
                    {/* Categories Row */}
                    <div className="flex overflow-x-auto pb-2 -mx-2 px-2 gap-2 hide-scrollbar">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setProductCategory(cat)}
                                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                                    productCategory === cat 
                                        ? 'bg-green-600 text-white shadow-md' 
                                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredProducts.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900">No Products Found</h3>
                        <p className="text-gray-500 text-sm mt-1">{productSearch ? 'Adjust your search filters' : 'Add your first product to start selling'}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredProducts.map((product) => (
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
                )}
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
                                    {orders.map((order) => (
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
                                                    <div className="flex flex-wrap items-center gap-2 justify-end mt-2">
                                                        <button 
                                                            onClick={() => handleContactBuyer(order)}
                                                            className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold hover:bg-blue-100 flex items-center gap-1 transition-colors"
                                                        >
                                                            <MessageSquare className="w-3 h-3" /> Chat
                                                        </button>
                                                        {['delivered', 'completed'].includes(order.orderStatus) && (
                                                            <button onClick={() => navigate(`/orders`)} className="px-3 py-1 bg-gray-50 text-gray-500 rounded-lg text-[10px] font-bold hover:bg-gray-100 hover:text-green-600 flex items-center gap-1 transition-colors">
                                                                Details <ChevronRight className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>
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
