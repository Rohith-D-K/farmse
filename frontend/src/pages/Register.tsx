import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Tractor, ShoppingBag } from 'lucide-react';

export const Register: React.FC = () => {
    const [step, setStep] = useState(1);
    const [role, setRole] = useState<'farmer' | 'buyer'>('buyer');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        location: '',
        deliveryLocation: '',
        latitude: null as number | null,
        longitude: null as number | null
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [detectingLocation, setDetectingLocation] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (step !== 2 || !navigator.geolocation) {
            return;
        }

        setDetectingLocation(true);

        navigator.geolocation.getCurrentPosition(
            async ({ coords }) => {
                const latitude = Number(coords.latitude.toFixed(6));
                const longitude = Number(coords.longitude.toFixed(6));

                let detectedLocation = `Lat ${latitude.toFixed(4)}, Lng ${longitude.toFixed(4)}`;

                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
                        { headers: { Accept: 'application/json' } }
                    );

                    if (response.ok) {
                        const reverseData = await response.json() as any;
                        const address = reverseData?.address;
                        const city = address?.city || address?.town || address?.village || address?.state_district;
                        const state = address?.state;

                        if (city && state) {
                            detectedLocation = `${city}, ${state}`;
                        } else if (city) {
                            detectedLocation = city;
                        }
                    }
                } catch {
                    // Use coordinate fallback if reverse geocoding fails
                }

                setFormData(prev => ({
                    ...prev,
                    location: prev.location || detectedLocation,
                    deliveryLocation: role === 'buyer' ? (prev.deliveryLocation || detectedLocation) : prev.deliveryLocation,
                    latitude,
                    longitude
                }));
                setDetectingLocation(false);
            },
            () => {
                setDetectingLocation(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            }
        );
    }, [step, role]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
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
                    longitude: formData.longitude ?? undefined
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
        <div className="min-h-screen bg-white flex flex-col justify-center py-12 px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8">
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-xl shadow-green-500/20 transform -rotate-6">
                        F
                    </div>
                </div>
                <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
                    Create your account
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Join the community of fresh produce
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[400px]">
                {/* Role Selection Step */}
                {step === 1 && (
                    <div className="space-y-4">
                        <p className="text-center text-sm font-medium text-gray-900 mb-4">I want to join as a...</p>

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
                                <p className={`font-bold ${role === 'buyer' ? 'text-green-900' : 'text-gray-900'}`}>Buyer</p>
                                <p className="text-xs text-gray-500">I want to buy fresh produce</p>
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
                                <p className={`font-bold ${role === 'farmer' ? 'text-green-900' : 'text-gray-900'}`}>Farmer</p>
                                <p className="text-xs text-gray-500">I want to sell my harvest</p>
                            </div>
                        </button>

                        <button
                            onClick={() => setStep(2)}
                            className="w-full mt-6 py-3.5 rounded-xl bg-gray-900 text-white font-bold hover:bg-black transition-all active:scale-[0.98]"
                        >
                            Continue
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
                                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">Full Name</label>
                                <input name="name" type="text" required value={formData.name} onChange={handleChange} className="input-field py-2.5" placeholder="John Doe" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">Phone</label>
                                <input name="phone" type="tel" required value={formData.phone} onChange={handleChange} className="input-field py-2.5" placeholder="+91..." />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">Email</label>
                            <input name="email" type="email" required value={formData.email} onChange={handleChange} className="input-field py-2.5" placeholder="you@example.com" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">Password</label>
                            <input name="password" type="password" required value={formData.password} onChange={handleChange} className="input-field py-2.5" placeholder="••••••••" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">Location {role === 'farmer' ? '(Farm Area)' : '(City)'}</label>
                            <input name="location" type="text" required value={formData.location} onChange={handleChange} className="input-field py-2.5" placeholder={role === 'farmer' ? 'Punjab, India' : 'Delhi, India'} />
                            {detectingLocation && (
                                <p className="text-[11px] text-green-700 mt-1 ml-1">Detecting current location...</p>
                            )}
                        </div>

                        {role === 'buyer' && (
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">Delivery Address</label>
                                <input name="deliveryLocation" type="text" required value={formData.deliveryLocation} onChange={handleChange} className="input-field py-2.5" placeholder="House No, Street, Landmark..." />
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
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                            </button>
                        </div>
                    </form>
                )}

                <p className="mt-8 text-center text-sm text-gray-500">
                    Already have an account?{' '}
                    <Link to="/login" className="font-semibold text-green-600 hover:text-green-500 transition-colors">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
};
