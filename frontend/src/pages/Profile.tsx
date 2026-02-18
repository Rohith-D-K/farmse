import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { User, MapPin, Phone, Mail, Edit2, Save, X, Package, ShoppingBag, LogOut } from 'lucide-react';

interface UserProfile {
    id: string;
    email: string;
    name: string;
    phone: string;
    location: string;
    role: 'farmer' | 'buyer';
    deliveryLocation?: string;
    createdAt: string;
}

interface OrderStats {
    total: number;
    pending: number;
    completed: number;
}

export const Profile: React.FC = () => {
    const { logout } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [orderStats, setOrderStats] = useState<OrderStats>({ total: 0, pending: 0, completed: 0 });
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        location: '',
        deliveryLocation: ''
    });

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        try {
            const [profileData, orders] = await Promise.all([
                api.users.getProfile(),
                api.orders.getAll()
            ]);

            setProfile(profileData);
            setFormData({
                name: profileData.name,
                phone: profileData.phone,
                location: profileData.location,
                deliveryLocation: profileData.deliveryLocation || ''
            });

            // Calculate order stats
            const stats = {
                total: orders.length,
                pending: orders.filter((o: any) => o.orderStatus === 'pending').length,
                completed: orders.filter((o: any) => o.orderStatus === 'completed').length
            };
            setOrderStats(stats);
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setFormData({
            name: profile?.name || '',
            phone: profile?.phone || '',
            location: profile?.location || '',
            deliveryLocation: profile?.deliveryLocation || ''
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const updatedProfile = await api.users.updateProfile({
                name: formData.name,
                phone: formData.phone,
                location: formData.location,
                deliveryLocation: formData.deliveryLocation
            });
            setProfile(updatedProfile);
            setIsEditing(false);
        } catch (error: any) {
            alert(error.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        if (confirm('Are you sure you want to logout?')) {
            await logout();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <p className="text-gray-600">Failed to load profile</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20 md:pb-0">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage your account information</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${profile.role === 'farmer'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700'
                    }`}>
                    {profile.role === 'farmer' ? '🌾 Farmer' : '🛒 Buyer'}
                </span>
            </div>

            {/* Profile Information Card */}
            <div className="card-premium p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-gray-900">Personal Information</h2>
                    {!isEditing ? (
                        <button
                            onClick={handleEdit}
                            className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                        >
                            <Edit2 className="w-4 h-4" />
                            Edit
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={handleCancel}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                            >
                                <X className="w-4 h-4" />
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <User className="w-4 h-4" />
                            Full Name
                        </label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="Enter your name"
                            />
                        ) : (
                            <p className="text-gray-900 font-medium px-4 py-3 bg-gray-50 rounded-lg">{profile.name}</p>
                        )}
                    </div>

                    {/* Email (Read-only) */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <Mail className="w-4 h-4" />
                            Email
                        </label>
                        <p className="text-gray-900 font-medium px-4 py-3 bg-gray-50 rounded-lg">{profile.email}</p>
                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <Phone className="w-4 h-4" />
                            Phone Number
                        </label>
                        {isEditing ? (
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="+91 98765 43210"
                            />
                        ) : (
                            <p className="text-gray-900 font-medium px-4 py-3 bg-gray-50 rounded-lg">{profile.phone}</p>
                        )}
                    </div>

                    {/* Location */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <MapPin className="w-4 h-4" />
                            Location
                        </label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="City, State"
                            />
                        ) : (
                            <p className="text-gray-900 font-medium px-4 py-3 bg-gray-50 rounded-lg">{profile.location}</p>
                        )}
                    </div>

                    {/* Delivery Location (Buyers only) */}
                    {profile.role === 'buyer' && (
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <MapPin className="w-4 h-4" />
                                Delivery Address
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.deliveryLocation}
                                    onChange={(e) => setFormData({ ...formData, deliveryLocation: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder="Full delivery address"
                                />
                            ) : (
                                <p className="text-gray-900 font-medium px-4 py-3 bg-gray-50 rounded-lg">
                                    {profile.deliveryLocation || 'Not set'}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Order Statistics */}
            <div className="card-premium p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Order Statistics</h2>
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="flex justify-center mb-2">
                            {profile.role === 'farmer' ? (
                                <Package className="w-6 h-6 text-blue-600" />
                            ) : (
                                <ShoppingBag className="w-6 h-6 text-blue-600" />
                            )}
                        </div>
                        <p className="text-2xl font-bold text-blue-600">{orderStats.total}</p>
                        <p className="text-xs text-gray-600 mt-1">Total Orders</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="flex justify-center mb-2">
                            <Package className="w-6 h-6 text-yellow-600" />
                        </div>
                        <p className="text-2xl font-bold text-yellow-600">{orderStats.pending}</p>
                        <p className="text-xs text-gray-600 mt-1">Pending</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="flex justify-center mb-2">
                            <Package className="w-6 h-6 text-green-600" />
                        </div>
                        <p className="text-2xl font-bold text-green-600">{orderStats.completed}</p>
                        <p className="text-xs text-gray-600 mt-1">Completed</p>
                    </div>
                </div>
            </div>

            {/* Account Actions */}
            <div className="card-premium p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Account Actions</h2>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
                >
                    <LogOut className="w-5 h-5" />
                    Logout
                </button>
            </div>

            {/* Account Info */}
            <div className="text-center text-sm text-gray-500">
                <p>Member since {new Date(profile.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric'
                })}</p>
            </div>
        </div>
    );
};
