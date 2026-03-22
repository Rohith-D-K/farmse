import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, type PriceRecommendation } from '../../lib/api';
import { ArrowLeft, Upload, Loader2, MapPin, DollarSign, Package, Trash2, Lightbulb, ImagePlus, X, TrendingUp } from 'lucide-react';
import { getImageForCrop } from '../../utils/productImages';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export const EditHarvest: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        cropName: '',
        basePricePerKg: '',
        estimatedQuantity: '',
        location: '',
        image: '',
        description: '',
        expectedHarvestDate: '',
        minPreorderQuantity: '',
        preorderDeadline: ''
    });
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [error, setError] = useState('');
    const [recommendation, setRecommendation] = useState<PriceRecommendation | null>(null);
    const [fetchedImage, setFetchedImage] = useState<string | null>(null);
    const [customImage, setCustomImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch harvest data
    useEffect(() => {
        const fetchHarvest = async () => {
            try {
                const harvest = await api.harvests.getById(id!);
                setFormData({
                    cropName: harvest.cropName,
                    basePricePerKg: harvest.basePricePerKg.toString(),
                    estimatedQuantity: harvest.estimatedQuantity.toString(),
                    location: harvest.location,
                    image: harvest.image,
                    description: harvest.description || '',
                    expectedHarvestDate: harvest.expectedHarvestDate.split('T')[0],
                    minPreorderQuantity: harvest.minPreorderQuantity.toString(),
                    preorderDeadline: harvest.preorderDeadline.split('T')[0]
                });
            } catch (err: any) {
                setError(err.message || 'Failed to load harvest');
            } finally {
                setFetchLoading(false);
            }
        };
        fetchHarvest();
    }, [id]);

    // Price recommendation and auto-resolve image
    useEffect(() => {
        if (formData.cropName.trim().length < 2) { setRecommendation(null); setFetchedImage(null); return; }
        const timer = setTimeout(async () => {
            try {
                const lat = user?.latitude ?? 20.5937;
                const lng = user?.longitude ?? 78.9629;
                const result = await api.price.recommend(formData.cropName.trim(), lat, lng);
                setRecommendation(result);
            } catch { setRecommendation(null); }

            if (!customImage) {
                const localImage = getImageForCrop(formData.cropName.trim());
                if (localImage === getImageForCrop('All')) {
                    try {
                        const imgResult = await api.products.cropImage(formData.cropName.trim());
                        setFetchedImage(imgResult.imageUrl || null);
                    } catch { setFetchedImage(null); }
                } else {
                    setFetchedImage(null);
                }
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [formData.cropName, customImage, user?.latitude, user?.longitude]);

    const resolvedImage = customImage || formData.image.trim() || fetchedImage || getImageForCrop(formData.cropName || 'All');

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = () => setCustomImage(reader.result as string);
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
            await api.harvests.update(id!, {
                cropName: formData.cropName,
                basePricePerKg: parseFloat(formData.basePricePerKg),
                estimatedQuantity: parseFloat(formData.estimatedQuantity),
                location: formData.location,
                image: resolvedImage,
                description: formData.description,
                expectedHarvestDate: formData.expectedHarvestDate,
                minPreorderQuantity: parseFloat(formData.minPreorderQuantity),
                preorderDeadline: formData.preorderDeadline,
                latitude: user?.latitude,
                longitude: user?.longitude
            });
            navigate('/farmer/dashboard');
        } catch (err: any) {
            setError(err.message || 'Failed to update harvest');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteHarvest = async () => {
        if (!confirm('Are you sure you want to delete this harvest listing?')) return;
        try {
            await api.harvests.delete(id!);
            navigate('/farmer/dashboard');
        } catch (error: any) {
            setError(error.message || 'Failed to delete');
        }
    };

    // Date limits
    const todayStr = new Date().toISOString().split('T')[0];
    let maxDeadlineStr = '';
    if (formData.expectedHarvestDate) {
        const expDate = new Date(formData.expectedHarvestDate);
        expDate.setDate(expDate.getDate() - 7);
        maxDeadlineStr = expDate.toISOString().split('T')[0];
    }

    if (fetchLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto pb-20 md:pb-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="md:hidden p-2 -ml-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Edit Harvest</h1>
                </div>
                <button onClick={handleDeleteHarvest} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Delete Harvest">
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>

            <div className="card-premium p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Image Section */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Harvest Image</label>
                        <div className="relative aspect-video rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center overflow-hidden hover:bg-gray-100 transition-colors group">
                            <img src={resolvedImage} alt="Preview" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = getImageForCrop(formData.cropName || 'All'); }} />
                            {customImage && (
                                <button type="button" onClick={clearCustomImage} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                                <ImagePlus className="w-4 h-4" /> Choose Image
                            </button>
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                            <input type="text" value={formData.image} onChange={(e) => { setFormData({...formData, image: e.target.value}); setCustomImage(null); }} placeholder="Or paste image URL..." className="input-field text-sm py-2 flex-1" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Crop Name</label>
                            <input name="cropName" value={formData.cropName} onChange={(e) => setFormData({...formData, cropName: e.target.value})} className="input-field" required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Base Price (₹/kg)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input name="basePricePerKg" type="number" step="0.01" value={formData.basePricePerKg} onChange={(e) => setFormData({...formData, basePricePerKg: e.target.value})} className="input-field pl-10" required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Est. Quantity (kg)</label>
                                <div className="relative">
                                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input name="estimatedQuantity" type="number" step="0.01" value={formData.estimatedQuantity} onChange={(e) => setFormData({...formData, estimatedQuantity: e.target.value})} className="input-field pl-10" required />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-orange-50 border border-orange-100 rounded-xl">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Expected Date</label>
                                <input name="expectedHarvestDate" type="date" value={formData.expectedHarvestDate} onChange={(e) => setFormData({...formData, expectedHarvestDate: e.target.value})} className="input-field py-2 text-sm" required />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Min Preorder (kg)</label>
                                <input name="minPreorderQuantity" type="number" step="0.01" value={formData.minPreorderQuantity} onChange={(e) => setFormData({...formData, minPreorderQuantity: e.target.value})} className="input-field py-2 text-sm" required />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Deadline Date</label>
                                <input name="preorderDeadline" type="date" min={todayStr} max={maxDeadlineStr || undefined} value={formData.preorderDeadline} onChange={(e) => setFormData({...formData, preorderDeadline: e.target.value})} className="input-field py-2 text-sm" required />
                            </div>
                        </div>
                    </div>

                    {recommendation && (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center gap-3">
                            <Lightbulb className="w-5 h-5 text-yellow-600" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-yellow-800">Recommendation: ₹{recommendation.recommendedPrice}/kg</p>
                                <p className="text-xs text-yellow-600">{recommendation.message}</p>
                            </div>
                            <button type="button" onClick={() => setFormData({...formData, basePricePerKg: recommendation.recommendedPrice!.toString()})} className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700">Apply</button>
                        </div>
                    )}

                    {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>{error}</div>}

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={() => navigate(-1)} className="flex-1 btn-secondary py-3">{t('common.cancel')}</button>
                        <button type="submit" disabled={loading} className="flex-[2] btn-primary py-3 flex justify-center items-center gap-2">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Harvest'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
