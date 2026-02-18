import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface QuantitySelectorProps {
    quantity: number;
    maxQuantity: number;
    onIncrement: () => void;
    onDecrement: () => void;
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({ quantity, maxQuantity, onIncrement, onDecrement }) => {
    return (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-1 shadow-sm w-32">
            <button
                onClick={onDecrement}
                disabled={quantity <= 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 disabled:opacity-30 transition-colors"
            >
                <Minus className="w-4 h-4" />
            </button>
            <span className="font-bold text-gray-900 w-8 text-center">{quantity}</span>
            <button
                onClick={onIncrement}
                disabled={quantity >= maxQuantity}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-green-50 text-green-600 disabled:opacity-30 transition-colors"
            >
                <Plus className="w-4 h-4" />
            </button>
        </div>
    );
};
