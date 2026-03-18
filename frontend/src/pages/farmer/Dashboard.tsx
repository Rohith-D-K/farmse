import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { Plus, Package, TrendingUp, AlertCircle, Trash2, Edit2, MapPin, CheckCircle, XCircle } from 'lucide-react';
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
    deliveryMethod: string; // buyer_pickup, farmer_delivery, local_transport
    paymentMethod: string;
    orderStatus: string; // pending, accepted, delivered, completed, rejected
    createdAt: string;
}

export const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch products and orders in parallel
            const [productsData, ordersData] = await Promise.all([
                api.products.getMy(),
                api.orders.getAll()
            ]);
            setProducts(productsData);
            setOrders(ordersData);
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

    const handleAcceptOrder = async (id: string) => {
        try {
            await api.orders.accept(id);
            // Update local state
            setOrders(orders.map(o => o.id === id ? { ...o, orderStatus: 'accepted' } : o));
        } catch (error: any) {
            alert(error.message || 'Failed to accept order');
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

    // Helper to find product stats
    const activeListings = products.filter(p => p.quantity > 0).length;
    const lowStock = products.filter(p => p.quantity > 0 && p.quantity < 10).length;

    // Filter orders
    const incomingOrders = orders.filter(o => o.orderStatus === 'pending');

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20 md:pb-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('farmer.dashboard')}</h1>
                    <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {user?.location}
                    </p>
                </div>
                <button
                    id="tour-add-product"
                    onClick={() => navigate('/farmer/add-product')}
                    className="btn-primary px-6 py-3 flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 active:scale-95 transition-transform"
                >
                    <Plus className="w-5 h-5" /> {t('farmer.add_product')}
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="tour-farmer-stats">
                <div className="card-premium p-6 flex flex-col justify-between h-32 bg-gradient-to-br from-white to-gray-50 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Package className="w-6 h-6 text-blue-600" />
                        </div>
                        <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-700 rounded-full">Total</span>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-gray-900">{products.length}</p>
                        <p className="text-xs text-gray-500 font-medium">{t('farmer.total_products')}</p>
                    </div>
                </div>

                <div className="card-premium p-6 flex flex-col justify-between h-32 bg-gradient-to-br from-white to-gray-50 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                        <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 rounded-full">Active</span>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-gray-900">{activeListings}</p>
                        <p className="text-xs text-gray-500 font-medium">Live Variations</p>
                    </div>
                </div>

                <div className="card-premium p-6 flex flex-col justify-between h-32 bg-gradient-to-br from-white to-gray-50 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-orange-50 rounded-lg">
                            <AlertCircle className="w-6 h-6 text-orange-600" />
                        </div>
                        <span className="text-xs font-semibold px-2 py-1 bg-orange-100 text-orange-700 rounded-full">Alert</span>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-gray-900">{lowStock}</p>
                        <p className="text-xs text-gray-500 font-medium">{t('farmer.low_stock')}</p>
                    </div>
                </div>
            </div>

            {/* Incoming Orders Section */}
            {incomingOrders.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-gray-900 px-1 flex items-center gap-2">
                        {t('farmer.incoming_orders')}
                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{incomingOrders.length}</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {incomingOrders.map((order) => (
                            <div key={order.id} className="card-premium p-5 border-l-4 border-l-yellow-500">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-gray-900 truncate">{t(`crops.${order.cropName}`, {defaultValue: order.cropName})}</p>
                                        <p className="font-bold text-gray-900">Order #{order.id.slice(0, 6)}</p>
                                        <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <span className="text-xs font-bold bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full uppercase">
                                        {order.orderStatus}
                                    </span>
                                </div>

                                {order.productImage && (
                                    <div className="mb-3 w-full h-28 rounded-lg overflow-hidden border border-gray-100">
                                        <img src={order.productImage} alt={order.cropName} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = getImageForCrop(order.cropName); }} />
                                    </div>
                                )}

                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Quantity:</span>
                                        <span className="font-medium">{order.quantity} kg</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Total Price:</span>
                                        <span className="font-bold text-green-600">₹{order.totalPrice}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Delivery:</span>
                                        <span className="font-medium capitalize">{order.deliveryMethod.replace('_', ' ')}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-3 border-t border-gray-100">
                                    <button
                                        onClick={() => handleAcceptOrder(order.id)}
                                        className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center gap-1"
                                    >
                                        <CheckCircle className="w-4 h-4" /> {t('farmer.accept')}
                                    </button>
                                    <button
                                        onClick={() => handleRejectOrder(order.id)}
                                        className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg text-sm font-bold hover:bg-red-100 active:scale-95 transition-all flex items-center justify-center gap-1"
                                    >
                                        <XCircle className="w-4 h-4" /> {t('farmer.reject')}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Products List */}
            <div className="space-y-4" id="tour-farmer-products">
                <h2 className="text-lg font-bold text-gray-900 px-1">{t('farmer.your_products')}</h2>

                {products.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                        <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Package className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">{t('farmer.no_products')}</h3>
                        <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">{t('farmer.no_products_desc')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {products.map((product) => (
                            <div key={product.id} className="card-premium p-4 flex gap-4 hover:border-green-100 transition-colors group">
                                <div className="w-24 h-24 flex-shrink-0">
                                    <img
                                        src={product.image}
                                        alt={product.cropName}
                                        className="w-full h-full object-cover rounded-lg shadow-sm"
                                        onError={(e) => { (e.target as HTMLImageElement).src = getImageForCrop(product.cropName); }}
                                    />
                                </div>
                                <div className="flex-1 flex flex-col justify-between py-1">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-gray-900 group-hover:text-green-600 transition-colors">{t(`crops.${product.cropName}`, {defaultValue: product.cropName})}</h3>
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${product.quantity === 0 ? 'bg-gray-100 text-gray-600' :
                                                product.quantity < 10 ? 'bg-red-50 text-red-600' :
                                                    'bg-green-50 text-green-600'
                                                }`}>
                                                {product.quantity} {t('product.kg_left')}
                                            </span>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-700 mt-1">₹{product.price}<span className="text-xs font-normal text-gray-500">{t('product.per_kg')}</span></p>
                                    </div>

                                    <div className="flex gap-3 mt-3">
                                        <button
                                            onClick={() => navigate(`/farmer/edit-product/${product.id}`)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product.id)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" /> Delete
                                        </button>
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
