import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const validate = (): boolean => {
        const errors: Record<string, string> = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim()) {
            errors.email = 'Email is required';
        } else if (!emailRegex.test(email.trim())) {
            errors.email = 'Enter a valid email address';
        }
        if (!password) {
            errors.password = 'Password is required';
        } else if (password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
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
            const user = await login(email, password);

            // Redirect based on role
            if (user.role === 'admin') {
                navigate('/admin/dashboard');
            } else if (user.role === 'farmer') {
                navigate('/farmer/dashboard');
            } else if (user.role === 'retailer') {
                navigate('/retailer/dashboard');
            } else {
                navigate('/marketplace');
            }
        } catch (err: any) {
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col justify-center py-12 px-6 lg:px-8 overflow-x-hidden">
            <div className="mx-auto w-full max-w-md">
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-xl shadow-green-500/20 transform -rotate-6">
                        F
                    </div>
                </div>
                <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
                    {t('auth.login_title')}
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Sign in to continue to <span className="text-green-600 font-bold">FarmSe</span>
                </p>
            </div>

            <div className="mt-10 mx-auto w-full max-w-[400px]">
                <form className="space-y-5" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100 flex gap-2 items-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 ml-1 mb-1">{t('auth.email')}</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: '' })); }}
                            className={`input-field ${fieldErrors.email ? 'ring-2 ring-red-400' : ''}`}
                            placeholder="you@example.com"
                        />
                        {fieldErrors.email && <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.email}</p>}
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1 ml-1">
                            <label className="block text-sm font-medium text-gray-700">{t('auth.password')}</label>
                            <div className="text-sm">
                                <a href="#" className="font-semibold text-green-600 hover:text-green-500">Forgot password?</a>
                            </div>
                        </div>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: '' })); }}
                            className={`input-field ${fieldErrors.password ? 'ring-2 ring-red-400' : ''}`}
                            placeholder="••••••••"
                        />
                        {fieldErrors.password && <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.password}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-lg shadow-green-500/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>{t('common.login')} <ArrowRight className="w-4 h-4 ml-2" /></>
                        )}
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-gray-500">
                    {t('auth.dont_have_account')}{' '}
                    <Link to="/register" className="font-semibold text-green-600 hover:text-green-500 transition-colors">
                        {t('common.register')}
                    </Link>
                </p>
            </div>
        </div>
    );
};
