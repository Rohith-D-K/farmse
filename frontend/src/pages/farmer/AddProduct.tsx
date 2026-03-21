import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import type { PriceRecommendation } from '../../lib/api';
import { ArrowLeft, Upload, Loader2, MapPin, DollarSign, Package, Lightbulb, ImagePlus, X, TrendingUp } from 'lucide-react';
import { getImageForCrop } from '../../utils/productImages';
import { useTranslation } from 'react-i18next';

export const AddProduct: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        cropName: '',
        price: '',
        quantity: '',
        location: user?.location || '',
        image: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [recommendation, setRecommendation] = useState<PriceRecommendation | null>(null);

    const [fetchedImage, setFetchedImage] = useState<string | null>(null);
    const [customImage, setCustomImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch price recommendation and auto-resolve image when crop name changes
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (formData.cropName.trim().length >= 2) {
                // Fetch price recommendation using new endpoint
                try {
                    const lat = user?.latitude ?? 20.5937; // fallback to India center
                    const lng = user?.longitude ?? 78.9629;
                    const result = await api.price.recommend(formData.cropName.trim(), lat, lng);
                    setRecommendation(result);
                } catch {
                    setRecommendation(null);
                }

                // Auto-resolve image: try local first, then fetch from internet
                if (!customImage) {
                    const localImage = getImageForCrop(formData.cropName.trim());
                    const defaultImage = getImageForCrop('All');
                    if (localImage !== defaultImage) {
                        setFetchedImage(null);
                    } else {
                        try {
                            const imgResult = await api.products.cropImage(formData.cropName.trim());
                            setFetchedImage(imgResult.imageUrl || null);
                        } catch {
                            setFetchedImage(null);
                        }
                    }
                }
            } else {
                setRecommendation(null);
                setFetchedImage(null);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [formData.cropName, customImage, user?.latitude, user?.longitude]);

    const resolvedImage = customImage || formData.image.trim() || fetchedImage || getImageForCrop(formData.cropName || 'All');

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = () => {
            setCustomImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const clearCustomImage = () => {
        setCustomImage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.products.create({
                cropName: formData.cropName,
                price: parseFloat(formData.price),
                quantity: parseInt(formData.quantity),
                location: formData.location,
                image: customImage || formData.image.trim() || fetchedImage || getImageForCrop(formData.cropName || 'All')
            });
            navigate('/farmer/dashboard');
        } catch (err: any) {
            setError(err.message || 'Failed to add product');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="max-w-2xl mx-auto pb-20 md:pb-8">
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => navigate(-1)} className="md:hidden p-2 -ml-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">{t('farmer.add_product_title')}</h1>
            </div>

            <div className="card-premium p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Image Upload Preview */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Product Image</label>
                        <div className="relative aspect-video rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center overflow-hidden hover:bg-gray-100 transition-colors group">
                            {(customImage || formData.image || fetchedImage || (formData.cropName.trim().length >= 2 && getImageForCrop(formData.cropName.trim()) !== getImageForCrop('All'))) ? (
                                <>
                                    <img
                                        src={resolvedImage}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.src = getImageForCrop(formData.cropName || 'All');
                                        }}
                                    />
                                    {customImage && (
                                        <button
                                            type="button"
                                            onClick={clearCustomImage}
                                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                                            title="Remove custom image"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                    {!customImage && (
                                        <div className="absolute bottom-2 right-2 text-[10px] bg-black/50 text-white px-2 py-1 rounded-md">
                                            Auto-selected
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center p-6">
                                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-gray-300 transition-colors">
                                        <Upload className="w-6 h-6 text-gray-500" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-900">Image is auto-selected from crop name</p>
                                    <p className="text-xs text-gray-500">Or choose your own image below</p>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                            >
                                <ImagePlus className="w-4 h-4" />
                                Choose Image
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <input
                                type="text"
                                name="image"
                                value={formData.image}
                                onChange={(e) => { handleChange(e); setCustomImage(null); }}
                                placeholder="Or paste image URL..."
                                className="input-field text-sm py-2 flex-1"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('farmer.crop_name')}</label>
                            <input
                                name="cropName"
                                type="text"
                                value={formData.cropName}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="e.g. Fresh Tomatoes"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('farmer.price_per_kg')}</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        name="price"
                                        type="number"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={handleChange}
                                        className="input-field pl-10"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('farmer.quantity_kg')}</label>
                                <div className="relative">
                                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        name="quantity"
                                        type="number"
                                        value={formData.quantity}
                                        onChange={handleChange}
                                        className="input-field pl-10"
                                        placeholder="0"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Dynamic Price Recommendation Box */}
                        {recommendation && (recommendation.recommendedPrice !== null || recommendation.defaultPriceRange) && (
                            <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                                        <Lightbulb className="w-5 h-5 text-yellow-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-yellow-800 uppercase tracking-wider mb-1">{t('farmer.suggested_price')}</p>
                                        {recommendation.recommendedPrice !== null ? (
                                            <>
                                                <p className="text-2xl font-bold text-green-700">₹{recommendation.recommendedPrice}<span className="text-sm font-normal text-gray-500">/kg</span></p>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                                                    {recommendation.marketPrice !== null && (
                                                        <p className="text-xs text-gray-500">Market: <span className="font-medium text-gray-700">₹{recommendation.marketPrice}/kg</span></p>
                                                    )}
                                                    {recommendation.avgNearbyPrice !== null && (
                                                        <p className="text-xs text-gray-500">Nearby avg: <span className="font-medium text-gray-700">₹{recommendation.avgNearbyPrice}/kg</span> ({recommendation.nearbyListingCount} listing{recommendation.nearbyListingCount > 1 ? 's' : ''})</p>
                                                    )}
                                                </div>
                                                {recommendation.demandLevel !== 'unknown' && (
                                                    <div className="flex items-center gap-1.5 mt-1.5">
                                                        <TrendingUp className={`w-3.5 h-3.5 ${recommendation.demandLevel === 'high' ? 'text-green-600' : recommendation.demandLevel === 'medium' ? 'text-yellow-600' : 'text-red-500'}`} />
                                                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                                                            recommendation.demandLevel === 'high' ? 'bg-green-100 text-green-700' :
                                                            recommendation.demandLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-red-100 text-red-600'
                                                        }`}>
                                                            {recommendation.demandLevel.charAt(0).toUpperCase() + recommendation.demandLevel.slice(1)} demand
                                                        </span>
                                                    </div>
                                                )}
                                            </>
                                        ) : recommendation.defaultPriceRange ? (
                                            <p className="text-lg font-semibold text-gray-700">₹{recommendation.defaultPriceRange.min} – ₹{recommendation.defaultPriceRange.max}<span className="text-sm font-normal text-gray-500">/kg</span></p>
                                        ) : null}
                                        <p className="text-[11px] text-gray-400 mt-1.5">{recommendation.message}</p>
                                    </div>
                                    {recommendation.recommendedPrice !== null && (
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, price: recommendation.recommendedPrice!.toString() })}
                                            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm flex-shrink-0"
                                        >
                                            {t('farmer.apply_suggestion')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    name="location"
                                    type="text"
                                    value={formData.location}
                                    onChange={handleChange}
                                    className="input-field pl-10"
                                    placeholder="Farm Location"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                            {error}
                        </div>
                    )}

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="flex-1 btn-secondary py-3"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] btn-primary py-3 flex justify-center items-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('farmer.create_listing')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
