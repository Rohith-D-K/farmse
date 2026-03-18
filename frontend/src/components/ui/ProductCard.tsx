import React from 'react';
import { Minus, Plus } from 'lucide-react';
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
            className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-all duration-300 active:scale-[0.98]"
        >
            {/* Image Container with Aspect Ratio */}
            <div className="relative aspect-[4/3] overflow-hidden">
                <img
                    src={image}
                    alt={cropName}
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = getImageForCrop(cropName);
                    }}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Status Badges */}
                {quantity < 10 && quantity > 0 && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                        {t('product.low_stock')}
                    </div>
                )}
                {quantity === 0 && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex items-center justify-center">
                        <span className="bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-full">{t('product.out_of_stock')}</span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col gap-3 min-h-[146px]">
                <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-green-600 transition-colors line-clamp-1">
                        {t(`crops.${cropName}`, {defaultValue: cropName})}
                    </h3>
                    <div className="flex flex-col items-end">
                        <span className="font-bold text-gray-900">₹{price}</span>
                        <span className="text-[10px] text-gray-500 font-medium">{t('product.per_kg')}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between text-gray-500 text-xs min-h-[18px] gap-2">
                    <span className="truncate">{location}</span>
                    <span className="whitespace-nowrap">{quantity}{t('product.kg_left')}</span>
                </div>

                {user?.role === 'buyer' && cartQuantity > 0 ? (
                    <div
                        className="mt-auto w-full h-10 bg-green-50 rounded-xl border border-green-100 flex items-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={handleDecrease}
                            className="h-full w-10 flex items-center justify-center text-green-700 hover:bg-green-100 rounded-l-xl transition-colors"
                            aria-label="Decrease quantity"
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <div className="flex-1 text-center font-bold text-sm text-green-800">{cartQuantity}</div>
                        <button
                            onClick={handleIncrease}
                            disabled={cartQuantity >= quantity}
                            className="h-full w-10 flex items-center justify-center text-green-700 hover:bg-green-100 rounded-r-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label="Increase quantity"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleAddClick}
                        disabled={quantity === 0}
                        className="mt-auto w-full py-2.5 bg-green-50 text-green-700 font-bold rounded-xl text-sm hover:bg-green-600 hover:text-white active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 group/btn"
                    >
                        <Plus className="w-4 h-4 transition-transform group-hover/btn:rotate-90" />
                        {t('common.add')}
                    </button>
                )}
            </div>
        </div>
    );
};
