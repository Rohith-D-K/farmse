import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { MapPin, Truck, Store, Info, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer } from 'react-leaflet';
import type { LatLngTuple } from 'leaflet';
import { useTranslation } from 'react-i18next';
import { getImageForCrop } from '../utils/productImages';

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
    const { t } = useTranslation();
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
            <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-surface)' }}>
                <div className="text-center">
                    <p className="text-xl font-bold text-farmse-dark mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                        {t('checkout.cart_empty')}
                    </p>
                    <button onClick={() => navigate('/marketplace')} className="btn-primary px-6 py-3">
                        {t('checkout.browse_marketplace')}
                    </button>
                </div>
            </div>
        );
    }

    const itemTotal = checkoutItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = deliveryMethod === 'buyer_pickup' ? 0 : 50; // Mock fee
    const taxes = itemTotal * 0.05; // 5% tax
    const finalTotal = itemTotal + deliveryFee + taxes;

    // Check if any product exceeds 10km for farmer delivery eligibility
    const maxDistanceKm = Object.values(distanceByProduct).reduce(
        (max, d) => Math.max(max, d.distanceKm), 0
    );
    const farmerDeliveryAvailable = maxDistanceKm <= 10 || Object.keys(distanceByProduct).length === 0;

    // Auto-switch away from farmer_delivery if it becomes unavailable
    if (!farmerDeliveryAvailable && deliveryMethod === 'farmer_delivery') {
        setDeliveryMethod('buyer_pickup');
    }

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
        <div className="min-h-screen pb-24 md:pb-8" style={{ background: 'var(--color-surface)' }}>
            <div className="max-w-2xl mx-auto md:py-8 space-y-4 pt-2">

                {/* First Order Free Banner (conditional) */}
                {deliveryFee === 0 && (
                    <div className="flash-banner p-4 flex items-center gap-3">
                        <span className="text-2xl">🎉</span>
                        <div>
                            <p className="text-white font-bold text-sm" style={{ fontFamily: 'var(--font-display)' }}>
                                First Order Free Delivery!
                            </p>
                            <p className="text-white/80 text-xs">No delivery charge on your first order.</p>
                        </div>
                    </div>
                )}

                {/* Items List */}
                <div className="space-y-3">
                    <h2 className="text-base font-bold text-farmse-dark" style={{ fontFamily: 'var(--font-display)' }}>
                        {t('checkout.order_items')} ({checkoutItems.length})
                    </h2>
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
                                className="w-20 h-20 object-cover flex-shrink-0"
                                style={{ borderRadius: 'var(--radius-sm)' }}
                                onError={(e) => { (e.target as HTMLImageElement).src = getImageForCrop(item.cropName); }}
                            />
                            <div className="flex-1">
                                <h3 className="font-semibold text-farmse-dark" style={{ fontFamily: 'var(--font-body)' }}>
                                    {t(`crops.${item.cropName}`, {defaultValue: item.cropName})}
                                </h3>
                                <p className="text-xs text-farmse-muted mt-0.5 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" strokeWidth={1.5} />
                                    {item.location}
                                </p>
                                {distanceByProduct[item.productId] && (
                                    <p className="text-xs mt-1 font-medium" style={{ color: 'var(--color-green)' }}>
                                        {distanceByProduct[item.productId].distanceKm.toFixed(1)} {t('checkout.km_away')}
                                        {distanceByProduct[item.productId].etaMinutes
                                            ? ` • ~${distanceByProduct[item.productId].etaMinutes} min`
                                            : ''}
                                    </p>
                                )}
                                <div className="flex justify-between items-center mt-2">
                                    <div className="px-2.5 py-1 rounded-card text-xs font-semibold text-farmse-dark"
                                        style={{ background: 'var(--color-amber-light)', fontFamily: 'var(--font-body)' }}>
                                        {item.quantity} {t('checkout.kg')}
                                    </div>
                                    <span className="font-bold text-farmse-dark">₹{(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            </div>
                            {!isDirectBuy && (
                                <button
                                    onClick={() => removeFromCart(item.productId)}
                                    className="self-start p-2 hover:bg-red-50 text-red-400 hover:text-red-500 rounded-card transition-colors"
                                    title="Remove from cart"
                                >
                                    <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                                </button>
                            )}
                        </div>
                    ))}
                    {cartSyncMessage && (
                        <div className="p-3 rounded-card text-xs" style={{ background: '#EEF7FF', color: '#1d4ed8' }}>
                            {cartSyncMessage}
                        </div>
                    )}
                    {distanceError && (
                        <div className="p-3 rounded-card text-xs" style={{ background: 'var(--color-amber-light)', color: '#92400e' }}>
                            {distanceError}. Update your profile address for accurate farm distance.
                        </div>
                    )}
                </div>

                {activeRoute && routePoints.length > 1 && (
                    <div className="card-premium p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-gray-900">{t('checkout.route_preview')}</h3>
                            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-50 text-green-700">
                                {activeRoute.provider === 'ola' ? 'Ola' : t('checkout.estimated_route')}
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
                                        {t(`crops.${item.cropName}`, {defaultValue: item.cropName})}
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
                                <p className="font-semibold">{t('checkout.your_location')}</p>
                                <p className="mt-1">{activeRoute.from.label}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-red-50 text-red-800">
                                <p className="font-semibold">{t('checkout.farm_location')}</p>
                                <p className="mt-1">{activeRoute.to.label}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delivery Options */}
                <div className="card-premium p-4 space-y-4">
                    <h3 className="font-bold text-farmse-dark flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                        <Truck className="w-5 h-5 text-farmse-green" strokeWidth={1.5} /> {t('checkout.delivery_options')}
                    </h3>

                    <div className="space-y-3">
                        <label className={`flex items-center gap-4 p-4 rounded-card border-2 cursor-pointer transition-all ${
                            deliveryMethod === 'buyer_pickup'
                                ? 'border-farmse-green bg-farmse-green-light'
                                : 'border-gray-100 hover:border-farmse-green/30'
                        }`}>
                            <input type="radio" name="delivery" checked={deliveryMethod === 'buyer_pickup'} onChange={() => setDeliveryMethod('buyer_pickup')}
                                className="w-4 h-4 accent-farmse-green" />
                            <div className="flex-1">
                                <div className="flex justify-between">
                                    <span className="font-semibold text-farmse-dark" style={{ fontFamily: 'var(--font-body)' }}>{t('checkout.buyer_pickup')}</span>
                                    <span className="font-bold text-farmse-green">{t('checkout.free')}</span>
                                </div>
                                <p className="text-xs text-farmse-muted mt-0.5">{t('checkout.buyer_pickup_desc')}</p>
                            </div>
                        </label>

                        <label className={`flex items-center gap-4 p-4 rounded-card border-2 cursor-pointer transition-all ${
                            !farmerDeliveryAvailable
                                ? 'opacity-50 cursor-not-allowed border-gray-100 bg-gray-50'
                                : deliveryMethod === 'farmer_delivery'
                                    ? 'border-farmse-green bg-farmse-green-light'
                                    : 'border-gray-100 hover:border-farmse-green/30'
                        }`}>
                            <input type="radio" name="delivery" checked={deliveryMethod === 'farmer_delivery'} onChange={() => setDeliveryMethod('farmer_delivery')}
                                disabled={!farmerDeliveryAvailable} className="w-4 h-4 accent-farmse-green" />
                            <div className="flex-1">
                                <div className="flex justify-between">
                                    <span className="font-semibold text-farmse-dark" style={{ fontFamily: 'var(--font-body)' }}>{t('checkout.farmer_delivery')}</span>
                                    <span className="font-bold text-farmse-dark">₹50</span>
                                </div>
                                <p className="text-xs text-farmse-muted mt-0.5">{t('checkout.delivered_to_doorstep')}</p>
                                {!farmerDeliveryAvailable && (
                                    <p className="text-xs text-red-500 mt-1 font-medium">
                                        {t('checkout.not_available_farm_distance', { distance: maxDistanceKm.toFixed(1) })}
                                    </p>
                                )}
                            </div>
                        </label>
                    </div>

                    {/* Address Preview */}
                    <div className="flex items-start gap-3 p-3 rounded-card" style={{ background: 'var(--color-surface)' }}>
                        <MapPin className="w-4 h-4 text-farmse-muted mt-0.5" strokeWidth={1.5} />
                        <div>
                            <p className="text-xs font-semibold text-farmse-dark">{t('checkout.your_location')}:</p>
                            <p className="text-xs text-farmse-muted mt-0.5 line-clamp-1">{user?.location}</p>
                        </div>
                    </div>
                </div>

                {/* Bill Details */}
                <div className="card-premium p-4 space-y-3">
                    <h3 className="font-bold text-farmse-dark" style={{ fontFamily: 'var(--font-display)' }}>{t('checkout.bill_details')}</h3>
                    <div className="space-y-2.5 text-sm">
                        <div className="flex justify-between text-farmse-muted">
                            <span>{t('checkout.item_total')}</span>
                            <span>₹{itemTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-farmse-muted">
                            <span>{t('checkout.delivery_fee')}</span>
                            <span className={deliveryFee === 0 ? 'text-farmse-green font-semibold' : ''}>
                                {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}
                            </span>
                        </div>
                        <div className="flex justify-between text-farmse-muted">
                            <span className="flex items-center gap-1">{t('checkout.taxes')} <Info className="w-3 h-3" strokeWidth={1.5} /></span>
                            <span>₹{taxes.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-dashed border-farmse-green/20 pt-3 flex justify-between font-bold text-lg text-farmse-dark">
                            <span style={{ fontFamily: 'var(--font-display)' }}>{t('checkout.to_pay')}</span>
                            <span style={{ color: 'var(--color-green)' }}>₹{finalTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Farmer Support Info */}
                <div className="p-4 rounded-card text-xs flex gap-3 items-center"
                    style={{ background: 'var(--color-green-light)', color: 'var(--color-green-dark)' }}>
                    <Store className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
                    <p>Your order supports local farmers and ensures 100% of the value reaches them.</p>
                </div>
            </div>

            {/* Bottom Pay Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 md:static md:p-0 safe-bottom"
                style={{ background: 'rgba(249,246,240,0.95)', backdropFilter: 'blur(14px)', borderTop: '1px solid rgba(45,122,79,0.10)' }}>
                <div className="max-w-2xl mx-auto md:border-none md:shadow-none">
                    <button
                        onClick={handleProceedToPayment}
                        className="w-full py-4 text-white rounded-card font-bold shadow-card-hover hover:opacity-90 active:scale-[0.97] transition-all text-base flex justify-between px-6 items-center"
                        style={{ background: 'linear-gradient(135deg, #2D7A4F 0%, #1A5C3A 100%)', fontFamily: 'var(--font-body)' }}
                    >
                        <span className="text-lg" style={{ fontFamily: 'var(--font-display)' }}>₹{finalTotal.toFixed(2)}</span>
                        <span className="flex items-center gap-2 text-sm font-semibold">
                            {t('checkout.proceed_to_pay')}
                            <span className="bg-white/20 rounded-card px-2 py-0.5">→</span>
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};
