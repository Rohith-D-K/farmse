import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { User, MapPin, Phone, Mail, Edit2, Save, X, Package, ShoppingBag, LogOut } from 'lucide-react';
import { LocationPicker } from '../components/ui/LocationPicker';
import { useTranslation } from 'react-i18next';

interface UserProfile {
    id: string;
    email: string;
    name: string;
    phone: string;
    location: string;
    role: 'farmer' | 'buyer' | 'admin' | 'retailer';
    deliveryLocation?: string;
    latitude?: number | null;
    longitude?: number | null;
    createdAt: string;
}

interface OrderStats {
    total: number;
    pending: number;
    completed: number;
}

export const Profile: React.FC = () => {
    const { logout } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [retailerProfile, setRetailerProfile] = useState<any>(null);
    const [orderStats, setOrderStats] = useState<OrderStats>({ total: 0, pending: 0, completed: 0 });
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        location: '',
        deliveryLocation: '',
        latitude: null as number | null,
        longitude: null as number | null
    });

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        try {
            const [profileData, ordersData] = await Promise.all([
                api.users.getProfile(),
                api.orders.getAll()
            ]);

            setProfile(profileData);
            setFormData({
                name: profileData.name,
                phone: profileData.phone,
                location: profileData.location,
                deliveryLocation: profileData.deliveryLocation || '',
                latitude: profileData.latitude ?? null,
                longitude: profileData.longitude ?? null
            });

            // Calculate order stats
            const stats = {
                total: ordersData.length,
                pending: ordersData.filter((o: any) => o.orderStatus === 'pending').length,
                completed: ordersData.filter((o: any) => o.orderStatus === 'completed').length
            };
            setOrderStats(stats);

            // Fetch retailer status if buyer or retailer
            if (profileData.role === 'buyer' || profileData.role === 'retailer') {
                try {
                    const rProfile = await api.retailerProfile.getStatus();
                    setRetailerProfile(rProfile);
                } catch (e) {
                    setRetailerProfile(null);
                }
            }
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
            deliveryLocation: profile?.deliveryLocation || '',
            latitude: profile?.latitude ?? null,
            longitude: profile?.longitude ?? null
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const updatedProfile = await api.users.updateProfile({
                name: formData.name,
                phone: formData.phone,
                location: formData.location,
                deliveryLocation: formData.deliveryLocation,
                latitude: formData.latitude ?? undefined,
                longitude: formData.longitude ?? undefined
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

    const handleConvertBackToBuyer = async () => {
        if (!confirm('Are you sure you want to convert back to a regular buyer? Your business details will be permanently deleted.')) return;
        try {
            setSaving(true);
            await api.retailerProfile.delete();
            setRetailerProfile(null);
            alert('You are now a normal buyer.');
        } catch (error: any) {
            alert(error.message || 'Failed to delete retailer profile');
        } finally {
            setSaving(false);
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
                    <h1 className="text-2xl font-bold text-gray-900">{t('profile.title')}</h1>
                    <p className="text-sm text-gray-500 mt-1">{t('profile.manage_account')}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${profile.role === 'farmer'
                    ? 'bg-green-100 text-green-700'
                    : profile.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                    {profile.role === 'farmer' ? '🌾 Farmer' : profile.role === 'admin' ? '🛡️ Admin' : '🛒 Buyer'}
                </span>
            </div>

            {/* Profile Information Card */}
            <div className="card-premium p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-gray-900">{t('profile.personal_info')}</h2>
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
                            {t('profile.full_name')}
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
                            {t('profile.email')}
                        </label>
                        <p className="text-gray-900 font-medium px-4 py-3 bg-gray-50 rounded-lg">{profile.email}</p>
                        <p className="text-xs text-gray-500 mt-1">{t('profile.email_no_change')}</p>
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <Phone className="w-4 h-4" />
                            {t('profile.phone')}
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
                        {isEditing ? (
                            <LocationPicker
                                label="Location"
                                value={formData.location}
                                latitude={formData.latitude}
                                longitude={formData.longitude}
                                onChange={(loc, lat, lng) => setFormData(prev => ({ ...prev, location: loc, latitude: lat, longitude: lng }))}
                                placeholder="Search your location..."
                            />
                        ) : (
                            <>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <MapPin className="w-4 h-4" />
                                    Location
                                </label>
                                <p className="text-gray-900 font-medium px-4 py-3 bg-gray-50 rounded-lg">{profile.location}</p>
                            </>
                        )}
                    </div>

                    {/* Delivery Location (Buyers/Retailers only) */}
                    {(profile.role === 'buyer' || profile.role === 'retailer') && (
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <MapPin className="w-4 h-4" />
                                {t('profile.delivery_address')}
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
                                    {profile.deliveryLocation || t('profile.not_set')}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Order Statistics */}
            <div className="card-premium p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">{t('profile.order_stats')}</h2>
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
                        <p className="text-xs text-gray-600 mt-1">{t('profile.total_orders')}</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="flex justify-center mb-2">
                            <Package className="w-6 h-6 text-yellow-600" />
                        </div>
                        <p className="text-2xl font-bold text-yellow-600">{orderStats.pending}</p>
                        <p className="text-xs text-gray-600 mt-1">{t('profile.pending')}</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="flex justify-center mb-2">
                            <Package className="w-6 h-6 text-green-600" />
                        </div>
                        <p className="text-2xl font-bold text-green-600">{orderStats.completed}</p>
                        <p className="text-xs text-gray-600 mt-1">{t('profile.completed')}</p>
                    </div>
                </div>
            </div>

            {/* Retailer Status Card (Buyers/Retailers only) */}
            {(profile.role === 'buyer' || profile.role === 'retailer') && (
                <div className="card-premium p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900">Retailer Status</h2>
                        <div className="flex items-center gap-2">
                             {!retailerProfile ? (
                                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold ring-1 ring-gray-200">
                                    Normal Buyer
                                </span>
                             ) : retailerProfile.verificationStatus === 'verified' ? (
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold ring-1 ring-green-200 flex items-center gap-1">
                                    <ShoppingBag className="w-3 h-3" />
                                    Verified Retailer
                                </span>
                             ) : retailerProfile.verificationStatus === 'pending' ? (
                                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold ring-1 ring-amber-200">
                                    Pending Verification
                                </span>
                             ) : (
                                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold ring-1 ring-red-200">
                                    Application Rejected
                                </span>
                             )}
                        </div>
                    </div>

                    {!retailerProfile ? (
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                                Are you a business owner? Register as a retailer to unlock <strong>bulk discounts (up to 20%)</strong> and <strong>priority delivery</strong> on large orders.
                            </p>
                            <button
                                onClick={() => navigate('/marketplace')}
                                className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors text-sm shadow-sm"
                            >
                                Register on Marketplace
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Business Name</p>
                                    <p className="text-sm font-bold text-gray-700">{retailerProfile.businessName}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</p>
                                    <p className="text-sm font-bold text-gray-500 uppercase">{retailerProfile.businessType}</p>
                                </div>
                            </div>
                            {retailerProfile.verificationStatus === 'rejected' && (
                                <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                                    <p className="text-xs font-bold text-red-800 uppercase mb-1">Reason for Rejection</p>
                                    <p className="text-sm text-red-700">{retailerProfile.adminNotes || 'No notes provided by admin.'}</p>
                                </div>
                            )}
                            {retailerProfile.verificationStatus === 'pending' && (
                                <p className="text-xs text-amber-700 font-medium italic">
                                    * Your details are being reviewed. You can still place normal orders in the meantime.
                                </p>
                            )}
                            {retailerProfile.verificationStatus === 'verified' && (
                                <p className="text-xs text-green-700 font-medium">
                                    * You are now eligible for bulk discounts and priority delivery!
                                </p>
                            )}

                            <div className="pt-4 border-t border-gray-100">
                                <button
                                    onClick={handleConvertBackToBuyer}
                                    disabled={saving}
                                    className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors uppercase flex items-center gap-1"
                                >
                                    <X className="w-3 h-3" />
                                    Convert back to regular buyer
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Account Actions */}
            <div className="card-premium p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">{t('profile.account_actions')}</h2>
                {(profile.role === 'buyer' || profile.role === 'retailer') && (
                    <button
                        onClick={() => navigate('/help')}
                        className="w-full mb-3 flex items-center justify-center gap-2 px-6 py-3 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors font-medium"
                    >
                        {t('profile.report_help')}
                    </button>
                )}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
                >
                    <LogOut className="w-5 h-5" />
                    {t('common.logout')}
                </button>
            </div>

            {/* Account Info */}
            <div className="text-center text-sm text-gray-500">
                <p>{t('profile.member_since')} {new Date(profile.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric'
                })}</p>
            </div>
        </div>
    );
};
