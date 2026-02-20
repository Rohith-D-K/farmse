import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { ArrowLeft, MapPin, Truck, Store, Info, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer } from 'react-leaflet';
import type { LatLngTuple } from 'leaflet';

interface DistanceInfo {
    distanceKm: number;
    etaMinutes: number | null;
    provider: 'ola' | 'haversine';
    routePoints?: Array<{ latitude: number; longitude: number }>;
    from: {
        latitude: number;
        longitude: number;
        label: string;
    };
    to: {
        latitude: number;
        longitude: number;
        label: string;
    };
}

export const Checkout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { items: cartItems, removeFromCart } = useCart();
    const { product, quantity } = location.state || {};

    // Support both cart checkout and direct "Buy Now"
    const isDirectBuy = product && quantity;
    const checkoutItems = isDirectBuy
        ? [{ productId: product.id, cropName: product.cropName, price: product.price, quantity, maxQuantity: product.quantity, image: product.image, location: product.location }]
        : cartItems;
    const checkoutProductKey = checkoutItems.map(item => item.productId).join(',');

    const [deliveryMethod, setDeliveryMethod] = useState<'buyer_pickup' | 'farmer_delivery' | 'local_transport'>('buyer_pickup');
    const [distanceByProduct, setDistanceByProduct] = useState<Record<string, DistanceInfo>>({});
    const [distanceError, setDistanceError] = useState('');
    const [cartSyncMessage, setCartSyncMessage] = useState('');
    const [selectedRouteProductId, setSelectedRouteProductId] = useState<string | null>(checkoutItems[0]?.productId || null);

    useEffect(() => {
        setSelectedRouteProductId(checkoutItems[0]?.productId || null);
    }, [checkoutProductKey]);

    useEffect(() => {
        const syncCartWithInventory = async () => {
            if (isDirectBuy || cartItems.length === 0) {
                return;
            }

            try {
                const products = await api.products.getAll();
                const validProductIds = new Set(products.map(productItem => productItem.id));
                const staleItems = cartItems.filter(item => !validProductIds.has(item.productId));

                if (staleItems.length > 0) {
                    staleItems.forEach(item => removeFromCart(item.productId));
                    setCartSyncMessage('Some unavailable products were removed from your cart.');
                } else {
                    setCartSyncMessage('');
                }
            } catch {
                // Silent fail; checkout can still proceed with current cart state
            }
        };

        syncCartWithInventory();
    }, [isDirectBuy, cartItems.length]);

    useEffect(() => {
        const fetchDistancePreview = async () => {
            if (user?.role !== 'buyer' || checkoutItems.length === 0) {
                return;
            }

            try {
                const settledResults = await Promise.allSettled(
                    checkoutItems.map(async item => {
                        const distance = await api.orders.getDistance(item.productId);
                        return [
                            item.productId,
                            {
                                distanceKm: distance.distanceKm,
                                etaMinutes: distance.etaMinutes,
                                provider: distance.provider,
                                routePoints: distance.routePoints,
                                from: distance.from,
                                to: distance.to
                            } as DistanceInfo
                        ] as const;
                    })
                );

                const successfulEntries = settledResults
                    .filter((result): result is PromiseFulfilledResult<readonly [string, DistanceInfo]> => result.status === 'fulfilled')
                    .map(result => result.value);

                setDistanceByProduct(Object.fromEntries(successfulEntries));

                const hasFailures = settledResults.some(result => result.status === 'rejected');
                if (hasFailures && successfulEntries.length > 0) {
                    setDistanceError('Distance unavailable for some items');
                } else if (hasFailures) {
                    setDistanceError('Distance preview unavailable');
                } else {
                    setDistanceError('');
                }
            } catch (error: any) {
                setDistanceError(error.message || 'Distance preview unavailable');
            }
        };

        fetchDistancePreview();
    }, [user?.role, checkoutProductKey]);

    if (checkoutItems.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <p className="text-xl font-bold text-gray-900 mb-4">Cart is empty</p>
                    <button onClick={() => navigate('/marketplace')} className="btn-primary px-6 py-2">
                        Browse Marketplace
                    </button>
                </div>
            </div>
        );
    }

    const itemTotal = checkoutItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = deliveryMethod === 'buyer_pickup' ? 0 : 50; // Mock fee
    const taxes = itemTotal * 0.05; // 5% tax
    const finalTotal = itemTotal + deliveryFee + taxes;
    const activeRoute = selectedRouteProductId ? distanceByProduct[selectedRouteProductId] : undefined;
    const routePoints: LatLngTuple[] = activeRoute
        ? (activeRoute.routePoints && activeRoute.routePoints.length > 1
            ? activeRoute.routePoints.map(point => [point.latitude, point.longitude] as LatLngTuple)
            : [
                [activeRoute.from.latitude, activeRoute.from.longitude],
                [activeRoute.to.latitude, activeRoute.to.longitude]
            ])
        : [];

    const handleProceedToPayment = () => {
        navigate('/payment', {
            state: {
                items: checkoutItems,
                deliveryMethod,
                totalPrice: finalTotal,
                isDirectBuy
            }
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
            <header className="bg-white sticky top-0 z-30 px-4 py-3 shadow-sm flex items-center gap-4 md:hidden">
                <button onClick={() => navigate(-1)} className="p-1">
                    <ArrowLeft className="w-6 h-6 text-gray-700" />
                </button>
                <h1 className="text-lg font-bold text-gray-900">Checkout</h1>
            </header>

            <div className="max-w-2xl mx-auto md:py-8 space-y-6 px-4 pt-6">

                {/* Items List */}
                <div className="space-y-3">
                    <h2 className="text-lg font-bold text-gray-900">Order Items ({checkoutItems.length})</h2>
                    {cartSyncMessage && (
                        <div className="p-3 rounded-lg bg-blue-50 text-blue-700 text-xs">
                            {cartSyncMessage}
                        </div>
                    )}
                    {checkoutItems.map((item) => (
                        <div key={item.productId} className="card-premium p-4 flex gap-4">
                            <img
                                src={item.image}
                                alt={item.cropName}
                                className="w-20 h-20 rounded-xl object-cover shadow-sm"
                            />
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900">{item.cropName}</h3>
                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {item.location}
                                </p>
                                {distanceByProduct[item.productId] && (
                                    <p className="text-xs text-green-700 mt-1 font-medium">
                                        {distanceByProduct[item.productId].distanceKm.toFixed(1)} km from your delivery address
                                        {distanceByProduct[item.productId].etaMinutes
                                            ? ` • ~${distanceByProduct[item.productId].etaMinutes} min`
                                            : ''}
                                    </p>
                                )}
                                <div className="flex justify-between items-center mt-3">
                                    <div className="bg-gray-100 px-2 py-1 rounded-lg text-xs font-bold text-gray-700">
                                        {item.quantity} kg
                                    </div>
                                    <span className="font-bold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            </div>
                            {!isDirectBuy && (
                                <button
                                    onClick={() => removeFromCart(item.productId)}
                                    className="self-start p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                                    title="Remove from cart"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    ))}
                    {distanceError && (
                        <div className="p-3 rounded-lg bg-amber-50 text-amber-700 text-xs">
                            {distanceError}. Update your profile address for accurate farm distance.
                        </div>
                    )}
                </div>

                {activeRoute && routePoints.length > 1 && (
                    <div className="card-premium p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-gray-900">Route Preview</h3>
                            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-50 text-green-700">
                                {activeRoute.provider === 'ola' ? 'Ola Route' : 'Estimated Route'}
                            </span>
                        </div>

                        {checkoutItems.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                {checkoutItems.map(item => (
                                    <button
                                        key={item.productId}
                                        onClick={() => setSelectedRouteProductId(item.productId)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${selectedRouteProductId === item.productId
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {item.cropName}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="rounded-xl overflow-hidden border border-gray-200 h-56">
                            <MapContainer
                                key={selectedRouteProductId}
                                bounds={routePoints}
                                className="w-full h-full"
                                scrollWheelZoom={false}
                            >
                                <TileLayer
                                    attribution='&copy; OpenStreetMap contributors'
                                    url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                                />

                                <Polyline
                                    positions={routePoints}
                                    pathOptions={{ color: '#16a34a', weight: 4, opacity: 0.9 }}
                                />

                                <CircleMarker center={routePoints[0]} radius={7} pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 1 }}>
                                    <Popup>{activeRoute.from.label}</Popup>
                                </CircleMarker>

                                <CircleMarker center={routePoints[routePoints.length - 1]} radius={7} pathOptions={{ color: '#dc2626', fillColor: '#dc2626', fillOpacity: 1 }}>
                                    <Popup>{activeRoute.to.label}</Popup>
                                </CircleMarker>
                            </MapContainer>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-lg bg-blue-50 text-blue-800">
                                <p className="font-semibold">From (Buyer)</p>
                                <p className="mt-1">{activeRoute.from.label}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-red-50 text-red-800">
                                <p className="font-semibold">To (Farm)</p>
                                <p className="mt-1">{activeRoute.to.label}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delivery Options */}
                <div className="card-premium p-4 space-y-4">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Truck className="w-5 h-5 text-green-600" /> Delivery Options
                    </h3>

                    <div className="space-y-3">
                        <label className={`
                            flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
                            ${deliveryMethod === 'buyer_pickup' ? 'border-green-500 bg-green-50/50' : 'border-gray-100 hover:border-gray-200'}
                        `}>
                            <input type="radio" name="delivery" checked={deliveryMethod === 'buyer_pickup'} onChange={() => setDeliveryMethod('buyer_pickup')} className="w-5 h-5 text-green-600 accent-green-600" />
                            <div className="flex-1">
                                <div className="flex justify-between">
                                    <span className="font-bold text-gray-900">Buyer Pickup</span>
                                    <span className="text-green-600 font-bold">Free</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Pick up directly from farm</p>
                            </div>
                        </label>

                        <label className={`
                            flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
                            ${deliveryMethod === 'farmer_delivery' ? 'border-green-500 bg-green-50/50' : 'border-gray-100 hover:border-gray-200'}
                        `}>
                            <input type="radio" name="delivery" checked={deliveryMethod === 'farmer_delivery'} onChange={() => setDeliveryMethod('farmer_delivery')} className="w-5 h-5 text-green-600 accent-green-600" />
                            <div className="flex-1">
                                <div className="flex justify-between">
                                    <span className="font-bold text-gray-900">Farmer Delivery</span>
                                    <span className="text-gray-900 font-bold">₹50</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Delivered to your doorstep</p>
                            </div>
                        </label>
                    </div>

                    {/* Address Preview */}
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl mt-2">
                        <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                        <div>
                            <p className="text-xs font-bold text-gray-700">Deliver to:</p>
                            <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">{user?.deliveryLocation || user?.location}</p>
                        </div>
                    </div>
                </div>

                {/* Bill Details */}
                <div className="card-premium p-4 space-y-4">
                    <h3 className="font-bold text-gray-900">Bill Details</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between text-gray-600">
                            <span>Item Total</span>
                            <span>₹{itemTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Delivery Fee</span>
                            <span className={deliveryFee === 0 ? 'text-green-600' : ''}>
                                {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}
                            </span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span className="flex items-center gap-1">Taxes <Info className="w-3 h-3" /></span>
                            <span>₹{taxes.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-dashed border-gray-300 pt-3 flex justify-between font-bold text-lg text-gray-900">
                            <span>To Pay</span>
                            <span>₹{finalTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Safety Info */}
                <div className="bg-green-50 text-green-800 p-4 rounded-xl text-xs flex gap-3 items-center">
                    <Store className="w-5 h-5 flex-shrink-0" />
                    <p>Your order supports local farmers and ensures 100% of the value reaches them.</p>
                </div>
            </div>

            {/* Bottom Pay Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-lg md:static md:shadow-none md:border-none md:bg-transparent">
                <div className="max-w-2xl mx-auto">
                    <button
                        onClick={handleProceedToPayment}
                        className="w-full py-4 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700 active:scale-95 transition-all text-lg flex justify-between px-6 items-center"
                    >
                        <span>₹{finalTotal.toFixed(2)}</span>
                        <span className="flex items-center gap-2 text-base font-semibold">
                            Proceed to Pay <span className="bg-green-500/50 rounded-lg p-1">→</span>
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};
