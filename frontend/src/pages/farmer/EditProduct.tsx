import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { ArrowLeft, Upload, Loader2, MapPin, DollarSign, Package, Trash2 } from 'lucide-react';

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
                image: formData.image
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
                            {formData.image ? (
                                <img
                                    src={formData.image}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                />
                            ) : (
                                <div className="text-center p-6">
                                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm font-medium text-gray-900">Enter Image URL</p>
                                </div>
                            )}
                        </div>
                        <input
                            type="url"
                            name="image"
                            value={formData.image}
                            onChange={handleChange}
                            placeholder="https://example.com/image.jpg"
                            className="input-field text-sm py-2"
                            required
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
