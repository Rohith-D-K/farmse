import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Tractor, ShoppingBag } from 'lucide-react';
import { LocationPicker } from '../components/ui/LocationPicker';
import { useTranslation } from 'react-i18next';

export const Register: React.FC = () => {
    const [step, setStep] = useState(1);
    const [role, setRole] = useState<'farmer' | 'buyer' | 'retailer'>('buyer');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        location: '',
        deliveryLocation: '',
        latitude: null as number | null,
        longitude: null as number | null,
        businessName: '',
        businessType: '',
        licenseNumber: ''
    });
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        // Phone: allow only digits and +
        if (name === 'phone') {
            const cleaned = value.replace(/[^0-9+]/g, '');
            setFormData(prev => ({ ...prev, phone: cleaned }));
        } else if (name === 'name') {
            // Name: allow letters, spaces, dots, hyphens
            const cleaned = value.replace(/[^a-zA-Z\s.\-']/g, '');
            setFormData(prev => ({ ...prev, name: cleaned }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        setFieldErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validate = (): boolean => {
        const errors: Record<string, string> = {};
        if (!formData.name.trim() || formData.name.trim().length < 2) {
            errors.name = 'Name must be at least 2 characters';
        }
        const phoneDigits = formData.phone.replace(/\+/g, '');
        if (!phoneDigits || phoneDigits.length < 10) {
            errors.phone = 'Enter a valid 10-digit phone number';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!emailRegex.test(formData.email.trim())) {
            errors.email = 'Enter a valid email address';
        }
        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }
        if (!formData.location.trim()) {
            errors.location = 'Location is required';
        }
        if (role === 'buyer' && !formData.deliveryLocation.trim()) {
            errors.deliveryLocation = 'Delivery address is required';
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!validate()) return;
        setLoading(true);

        try {
            const user = await register(
                formData.email,
                formData.password,
                {
                    name: formData.name,
                    phone: formData.phone,
                    location: formData.location,
                    role: role,
                    deliveryLocation: role === 'buyer' ? formData.deliveryLocation : undefined,
                    latitude: formData.latitude ?? undefined,
                    longitude: formData.longitude ?? undefined,
                    businessName: role === 'retailer' ? formData.businessName : undefined,
                    businessType: role === 'retailer' ? formData.businessType : undefined,
                    licenseNumber: role === 'retailer' ? formData.licenseNumber : undefined,
                }
            );

            if (user.role === 'farmer') {
                navigate('/farmer/dashboard');
            } else if (user.role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/marketplace');
            }
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col justify-center py-12 px-6 lg:px-8 overflow-x-hidden">
            <div className="mx-auto w-full max-w-md mb-8">
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-xl shadow-green-500/20 transform -rotate-6">
                        F
                    </div>
                </div>
                <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
                    {t('auth.create_account')}
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    {t('auth.join_community')}
                </p>
            </div>

            <div className="mt-8 mx-auto w-full max-w-[400px]">
                {/* Role Selection Step */}
                {step === 1 && (
                    <div className="space-y-4">
                        <p className="text-center text-sm font-medium text-gray-900 mb-4">{t('auth.join_as')}</p>

                        <button
                            onClick={() => setRole('buyer')}
                            className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all duration-200 ${role === 'buyer'
                                ? 'border-green-600 bg-green-50 shadow-md ring-1 ring-green-600'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${role === 'buyer' ? 'bg-green-200 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                                <ShoppingBag className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <p className={`font-bold ${role === 'buyer' ? 'text-green-900' : 'text-gray-900'}`}>{t('auth.buyer')}</p>
                                <p className="text-xs text-gray-500">{t('auth.buyer_desc')}</p>
                            </div>
                        </button>

                        <button
                            onClick={() => setRole('farmer')}
                            className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all duration-200 ${role === 'farmer'
                                ? 'border-green-600 bg-green-50 shadow-md ring-1 ring-green-600'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${role === 'farmer' ? 'bg-green-200 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                                <Tractor className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <p className={`font-bold ${role === 'farmer' ? 'text-green-900' : 'text-gray-900'}`}>{t('auth.farmer')}</p>
                                <p className="text-xs text-gray-500">{t('auth.farmer_desc')}</p>
                            </div>
                        </button>

                        <button
                            onClick={() => setRole('retailer')}
                            className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all duration-200 ${role === 'retailer'
                                ? 'border-green-600 bg-green-50 shadow-md ring-1 ring-green-600'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${role === 'retailer' ? 'bg-green-200 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                                <ShoppingBag className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <p className={`font-bold ${role === 'retailer' ? 'text-green-900' : 'text-gray-900'}`}>Retailer (Bulk Buyer)</p>
                                <p className="text-xs text-gray-500">Buy in bulk for your shop or restaurant</p>
                            </div>
                        </button>

                        <button
                            onClick={() => setStep(2)}
                            className="w-full mt-6 py-3.5 rounded-xl bg-gray-900 text-white font-bold hover:bg-black transition-all active:scale-[0.98]"
                        >
                            {t('auth.continue')}
                        </button>
                    </div>
                )}

                {/* Form Step */}
                {step === 2 && (
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">{t('auth.name')}</label>
                                <input name="name" type="text" required value={formData.name} onChange={handleChange} className={`input-field py-2.5 ${fieldErrors.name ? 'ring-2 ring-red-400' : ''}`} placeholder="John Doe" />
                                {fieldErrors.name && <p className="text-red-500 text-[10px] mt-0.5 ml-1">{fieldErrors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">{t('auth.phone')}</label>
                                <input name="phone" type="tel" required value={formData.phone} onChange={handleChange} className={`input-field py-2.5 ${fieldErrors.phone ? 'ring-2 ring-red-400' : ''}`} placeholder="+91..." inputMode="tel" />
                                {fieldErrors.phone && <p className="text-red-500 text-[10px] mt-0.5 ml-1">{fieldErrors.phone}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">{t('auth.email')}</label>
                            <input name="email" type="email" required value={formData.email} onChange={handleChange} className={`input-field py-2.5 ${fieldErrors.email ? 'ring-2 ring-red-400' : ''}`} placeholder="you@example.com" />
                            {fieldErrors.email && <p className="text-red-500 text-[10px] mt-0.5 ml-1">{fieldErrors.email}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">{t('auth.password')}</label>
                            <input name="password" type="password" required value={formData.password} onChange={handleChange} className={`input-field py-2.5 ${fieldErrors.password ? 'ring-2 ring-red-400' : ''}`} placeholder="•••••••• (min 6 chars)" />
                            {fieldErrors.password && <p className="text-red-500 text-[10px] mt-0.5 ml-1">{fieldErrors.password}</p>}
                        </div>

                        <div>
                            <LocationPicker
                                label={role === 'farmer' ? t('auth.location_farm') : t('auth.location_city')}
                                value={formData.location}
                                latitude={formData.latitude}
                                longitude={formData.longitude}
                                onChange={(loc, lat, lng) => setFormData(prev => ({
                                    ...prev,
                                    location: loc,
                                    latitude: lat,
                                    longitude: lng,
                                }))}
                                placeholder={role === 'farmer' ? t('auth.search_farm') : t('auth.search_city')}
                                required
                            />
                        </div>

                        {role === 'buyer' && (
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">{t('auth.delivery_address')}</label>
                                <input name="deliveryLocation" type="text" required value={formData.deliveryLocation} onChange={handleChange} className={`input-field py-2.5 ${fieldErrors.deliveryLocation ? 'ring-2 ring-red-400' : ''}`} placeholder="House No, Street, Landmark..." />
                                {fieldErrors.deliveryLocation && <p className="text-red-500 text-[10px] mt-0.5 ml-1">{fieldErrors.deliveryLocation}</p>}
                            </div>
                        )}

                        {role === 'retailer' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">Business Name</label>
                                    <input name="businessName" type="text" required value={formData.businessName} onChange={handleChange} className={`input-field py-2.5`} placeholder="Company / Shop Name" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">Business Type</label>
                                        <select name="businessType" required value={formData.businessType} onChange={(e: any) => handleChange(e)} className={`input-field py-2.5`}>
                                            <option value="">Select Type</option>
                                            <option value="shop">Shop</option>
                                            <option value="restaurant">Restaurant</option>
                                            <option value="hotel">Hotel</option>
                                            <option value="vendor">Vendor</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">License / ID</label>
                                        <input name="licenseNumber" type="text" required value={formData.licenseNumber} onChange={handleChange} className={`input-field py-2.5`} placeholder="FSSAI / GST No." />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">{t('auth.delivery_address')}</label>
                                    <input name="deliveryLocation" type="text" required value={formData.deliveryLocation} onChange={handleChange} className={`input-field py-2.5`} placeholder="Business Delivery Address" />
                                </div>
                            </div>
                        )}

                        <div className="pt-2 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-all font-medium"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-[2] py-3.5 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 shadow-lg shadow-green-500/30 transition-all active:scale-[0.98] flex justify-center items-center"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('auth.create_account')}
                            </button>
                        </div>
                    </form>
                )}

                <p className="mt-8 text-center text-sm text-gray-500">
                    {t('auth.already_have_account')}{' '}
                    <Link to="/login" className="font-semibold text-green-600 hover:text-green-500 transition-colors">
                        {t('auth.sign_in')}
                    </Link>
                </p>
            </div>
        </div>
    );
};
