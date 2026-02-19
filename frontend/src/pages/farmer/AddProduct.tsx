import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { ArrowLeft, Upload, Loader2, MapPin, DollarSign, Package } from 'lucide-react';
import { getImageForCrop } from '../../utils/productImages';

export const AddProduct: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        cropName: '',
        price: '',
        quantity: '',
        location: user?.location || '',
        image: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const resolvedImage = formData.image.trim() || getImageForCrop(formData.cropName || 'All');

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
                image: resolvedImage
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
                <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
            </div>

            <div className="card-premium p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Image Upload Preview */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Product Image</label>
                        <div className="relative aspect-video rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center overflow-hidden hover:bg-gray-100 transition-colors group">
                            {formData.image ? (
                                <img
                                    src={resolvedImage}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.src = getImageForCrop(formData.cropName || 'All');
                                    }}
                                />
                            ) : (
                                <div className="text-center p-6">
                                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-gray-300 transition-colors">
                                        <Upload className="w-6 h-6 text-gray-500" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-900">Image is auto-selected from crop name</p>
                                    <p className="text-xs text-gray-500">Optionally override with a custom path</p>
                                </div>
                            )}
                        </div>
                        <input
                            type="text"
                            name="image"
                            value={formData.image}
                            onChange={handleChange}
                            placeholder="Optional: /produce/tomato.jpg or https://..."
                            className="input-field text-sm py-2"
                        />
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
                                placeholder="e.g. Fresh Tomatoes"
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
                                        placeholder="0.00"
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
                                        placeholder="0"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

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
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] btn-primary py-3 flex justify-center items-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Listing'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
