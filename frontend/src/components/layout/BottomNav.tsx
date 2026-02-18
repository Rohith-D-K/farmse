import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Home, ShoppingBag, User, Store, PlusCircle, ListOrdered } from 'lucide-react';

export const BottomNav: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Don't show on auth pages or if no user
    if (!user || ['/login', '/register'].includes(location.pathname)) return null;

    const isActive = (path: string) => location.pathname === path;

    const navItemClass = (active: boolean) => `
        flex flex-col items-center justify-center w-full h-full space-y-1
        ${active ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'}
        transition-colors duration-200
    `;

    const iconClass = "w-6 h-6";
    const labelClass = "text-[10px] font-medium";

    if (user.role === 'buyer') {
        return (
            <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 md:hidden">
                <div className="grid grid-cols-4 h-full">
                    <button onClick={() => navigate('/marketplace')} className={navItemClass(isActive('/marketplace'))}>
                        <Store className={iconClass} />
                        <span className={labelClass}>Market</span>
                    </button>
                    <button onClick={() => navigate('/orders')} className={navItemClass(isActive('/orders'))}>
                        <ShoppingBag className={iconClass} />
                        <span className={labelClass}>Orders</span>
                    </button>
                    {/* Placeholder for Cart/Profile if we had separate main views for them. 
                        For now, let's assume 'Cart' might be a modal or separate page. 
                        We'll reuse 'Marketplace' as home.
                    */}
                    <button onClick={() => navigate('/checkout')} className={navItemClass(isActive('/checkout'))}>
                        <div className="relative">
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            <div className="w-6 h-6 border-2 border-current rounded-md flex items-center justify-center text-xs font-bold">₹</div>
                        </div>
                        <span className={labelClass}>Cart</span>
                    </button>
                    <button onClick={() => navigate('/profile')} className={navItemClass(isActive('/profile'))}>
                        <User className={iconClass} />
                        <span className={labelClass}>Profile</span>
                    </button>
                </div>
            </div>
        );
    }

    if (user.role === 'farmer') {
        return (
            <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 md:hidden">
                <div className="grid grid-cols-4 h-full">
                    <button onClick={() => navigate('/farmer/dashboard')} className={navItemClass(isActive('/farmer/dashboard'))}>
                        <Home className={iconClass} />
                        <span className={labelClass}>Home</span>
                    </button>
                    <button onClick={() => navigate('/farmer/add-product')} className={navItemClass(isActive('/farmer/add-product'))}>
                        <PlusCircle className={iconClass} />
                        <span className={labelClass}>Add</span>
                    </button>
                    <button onClick={() => navigate('/orders')} className={navItemClass(isActive('/orders'))}>
                        <ListOrdered className={iconClass} />
                        <span className={labelClass}>Orders</span>
                    </button>
                    <button onClick={() => navigate('/profile')} className={navItemClass(isActive('/profile'))}>
                        <User className={iconClass} />
                        <span className={labelClass}>Profile</span>
                    </button>
                </div>
            </div>
        );
    }

    return null;
};
