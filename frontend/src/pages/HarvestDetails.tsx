import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, AlertTriangle, Users, TrendingUp, ShieldCheck, Mail, CalendarClock, Truck, Package } from 'lucide-react';

export const HarvestDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [harvest, setHarvest] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [priceRec, setPriceRec] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [preorderQuantity, setPreorderQuantity] = useState('');
    
    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchData = async () => {
        try {
            const hData = await api.harvests.getById(id!);
            setHarvest(hData);
            const sData = await api.harvests.getStats(id!);
            setStats(sData);
            
            if (hData.latitude && hData.longitude) {
                try {
                    const pData = await api.price.recommend(hData.cropName, hData.latitude, hData.longitude);
                    setPriceRec(pData);
                } catch (e) { console.error('Error fetching price recommendation'); }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePreorder = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.harvests.preorder({
                harvestId: id,
                quantity: Number(preorderQuantity),
                deliveryMethod: 'buyer_pickup'
            });
            alert('Pre-order successfully placed!');
            setPreorderQuantity('');
            fetchData();
        } catch (err: any) {
            alert(err.message || 'Error occurred');
        }
    };

    const handleBulkOrder = async () => {
        const qty = prompt('Enter bulk quantity:');
        if (!qty) return;
        try {
            await api.retailer.bulkOrder({ harvestId: id, quantity: Number(qty), deliveryMethod: 'farmer_delivery' });
            alert('Bulk order placed!');
            fetchData();
        } catch (err: any) { alert(err.message); }
    };

    const handleNegotiate = async () => {
        const offer = prompt('Enter suggested price per kg:');
        const qty = prompt('Enter quantity:');
        if (!offer || !qty) return;
        try {
            await api.retailer.negotiate({ harvestId: id, farmerId: harvest.farmerId, offerPrice: Number(offer), quantity: Number(qty), message: 'Retailer negotiation' });
            alert('Negotiation sent!');
        } catch (err: any) { alert(err.message); }
    };

    const handleSubscribe = async () => {
        const qty = prompt('Enter weekly quantity for subscription:');
        if (!qty) return;
        try {
            await api.retailer.subscription({ farmerId: harvest.farmerId, cropName: harvest.cropName, quantity: Number(qty), frequency: 'weekly', duration: 3 });
            alert('Subscription requested!');
        } catch (err: any) { alert(err.message); }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
    if (!harvest) return <div className="p-8 text-center text-red-500">Harvest not found</div>;

    const isRetailer = user?.role === 'retailer';
    const isDeadlinePassed = new Date() > new Date(harvest.preorderDeadline);

    const handleBack = () => {
        if (user?.role === 'farmer' && String(harvest?.farmerId) === String(user?.id)) {
            navigate('/farmer/dashboard');
        } else if (window.history?.length > 2) {
            navigate(-1);
        } else {
            navigate('/marketplace');
        }
    };

    return (
        <div className="max-w-3xl mx-auto pb-20 md:pb-8">
            <div className="flex items-center gap-3 mb-6">
                <button onClick={handleBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Upcoming Harvest</h1>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden mb-6">
                <div className="p-6 border-b border-gray-100 bg-orange-50/50 flex flex-col md:flex-row gap-6">
                    {harvest.image ? (
                        <div className="md:w-1/3 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                            <img src={harvest.image} alt={harvest.cropName} className="object-cover w-full h-48" />
                        </div>
                    ) : (
                        <div className="md:w-1/3 bg-orange-100 rounded-xl flex items-center justify-center shrink-0 h-48">
                            <Package className="w-16 h-16 text-orange-200" />
                        </div>
                    )}
                    <div className="flex-1">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">{harvest.cropName}</h2>
                        <p className="text-gray-600 mb-4">{harvest.description || `Fresh ${harvest.cropName} directly from the farm.`}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-3 rounded-xl border border-orange-100 shadow-sm">
                            <p className="text-xs text-gray-500 mb-1">Expected Date</p>
                            <p className="font-semibold text-gray-900">{new Date(harvest.expectedHarvestDate).toLocaleDateString()}</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-orange-100 shadow-sm">
                            <p className="text-xs text-gray-500 mb-1">Base Price</p>
                            <p className="font-semibold text-gray-900">₹{harvest.basePricePerKg}/kg</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-orange-100 shadow-sm">
                            <p className="text-xs text-gray-500 mb-1">Min Preorder</p>
                            <p className="font-semibold text-gray-900">{harvest.minPreorderQuantity} kg</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-orange-100 shadow-sm">
                            <p className="text-xs text-gray-500 mb-1">Deadline</p>
                            <p className="font-semibold text-gray-900">{new Date(harvest.preorderDeadline).toLocaleDateString()}</p>
                        </div>
                        </div>
                    </div>
                </div>

                {stats && (
                    <div className="p-6">
                        <div className="mb-6">
                            <div className="flex justify-between items-end mb-2">
                                <div>
                                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-orange-500" />
                                        Demand Level: {stats.demandLevel}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {stats.totalPreordered} kg reserved of {harvest.estimatedQuantity} kg ({Math.round(stats.demandPercent)}%)
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900">{stats.remainingQuantity} kg remaining</p>
                                </div>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all ${stats.demandPercent > 70 ? 'bg-green-500' : stats.demandPercent > 40 ? 'bg-orange-400' : 'bg-red-400'}`}
                                    style={{ width: `${Math.min(100, stats.demandPercent)}%` }}
                                ></div>
                            </div>
                        </div>

                        {stats.isSafe ? (
                            <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-200 flex items-start gap-3">
                                <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-green-800">Harvest is financially safe</p>
                                    <p className="text-sm text-green-700 mt-1">This harvest has reached the target threshold and will definitely proceed.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-amber-800">More orders needed to avoid surplus</p>
                                    <p className="text-sm text-amber-700 mt-1">Help the farmer by placing a pre-order now to secure this harvest.</p>
                                </div>
                            </div>
                        )}

                        <div className="mb-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
                            <h3 className="font-bold text-blue-900 flex items-center gap-2 mb-2">
                                <Users className="w-4 h-4 text-blue-600" />
                                Community Buying Status
                            </h3>
                            
                            {priceRec && (
                                <div className="mb-4 text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-100 flex items-center justify-between">
                                    <span>Estimated Market Avg:</span>
                                    <span className="font-semibold text-gray-800">
                                        ₹{priceRec.defaultPriceRange?.min || Math.round((priceRec.recommendedPrice || harvest.basePricePerKg) * 0.9)} - ₹{priceRec.defaultPriceRange?.max || Math.round((priceRec.recommendedPrice || harvest.basePricePerKg) * 1.1)}/kg
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-between items-center bg-white p-3 rounded-lg mb-2">
                                <div>
                                    <p className="text-sm text-gray-600">Current Discount Tier</p>
                                    <p className="font-bold text-gray-900">{stats.discountPercent * 100}% Off</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">Est. Final Price</p>
                                    <p className="text-xl font-bold text-green-600">₹{stats.discountedPrice}/kg</p>
                                    <p className="text-xs text-gray-500 line-through">₹{harvest.basePricePerKg}/kg</p>
                                </div>
                            </div>
                            <p className="text-xs text-center text-gray-500 italic mt-2">
                                Final price will be locked after preorder deadline: <strong>{new Date(harvest.preorderDeadline).toLocaleDateString()}</strong>
                            </p>
                        </div>

                        {(user?.role === 'buyer' || user?.role === 'retailer') && (
                            isDeadlinePassed ? (
                                <div className="p-4 bg-gray-100 text-gray-600 rounded-xl text-center border border-gray-200">
                                    <p className="font-semibold text-gray-800">Pre-orders are closed</p>
                                    <p className="text-sm">The deadline for pre-booking this harvest has passed.</p>
                                </div>
                            ) : (
                                <form onSubmit={handlePreorder} className="border-t border-gray-100 pt-6">
                                    <h3 className="font-bold text-gray-900 mb-4">Secure Your Pre-order</h3>
                                    <div className="flex gap-3">
                                        <div className="flex-1">
                                            <input
                                                type="number"
                                                required
                                                step="any"
                                                min={0.1}
                                                max={stats.remainingQuantity}
                                                onKeyDown={(e) => {
                                                    if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                value={preorderQuantity}
                                                onChange={e => setPreorderQuantity(e.target.value)}
                                                placeholder={`Min. ${harvest.minPreorderQuantity} kg`}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                            />
                                        </div>
                                        <button 
                                            type="submit"
                                            className="bg-orange-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-orange-700 transition-colors shadow-sm"
                                        >
                                            Pre-order Now
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">* You can cancel before the deadline.</p>
                                    <div className="mt-1 text-xs font-semibold text-red-500">
                                        {Number(preorderQuantity) > stats.remainingQuantity && `Only ${stats.remainingQuantity} kg remaining`}
                                        {preorderQuantity && Number(preorderQuantity) < harvest.minPreorderQuantity && `Minimum preorder is ${harvest.minPreorderQuantity} kg`}
                                    </div>
                                </form>
                            )
                        )}
                        
                        {/* Retailer Features Section */}
                        {isRetailer && (
                            <div className="mt-8 border-t-2 border-dashed border-gray-200 pt-6">
                                <h3 className="font-bold text-gray-900 mb-4">Retailer Operations (Bulk Buyer)</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={handleBulkOrder} className="flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors text-sm">
                                        <Package className="w-4 h-4" /> Bulk Order
                                    </button>
                                    <button onClick={handleNegotiate} className="flex items-center justify-center gap-2 bg-white border-2 border-gray-900 text-gray-900 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm">
                                        <Mail className="w-4 h-4" /> Negotiate Price
                                    </button>
                                    <button onClick={handleSubscribe} className="flex items-center justify-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 py-3 rounded-xl font-medium hover:bg-indigo-100 transition-colors text-sm">
                                        <CalendarClock className="w-4 h-4" /> Subscription Order
                                    </button>
                                    <button className="flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 py-3 rounded-xl font-medium hover:bg-amber-100 transition-colors text-sm">
                                        <Truck className="w-4 h-4" /> Priority Delivery
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
