import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { ArrowLeft, Upload, Loader2, MapPin, DollarSign, Package, Trash2, Lightbulb, ImagePlus, X } from 'lucide-react';
import { getImageForCrop } from '../../utils/productImages';

export const EditProduct: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        cropName: '',
        price: '',
        quantity: '',
        location: '',
        image: ''
    });
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [error, setError] = useState('');
    const [fetchedImage, setFetchedImage] = useState<string | null>(null);
    const [suggestedPrice, setSuggestedPrice] = useState<number | null>(null);
    const [priceRange, setPriceRange] = useState<{ min: number; max: number; count: number } | null>(null);
    const [customImage, setCustomImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-resolve image and price suggestion when crop name changes
    useEffect(() => {
        if (formData.cropName.trim().length < 2) { setFetchedImage(null); setSuggestedPrice(null); setPriceRange(null); return; }
        const timer = setTimeout(async () => {
            if (!customImage) {
                const localImage = getImageForCrop(formData.cropName.trim());
                const defaultImage = getImageForCrop('All');
                if (localImage !== defaultImage) {
                    setFetchedImage(null);
                } else {
                    try {
                        const imgResult = await api.products.cropImage(formData.cropName.trim());
                        setFetchedImage(imgResult.imageUrl || null);
                    } catch { setFetchedImage(null); }
                }
            }
            // Price suggestion
            try {
                const result = await api.products.suggestPrice(formData.cropName.trim());
                setSuggestedPrice(result.suggestedPrice);
                if (result.minPrice != null && result.maxPrice != null && result.count) {
                    setPriceRange({ min: result.minPrice, max: result.maxPrice, count: result.count });
                } else {
                    setPriceRange(null);
                }
            } catch {
                setSuggestedPrice(null);
                setPriceRange(null);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [formData.cropName, customImage]);

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

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const product = await api.products.getById(id!);
                setFormData({
                    cropName: product.cropName,
                    price: product.price.toString(),
                    quantity: product.quantity.toString(),
                    location: product.location,
                    image: product.image
                });
            } catch (err: any) {
                setError(err.message || 'Failed to load product');
            } finally {
                setFetchLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.products.update(id!, {
                cropName: formData.cropName,
                price: parseFloat(formData.price),
                quantity: parseInt(formData.quantity),
                location: formData.location,
                image: customImage || formData.image.trim() || fetchedImage || getImageForCrop(formData.cropName || 'All')
            });
            navigate('/farmer/dashboard');
        } catch (err: any) {
            setError(err.message || 'Failed to update product');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this listing?')) return;
        try {
            await api.products.delete(id!);
            navigate('/farmer/dashboard');
        } catch (error: any) {
            setError(error.message || 'Failed to delete');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

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
                    <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
                </div>
                <button onClick={handleDelete} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Delete Product">
                    <Trash2 className="w-5 h-5" />
                </button>
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
                                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm font-medium text-gray-900">Image is auto-selected from crop name</p>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Crop Name</label>
                            <input
                                name="cropName"
                                type="text"
                                value={formData.cropName}
                                onChange={handleChange}
                                className="input-field"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (₹/kg)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        name="price"
                                        type="number"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={handleChange}
                                        className="input-field pl-10"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantity (kg)</label>
                                <div className="relative">
                                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        name="quantity"
                                        type="number"
                                        value={formData.quantity}
                                        onChange={handleChange}
                                        className="input-field pl-10"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Dynamic Price Suggestion Box */}
                        {suggestedPrice !== null && (
                            <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                                        <Lightbulb className="w-5 h-5 text-yellow-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-yellow-800 uppercase tracking-wider mb-1">Suggested Price</p>
                                        <p className="text-2xl font-bold text-green-700">₹{suggestedPrice}<span className="text-sm font-normal text-gray-500">/kg</span></p>
                                        {priceRange && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Market range: ₹{priceRange.min}–₹{priceRange.max}/kg from {priceRange.count} listing{priceRange.count > 1 ? 's' : ''} within 200km
                                            </p>
                                        )}
                                        <p className="text-[11px] text-gray-400 mt-1">Based on similar products near your location</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, price: suggestedPrice.toString() })}
                                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm flex-shrink-0"
                                    >
                                        Apply
                                    </button>
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
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/farmer/dashboard')}
                            className="flex-1 btn-secondary py-3"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] btn-primary py-3 flex justify-center items-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
