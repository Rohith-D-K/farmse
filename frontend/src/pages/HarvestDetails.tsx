import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { 
    ArrowLeft,
    Package,
    TrendingUp,
    ShieldCheck,
    AlertTriangle,
    Users,
    Store,
    X,
    CheckCircle,
    Zap,
    Star
} from 'lucide-react';

// Bulk discount calculation (mirrors backend logic)
function getBulkDiscount(qty: number): number {
    if (qty > 100) return 20;
    if (qty > 50) return 15;
    if (qty > 20) return 10;
    return 5;
}

export const HarvestDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [harvest, setHarvest] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [priceRec, setPriceRec] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [preorderQuantity, setPreorderQuantity] = useState('');
    const [retailerProfile, setRetailerProfile] = useState<any>(null);

    // Modal state
    // step: null = no modal, 'ask' = "are you a retailer?", 'form' = retailer details form, 'success' = success, 'pending' = verification pending message
    const [modalStep, setModalStep] = useState<null | 'ask' | 'form' | 'success' | 'pending'>(null);
    const [submitting, setSubmitting] = useState(false);
    const [successInfo, setSuccessInfo] = useState<any>(null);

    // Retailer form state
    const [retailerForm, setRetailerForm] = useState({
        businessName: '',
        businessType: 'grocery' as 'grocery' | 'wholesale' | 'restaurant' | 'other',
        licenseNumber: '',
        gstNumber: '',
        address: '',
        phone: '',
        agree: false
    });
    const [formError, setFormError] = useState('');
    
    useEffect(() => {
        if (id) {
            fetchData();
            if (user?.role === 'buyer') {
                fetchRetailerStatus();
            }
        }
    }, [id, user]);

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

    const fetchRetailerStatus = async () => {
        try {
            const profile = await api.retailerProfile.getStatus();
            setRetailerProfile(profile);
        } catch (e) {
            // Profile probably not found, which is fine
            setRetailerProfile(null);
        }
    };

    const isDeadlinePassed = harvest ? new Date() > new Date(harvest.preorderDeadline) : false;

    const handleBack = () => {
        if (user?.role === 'farmer' && String(harvest?.farmerId) === String(user?.id)) {
            navigate('/farmer/dashboard');
        } else {
            navigate('/marketplace');
        }
    };

    // Called when the preorder form is submitted
    const handlePreorderSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const qty = Number(preorderQuantity);
        if (!qty || qty <= 0) return;

        // Trigger retailer modal if > 5 kg
        if (qty > 5) {
            if (retailerProfile) {
                if (retailerProfile.verificationStatus === 'verified') {
                    // Verified retailer - proceed with bulk preorder
                    placePreorder(true, retailerProfile.id);
                } else if (retailerProfile.verificationStatus === 'pending') {
                    // Pending verification - show message
                    setModalStep('pending');
                } else {
                    // Rejected or other - ask to register
                    setModalStep('ask');
                }
            } else {
                // No profile yet - ask to register
                setModalStep('ask');
            }
        } else {
            placePreorder(false, null);
        }
    };


    // Place the actual preorder (with or without retailer info)
    const placePreorder = async (isRetailer: boolean, retailerProfileId: string | null) => {
        setSubmitting(true);
        try {
            const result = await api.harvests.preorder({
                harvestId: id,
                quantity: Number(preorderQuantity),
                deliveryMethod: 'buyer_pickup',
                isRetailer,
                retailerProfileId
            });
            setSuccessInfo(result);
            setModalStep('success');
            setPreorderQuantity('');
            fetchData();
        } catch (err: any) {
            alert(err.message || 'Error occurred');
            setModalStep(null);
        } finally {
            setSubmitting(false);
        }
    };

    // Proceed as non-retailer
    const handleNotRetailer = async () => {
        setModalStep(null);
        await placePreorder(false, null);
    };

    // Submit retailer form → create profile → place preorder
    const handleRetailerFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        if (!retailerForm.businessName || !retailerForm.licenseNumber || !retailerForm.address || !retailerForm.phone) {
            setFormError('Please fill in all required fields.');
            return;
        }
        if (!retailerForm.agree) {
            setFormError('Please confirm the declaration.');
            return;
        }
        setSubmitting(true);
        try {
            await api.retailerProfile.submit({
                businessName: retailerForm.businessName,
                businessType: retailerForm.businessType,
                licenseNumber: retailerForm.licenseNumber,
                gstNumber: retailerForm.gstNumber || undefined,
                address: retailerForm.address,
                phone: retailerForm.phone
            });
            await fetchData(); // Refresh local profile status
            setSubmitting(false);
            setModalStep('pending');
        } catch (err: any) {
            setFormError(err.message || 'Failed to submit retailer details');
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
    if (!harvest) return <div className="p-8 text-center text-red-500">Harvest not found</div>;

    const qty = Number(preorderQuantity);
    const bulkDiscountPct = qty > 5 ? getBulkDiscount(qty) : 0;
    const discountedPricePerKg = harvest.basePricePerKg * (1 - bulkDiscountPct / 100);
    const estimatedTotal = discountedPricePerKg * qty;

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
                                    className={`h-full rounded-full transition-all ${stats.demandPercent > 70 ? 'bg-green-500' : stats.demandPercent >= 40 ? 'bg-orange-400' : 'bg-red-400'}`}
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

                        {/* Bulk Retailer Discount Info Banner */}
                        {user?.role === 'buyer' && !isDeadlinePassed && (
                            <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <Store className="w-4 h-4 text-purple-600" />
                                    <h4 className="font-bold text-purple-900 text-sm">Retailer Bulk Discounts Available</h4>
                                </div>
                                <div className="grid grid-cols-4 gap-2 text-center">
                                    {[{qty:'5–20 kg',disc:'5%'},{qty:'21–50 kg',disc:'10%'},{qty:'51–100 kg',disc:'15%'},{qty:'>100 kg',disc:'20%'}].map(t => (
                                        <div key={t.qty} className="bg-white rounded-lg p-2 border border-purple-100">
                                            <p className="text-[10px] text-gray-500">{t.qty}</p>
                                            <p className="font-black text-purple-700 text-sm">{t.disc}</p>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-purple-700 mt-2 text-center">Order &gt;5 kg and register as a retailer to unlock discounts + priority delivery!</p>
                            </div>
                        )}

                        {user && user.role !== 'farmer' && user.role !== 'admin' && (
                            isDeadlinePassed ? (
                                <div className="p-4 bg-gray-100 text-gray-600 rounded-xl text-center border border-gray-200">
                                    <p className="font-semibold text-gray-800">Pre-orders are closed</p>
                                    <p className="text-sm">The deadline for pre-booking this harvest has passed.</p>
                                </div>
                            ) : (
                                <form onSubmit={handlePreorderSubmit} className="border-t border-gray-100 pt-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-gray-900">Secure Your Pre-order</h3>
                                        {retailerProfile?.verificationStatus === 'verified' && (
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold ring-1 ring-green-200">
                                                <ShieldCheck className="w-3.5 h-3.5" />
                                                Verified Retailer
                                            </div>
                                        )}
                                        {retailerProfile?.verificationStatus === 'pending' && (
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold ring-1 ring-amber-200">
                                                <TrendingUp className="w-3.5 h-3.5" />
                                                Verification Pending
                                            </div>
                                        )}
                                    </div>
                                    
                                    {qty > 5 && (
                                        <div className="mb-4 p-3 bg-green-50 rounded-xl border border-green-200 flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-green-700 font-semibold">
                                                    {retailerProfile?.verificationStatus === 'verified' ? 'Retailer discount applied!' : 'Verified retailers get discounts!'}
                                                </p>
                                                <p className="text-xs text-green-600">
                                                    {retailerProfile?.verificationStatus === 'verified' ? `${bulkDiscountPct}% off → ₹${discountedPricePerKg.toFixed(2)}/kg` : 'Get up to 20% off by verifying'}
                                                </p>
                                            </div>
                                            {retailerProfile?.verificationStatus === 'verified' && (
                                                <p className="font-bold text-green-700">Est. ₹{estimatedTotal.toFixed(0)}</p>
                                            )}
                                        </div>
                                    )}
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
                                            disabled={submitting}
                                            className="bg-orange-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-orange-700 transition-colors shadow-sm disabled:opacity-50"
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
                    </div>
                )}
            </div>

            {/* ─── MODAL OVERLAY ─── */}
            {modalStep && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        
                        {/* ─── STEP: ASK ─── */}
                        {modalStep === 'ask' && (
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center">
                                        <Store className="w-7 h-7 text-purple-600" />
                                    </div>
                                    <button onClick={() => setModalStep(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 mb-3">Bulk Order Detected!</h2>
                                <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                                    You're ordering <strong>{preorderQuantity} kg</strong>. Did you know retailers get <strong>priority delivery</strong> and <strong>up to 20% discount</strong>?
                                </p>
                                
                                {/* Info Box */}
                                <div className="mb-8 p-6 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl text-white shadow-xl shadow-purple-100">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                                            <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/70 uppercase tracking-widest font-black">Potential Benefit</p>
                                            <p className="text-lg font-bold">Save ₹{(harvest.basePricePerKg * qty * bulkDiscountPct / 100).toFixed(0)}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-sm py-2 border-t border-white/10">
                                            <span className="text-white/70">Bulk Discount</span>
                                            <span className="font-black bg-white/20 px-2 py-0.5 rounded-lg">{bulkDiscountPct}% OFF</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm py-2 border-t border-white/10">
                                            <span className="text-white/70">Delivery Status</span>
                                            <span className="font-black flex items-center gap-1.5">
                                                <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                                                Priority
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => setModalStep('form')}
                                        className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black hover:bg-black transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-gray-200 text-base"
                                    >
                                        Register as Retailer
                                    </button>
                                    <button
                                        onClick={handleNotRetailer}
                                        disabled={submitting}
                                        className="w-full py-4 text-gray-500 font-bold hover:text-gray-700 transition-colors text-sm disabled:opacity-50"
                                    >
                                        Continue as Regular Buyer
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ─── STEP: PENDING ─── */}
                        {modalStep === 'pending' && (
                            <div className="p-8 text-center">
                                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <TrendingUp className="w-10 h-10 text-amber-600" />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 mb-3">Verification Pending</h2>
                                <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                                    We've received your retailer details for <strong>{retailerProfile?.businessName}</strong>. 
                                    Our team is verifying your application. 
                                    <br/><br/>
                                    Until then, you can still place this order as a regular buyer, or wait for approval to get bulk benefits!
                                </p>
                                
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={handleNotRetailer}
                                        className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black hover:bg-black transition-all"
                                    >
                                        Place Regular Order
                                    </button>
                                    <button
                                        onClick={() => setModalStep(null)}
                                        className="w-full py-4 text-gray-500 font-bold hover:text-gray-700 transition-colors text-sm"
                                    >
                                        Wait for Verification
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ─── STEP: FORM ─── */}
                        {modalStep === 'form' && (
                            <div className="max-h-[85vh] overflow-y-auto">
                                <div className="p-8 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
                                    <div>
                                        <h2 className="text-2xl font-black text-gray-900">Retailer Details</h2>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Join the network for bulk benefits</p>
                                    </div>
                                    <button onClick={() => setModalStep('ask')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                        <X className="w-6 h-6 text-gray-400" />
                                    </button>
                                </div>

                                <form onSubmit={handleRetailerFormSubmit} className="p-8 space-y-5">
                                    <div className="grid grid-cols-1 gap-5">
                                        <div>
                                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Business Name</label>
                                            <input
                                                type="text"
                                                value={retailerForm.businessName}
                                                onChange={e => setRetailerForm(f => ({ ...f, businessName: e.target.value }))}
                                                placeholder="e.g. Royal Fresh Fruits"
                                                className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl text-sm focus:border-purple-500 focus:bg-white transition-all outline-none font-medium"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Business Type</label>
                                                <select
                                                    value={retailerForm.businessType}
                                                    onChange={e => setRetailerForm(f => ({ ...f, businessType: e.target.value as any }))}
                                                    className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl text-sm focus:border-purple-500 focus:bg-white transition-all outline-none font-medium appearance-none"
                                                >
                                                    <option value="grocery">Grocery Store</option>
                                                    <option value="wholesale">Wholesale</option>
                                                    <option value="restaurant">Restaurant</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Contact Phone</label>
                                                <input
                                                    type="tel"
                                                    value={retailerForm.phone}
                                                    onChange={e => setRetailerForm(f => ({ ...f, phone: e.target.value }))}
                                                    placeholder="Phone number"
                                                    className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl text-sm focus:border-purple-500 focus:bg-white transition-all outline-none font-medium"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">License / Registration No.</label>
                                            <input
                                                type="text"
                                                value={retailerForm.licenseNumber}
                                                onChange={e => setRetailerForm(f => ({ ...f, licenseNumber: e.target.value }))}
                                                placeholder="FSSAI / APMC License"
                                                className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl text-sm focus:border-purple-500 focus:bg-white transition-all outline-none font-medium"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Business Address</label>
                                            <textarea
                                                value={retailerForm.address}
                                                onChange={e => setRetailerForm(f => ({ ...f, address: e.target.value }))}
                                                placeholder="Full registered address"
                                                rows={2}
                                                className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl text-sm focus:border-purple-500 focus:bg-white transition-all outline-none font-medium resize-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-2xl border border-purple-100">
                                        <input
                                            type="checkbox"
                                            id="agree"
                                            checked={retailerForm.agree}
                                            onChange={e => setRetailerForm(f => ({ ...f, agree: e.target.checked }))}
                                            className="mt-1 w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                        />
                                        <label htmlFor="agree" className="text-xs text-purple-900 font-medium leading-relaxed cursor-pointer">
                                            I declare that the information provided is true. I understand bulk benefits are unlocked only after verification.
                                        </label>
                                    </div>

                                    {formError && (
                                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-4 rounded-2xl border border-red-100">
                                            <AlertTriangle className="w-4 h-4 shrink-0" />
                                            <p>{formError}</p>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black hover:bg-purple-700 transition-all shadow-xl shadow-purple-100 disabled:opacity-50 flex items-center justify-center gap-2 group"
                                    >
                                        {submitting ? 'Processing...' : 'Submit for Verification'}
                                        {!submitting && <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />}
                                    </button>
                                </form>
                            </div>
                        )}


                        {/* ─── STEP: SUCCESS ─── */}
                        {modalStep === 'success' && successInfo && (
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 mb-2">Preorder Placed!</h2>
                                {successInfo.discountPercent > 0 ? (
                                    <>
                                        <p className="text-gray-500 text-sm mb-6">Your bulk retailer order is confirmed with priority delivery.</p>
                                        <div className="bg-gradient-to-r from-purple-50 to-green-50 rounded-2xl p-5 mb-6 text-left space-y-2 border border-purple-100">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Discount Applied</span>
                                                <span className="font-black text-purple-700">{successInfo.discountPercent}% OFF</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Price per kg</span>
                                                <span className="font-bold text-gray-900">₹{successInfo.pricePerKg?.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                                                <span className="text-sm font-bold text-gray-700">Total Price</span>
                                                <span className="font-black text-green-700">₹{successInfo.totalPrice?.toFixed(0)}</span>
                                            </div>
                                            <div className="mt-2 flex items-center gap-2 p-2 bg-purple-600 rounded-lg">
                                                <Zap className="w-4 h-4 text-white" />
                                                <span className="text-xs text-white font-bold">Priority Delivery Enabled</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-400 mb-6">Your retailer profile is pending verification. You'll retain these benefits once verified.</p>
                                    </>
                                ) : (
                                    <p className="text-gray-500 text-sm mb-6">Your preorder has been successfully placed and reserved.</p>
                                )}
                                <button
                                    onClick={() => { setModalStep(null); navigate('/orders'); }}
                                    className="w-full py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-colors"
                                >
                                    View My Orders
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
