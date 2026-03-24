import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { Home, ShoppingBag, User, Store, PlusCircle, ListOrdered, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const BottomNav: React.FC = () => {
    const { user } = useAuth();
    const { getTotalItems } = useCart();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const cartItemCount = getTotalItems();

    // Don't show on auth pages or if no user
    if (!user || ['/login', '/register'].includes(location.pathname)) return null;

    const isActive = (path: string) => location.pathname === path;

    const navItemClass = (active: boolean) => `
        flex flex-col items-center justify-center w-full h-full gap-1
        relative transition-all duration-200
        ${active ? 'text-farmse-green' : 'text-gray-400 hover:text-farmse-muted'}
    `;

    const iconClass = "w-5 h-5";
    const labelClass = "text-[10px] font-medium tracking-wide";

    // Active indicator dot
    const ActiveDot = () => (
        <span className="absolute top-1 right-1/2 translate-x-1/2 w-1 h-1 rounded-full bg-farmse-green" />
    );

    if (user.role === 'buyer' || user.role === 'retailer') {
        return (
            <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-bottom"
                style={{
                    background: 'rgba(249,246,240,0.95)',
                    backdropFilter: 'blur(14px)',
                    WebkitBackdropFilter: 'blur(14px)',
                    borderTop: '1px solid rgba(45,122,79,0.10)',
                    boxShadow: '0 -4px 24px rgba(45,122,79,0.08)',
                    fontFamily: 'var(--font-body)',
                }}>
                <div className="grid grid-cols-5 h-16">
                    <button onClick={() => navigate('/marketplace')} className={navItemClass(isActive('/marketplace'))}>
                        {isActive('/marketplace') && <ActiveDot />}
                        <Store className={iconClass} strokeWidth={1.5} />
                        <span className={labelClass}>{t('common.marketplace')}</span>
                    </button>

                    <button id="tour-orders-btn" onClick={() => navigate('/orders')} className={navItemClass(isActive('/orders'))}>
                        {isActive('/orders') && <ActiveDot />}
                        <ShoppingBag className={iconClass} strokeWidth={1.5} />
                        <span className={labelClass}>{t('common.orders')}</span>
                    </button>

                    <button id="tour-chat-btn" onClick={() => navigate('/messages')} className={navItemClass(isActive('/messages'))}>
                        {isActive('/messages') && <ActiveDot />}
                        <MessageSquare className={iconClass} strokeWidth={1.5} />
                        <span className={labelClass}>{t('common.chats')}</span>
                    </button>

                    {/* Cart button with amber badge */}
                    <button id="tour-cart-btn" onClick={() => navigate('/checkout')} className={navItemClass(isActive('/checkout'))}>
                        {isActive('/checkout') && <ActiveDot />}
                        <div className="relative">
                            {cartItemCount > 0 && (
                                <span className="absolute -top-2 -right-2 min-w-[16px] h-4 px-0.5 text-white text-[9px] font-bold rounded-full flex items-center justify-center"
                                    style={{ background: '#F5A623' }}>
                                    {cartItemCount}
                                </span>
                            )}
                            <ShoppingBag className={iconClass} strokeWidth={1.5} />
                        </div>
                        <span className={labelClass}>{t('common.cart')}</span>
                    </button>

                    <button onClick={() => navigate('/profile')} className={navItemClass(isActive('/profile'))}>
                        {isActive('/profile') && <ActiveDot />}
                        <User className={iconClass} strokeWidth={1.5} />
                        <span className={labelClass}>{t('common.profile')}</span>
                    </button>
                </div>
            </div>
        );
    }

    if (user.role === 'farmer') {
        return (
            <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-bottom"
                style={{
                    background: 'rgba(249,246,240,0.95)',
                    backdropFilter: 'blur(14px)',
                    WebkitBackdropFilter: 'blur(14px)',
                    borderTop: '1px solid rgba(45,122,79,0.10)',
                    boxShadow: '0 -4px 24px rgba(45,122,79,0.08)',
                    fontFamily: 'var(--font-body)',
                }}>
                <div className="grid grid-cols-5 h-16">
                    <button onClick={() => navigate('/farmer/dashboard')} className={navItemClass(isActive('/farmer/dashboard'))}>
                        {isActive('/farmer/dashboard') && <ActiveDot />}
                        <Home className={iconClass} strokeWidth={1.5} />
                        <span className={labelClass}>{t('common.home')}</span>
                    </button>

                    <button onClick={() => navigate('/farmer/add-product')} className={navItemClass(isActive('/farmer/add-product'))}>
                        {isActive('/farmer/add-product') && <ActiveDot />}
                        <PlusCircle className={iconClass} strokeWidth={1.5} />
                        <span className={labelClass}>{t('common.add')}</span>
                    </button>

                    <button id="tour-orders-btn" onClick={() => navigate('/orders')} className={navItemClass(isActive('/orders'))}>
                        {isActive('/orders') && <ActiveDot />}
                        <ListOrdered className={iconClass} strokeWidth={1.5} />
                        <span className={labelClass}>{t('common.orders')}</span>
                    </button>

                    <button id="tour-chat-btn" onClick={() => navigate('/messages')} className={navItemClass(isActive('/messages'))}>
                        {isActive('/messages') && <ActiveDot />}
                        <MessageSquare className={iconClass} strokeWidth={1.5} />
                        <span className={labelClass}>{t('common.chats')}</span>
                    </button>

                    <button onClick={() => navigate('/profile')} className={navItemClass(isActive('/profile'))}>
                        {isActive('/profile') && <ActiveDot />}
                        <User className={iconClass} strokeWidth={1.5} />
                        <span className={labelClass}>{t('common.profile')}</span>
                    </button>
                </div>
            </div>
        );
    }

    return null;
};
