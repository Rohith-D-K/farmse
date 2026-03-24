import React from 'react';
import { Minus, Plus, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getImageForCrop } from '../../utils/productImages';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

interface ProductCardProps {
    id: string;
    cropName: string;
    price: number;
    quantity: number;
    location: string;
    image: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ id, cropName, price, quantity, location, image }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t } = useTranslation();
    const { getItemQuantity, addToCart, updateQuantity } = useCart();
    const cartQuantity = getItemQuantity(id);

    const handleAddClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (quantity === 0) return;
        if (user?.role === 'buyer') {
            addToCart({ id, cropName, price, quantity, location, image }, 1);
            return;
        }
        navigate(`/product/${id}`);
    };

    const handleIncrease = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (quantity === 0 || user?.role !== 'buyer') return;
        addToCart({ id, cropName, price, quantity, location, image }, 1);
    };

    const handleDecrease = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (user?.role !== 'buyer') return;
        updateQuantity(id, cartQuantity - 1);
    };

    return (
        <div
            onClick={() => navigate(`/product/${id}`)}
            className="group relative bg-white overflow-hidden cursor-pointer transition-all duration-300 active:scale-[0.97]"
            style={{ borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}
        >
            {/* Image */}
            <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
                <img
                    src={image}
                    alt={cropName}
                    onError={(e) => { (e.target as HTMLImageElement).src = getImageForCrop(cropName); }}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Hover gradient */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: 'linear-gradient(to top, rgba(26,46,31,0.35), transparent)' }} />

                {/* Low-stock badge */}
                {quantity < 10 && quantity > 0 && (
                    <div className="absolute top-2 left-2 text-white text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: '#F5A623', fontFamily: 'var(--font-body)' }}>
                        Low Stock
                    </div>
                )}
                {/* Out of stock overlay */}
                {quantity === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center z-10"
                        style={{ background: 'rgba(249,246,240,0.82)', backdropFilter: 'blur(2px)' }}>
                        <span className="text-white text-xs font-bold px-3 py-1.5 rounded-full"
                            style={{ background: '#1A2E1F', fontFamily: 'var(--font-body)' }}>
                            {t('product.out_of_stock')}
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-3 flex flex-col gap-2">
                <div className="flex justify-between items-start gap-1">
                    <h3 className="font-medium text-farmse-dark text-sm leading-tight group-hover:text-farmse-green transition-colors line-clamp-1"
                        style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                        {t(`crops.${cropName}`, { defaultValue: cropName })}
                    </h3>
                    <div className="flex flex-col items-end flex-shrink-0">
                        <span className="font-bold text-farmse-green text-sm" style={{ fontFamily: 'var(--font-body)' }}>₹{price}</span>
                        <span className="text-[10px] text-farmse-muted">{t('product.per_kg')}</span>
                    </div>
                </div>

                <div className="flex items-center gap-1 text-farmse-muted text-xs">
                    <MapPin className="w-3 h-3 flex-shrink-0" strokeWidth={1.5} />
                    <span className="truncate">{location}</span>
                    <span className="whitespace-nowrap ml-auto">{quantity}{t('product.kg_left')}</span>
                </div>

                {/* Cart stepper / add button */}
                {user?.role === 'buyer' && cartQuantity > 0 ? (
                    <div
                        className="mt-1 w-full h-9 rounded-card border flex items-center overflow-hidden"
                        style={{ borderColor: '#F5A623', background: '#FFF3DC' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={handleDecrease}
                            className="h-full w-9 flex items-center justify-center transition-colors hover:bg-farmse-amber/20"
                            style={{ color: '#1A2E1F' }}
                            aria-label="Decrease quantity"
                        >
                            <Minus className="w-3.5 h-3.5" strokeWidth={2} />
                        </button>
                        <div className="flex-1 text-center font-bold text-sm" style={{ color: '#1A2E1F', fontFamily: 'var(--font-body)' }}>
                            {cartQuantity}
                        </div>
                        <button
                            onClick={handleIncrease}
                            disabled={cartQuantity >= quantity}
                            className="h-full w-9 flex items-center justify-center transition-colors hover:bg-farmse-amber/20 disabled:opacity-40"
                            style={{ color: '#1A2E1F' }}
                            aria-label="Increase quantity"
                        >
                            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleAddClick}
                        disabled={quantity === 0}
                        className="mt-1 w-full py-2 font-semibold rounded-card text-xs hover:opacity-90 active:scale-[0.97] transition-all duration-200 flex items-center justify-center gap-1.5"
                        style={{
                            background: quantity === 0 ? '#e5e7eb' : 'var(--color-green)',
                            color: quantity === 0 ? '#9ca3af' : 'white',
                            fontFamily: 'var(--font-body)',
                        }}
                    >
                        <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                        {t('common.add')}
                    </button>
                )}
            </div>
        </div>
    );
};
