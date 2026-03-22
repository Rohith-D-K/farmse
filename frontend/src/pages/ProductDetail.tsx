import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { api } from '../lib/api';
import { QuantitySelector } from '../components/ui/QuantitySelector';
import { ArrowLeft, Share2, Star, MapPin, Clock, ShoppingCart, Check, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getImageForCrop } from '../utils/productImages';

interface Product {
    id: string;
    farmerId: string;
    cropName: string;
    price: number;
    quantity: number;
    location: string;
    image: string;
}

export const ProductDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToCart } = useCart();
    const { t } = useTranslation();
    const [product, setProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [showMessage, setShowMessage] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const data = await api.products.getById(id!);
                setProduct(data);
            } catch (error) {
                console.error('Error fetching product:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    const handleBuyNow = () => {
        if (user?.role !== 'buyer') {
            alert('Only buyers can purchase products');
            return;
        }
        navigate('/checkout', { state: { product, quantity } });
    };

    const handleStartChat = async () => {
        if (!product || !user) return;
        try {
            const chat = await api.chats.start({
                productId: product.id,
                farmerId: product.farmerId,
            });
            navigate(`/chat/${chat.id}`, { state: { from: `/product/${product.id}` } });
        } catch (error) {
            console.error('Failed to start chat:', error);
        }
    };

    const handleAddToCart = () => {
        if (user?.role !== 'buyer') {
            alert('Only buyers can add products to cart');
            return;
        }
        if (!product) return;

        addToCart(product, quantity);
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 2000);
    };

    const handleBack = () => {
        if (user?.role === 'farmer' && String(product?.farmerId) === String(user?.id)) {
            navigate('/farmer/dashboard');
        } else if (window.history?.length > 2) {
            navigate(-1);
        } else {
            navigate('/marketplace');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <p className="text-xl font-bold text-gray-900 mb-4">{t('product.not_found')}</p>
                    <button onClick={() => navigate('/marketplace')} className="btn-primary px-6 py-2">
                        {t('product.back_to_home')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white md:bg-gray-50 pb-24 md:pb-0 relative">
            {/* Header Actions (Floating on mobile) */}
            <div className="fixed top-0 left-0 right-0 z-20 p-4 flex justify-between items-start md:hidden pointer-events-none">
                <button
                    onClick={handleBack}
                    className="w-10 h-10 bg-white/80 backdrop-blur pointer-events-auto rounded-full flex items-center justify-center shadow-lg text-gray-700 active:scale-95 transition-transform"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <button
                    className="w-10 h-10 bg-white/80 backdrop-blur pointer-events-auto rounded-full flex items-center justify-center shadow-lg text-gray-700 active:scale-95 transition-transform"
                >
                    <Share2 className="w-5 h-5" />
                </button>
            </div>

            <div className="max-w-4xl mx-auto md:py-8">
                <div className="md:grid md:grid-cols-2 md:gap-8 md:bg-white md:rounded-3xl md:shadow-sm md:overflow-hidden">
                    {/* Image Section */}
                    <div className="relative h-[40vh] md:h-full w-full bg-gray-200">
                        <img
                            src={product.image}
                            alt={product.cropName}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = getImageForCrop(product.cropName); }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden" />

                        <div className="absolute bottom-4 left-4 text-white md:hidden">
                            <h1 className="text-3xl font-bold">{t(`crops.${product.cropName}`, {defaultValue: product.cropName})}</h1>
                            <p className="text-gray-200 flex items-center mt-1 text-sm bg-black/20 backdrop-blur-sm px-2 py-1 rounded-lg w-fit">
                                <MapPin className="w-3 h-3 mr-1" /> {product.location}
                            </p>
                        </div>
                    </div>

                    {/* Details Section */}
                    <div className="px-4 py-6 md:p-8 space-y-6 relative -mt-6 md:mt-0 bg-white rounded-t-3xl md:rounded-none">
                        {/* Desktop Title (Hidden Mobile) */}
                        <div className="hidden md:block border-b border-gray-100 pb-4">
                            <h1 className="text-3xl font-bold text-gray-900">{t(`crops.${product.cropName}`, {defaultValue: product.cropName})}</h1>
                            <p className="text-gray-500 flex items-center mt-2 text-sm">
                                <MapPin className="w-4 h-4 mr-1 text-green-600" /> {product.location}
                            </p>
                        </div>

                        {/* Price & Rating */}
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">{t('product.price')}</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold text-gray-900">₹{product.price}</span>
                                    <span className="text-gray-500 font-medium">{t('product.per_kg')}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 bg-green-50 px-3 py-1.5 rounded-xl border border-green-100">
                                <Star className="w-4 h-4 text-green-600 fill-current" />
                                <span className="font-bold text-green-700 text-sm">4.8</span>
                                <span className="text-green-600/60 text-xs ml-1">(120+ {t('product.reviews')})</span>
                            </div>
                        </div>

                        {/* Quantity Selector */}
                        <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-900">{t('product.quantity_kg')}</span>
                                <span className={`text-xs px-2 py-1 rounded-full ${product.quantity < 10 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                    {product.quantity} {t('product.kg_available')}
                                </span>
                            </div>
                            <div className="flex justify-center py-2">
                                <QuantitySelector
                                    quantity={quantity}
                                    maxQuantity={product.quantity}
                                    onIncrement={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                                    onDecrement={() => setQuantity(Math.max(1, quantity - 1))}
                                />
                            </div>
                        </div>

                        {/* Description / Info */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-gray-900">{t('product.product_highlights')}</h3>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">24h</p>
                                        <p className="text-xs text-gray-500">{t('product.delivery')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                                    <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                                        <Star className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{t('product.top_rated')}</p>
                                        <p className="text-xs text-gray-500">{t('product.verified_farm')}</p>
                                    </div>
                                </div>
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                Freshly harvested organic {product.cropName.toLowerCase()} directly from the fields of {product.location}.
                                Grown without harmful pesticides, ensuring the best quality and taste for your family.
                            </p>
                        </div>

                        {/* Success Message */}
                        {showMessage && (
                            <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-2 animate-bounce">
                                <Check className="w-5 h-5" />
                                {t('product.added_to_cart')}
                            </div>
                        )}

                        {/* Bottom Action Bar */}
                        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 md:static md:bg-transparent md:border-none md:p-0 z-40">
                            <div className="max-w-4xl mx-auto flex items-center gap-3">
                                <div className="flex-1 md:hidden">
                                    <p className="text-xs text-gray-500">Total Price</p>
                                    <p className="text-xl font-bold text-gray-900">₹{(product.price * quantity).toFixed(2)}</p>
                                </div>
                                <button
                                    onClick={handleAddToCart}
                                    disabled={product.quantity === 0 || user?.role !== 'buyer'}
                                    className="flex-1 md:flex-1 py-3.5 bg-white border-2 border-green-600 text-green-600 rounded-xl font-bold hover:bg-green-50 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <ShoppingCart className="w-5 h-5" />
                                    <span className="hidden sm:inline">{t('product.add_to_cart')}</span>
                                </button>
                                {user?.role === 'buyer' && (
                                    <button
                                        onClick={handleStartChat}
                                        className="py-3.5 px-4 bg-white border-2 border-blue-500 text-blue-500 rounded-xl font-bold hover:bg-blue-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        <MessageSquare className="w-5 h-5" />
                                    </button>
                                )}
                                <button
                                    onClick={handleBuyNow}
                                    disabled={product.quantity === 0 || user?.role !== 'buyer'}
                                    className="flex-[2] md:flex-1 py-3.5 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {user?.role === 'buyer' ? t('product.buy_now') : t('common.login')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
