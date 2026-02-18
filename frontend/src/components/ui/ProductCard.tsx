import React from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getImageForCrop } from '../../utils/productImages';

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
                        Low Stock
                    </div>
                )}
                {quantity === 0 && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex items-center justify-center">
                        <span className="bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-full">Out of Stock</span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-green-600 transition-colors">
                        {cropName}
                    </h3>
                    <div className="flex flex-col items-end">
                        <span className="font-bold text-gray-900">₹{price}</span>
                        <span className="text-[10px] text-gray-500 font-medium">/kg</span>
                    </div>
                </div>

                <div className="flex items-center text-gray-500 text-xs mb-4">
                    <span className="truncate max-w-[120px]">{location}</span>
                    <span className="mx-1">•</span>
                    <span>{quantity}kg left</span>
                </div>

                {/* Add Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (quantity > 0) navigate(`/product/${id}`);
                    }}
                    disabled={quantity === 0}
                    className="w-full py-2.5 bg-green-50 text-green-700 font-bold rounded-xl text-sm hover:bg-green-600 hover:text-white active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 group/btn"
                >
                    <Plus className="w-4 h-4 transition-transform group-hover/btn:rotate-90" />
                    Add
                </button>
            </div>
        </div>
    );
};
