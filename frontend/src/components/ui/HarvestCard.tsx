import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Package, MapPin } from 'lucide-react';

interface HarvestCardProps {
    id: string;
    cropName: string;
    expectedHarvestDate: string;
    estimatedQuantity: number;
    basePricePerKg: number;
    location: string;
    image?: string;
}

export const HarvestCard: React.FC<HarvestCardProps> = ({
    id,
    cropName,
    expectedHarvestDate,
    estimatedQuantity,
    basePricePerKg,
    location,
    image,
}) => {
    const navigate = useNavigate();

    return (
        <div 
            onClick={() => navigate(`/harvest/${id}`)}
            className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden cursor-pointer hover:shadow-md transition-all group flex flex-col h-full"
        >
            {image ? (
                <div className="h-48 w-full overflow-hidden">
                    <img src={image} alt={cropName} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" />
                </div>
            ) : (
                <div className="h-48 w-full bg-orange-50 flex items-center justify-center">
                    <Package className="w-12 h-12 text-orange-200" />
                </div>
            )}
            <div className="p-4 flex flex-col flex-1 justify-between">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                        {cropName}
                    </h3>
                    <div className="text-right">
                        <span className="text-sm font-bold text-gray-900">₹{basePricePerKg}</span>
                        <span className="text-xs text-gray-500">/kg</span>
                    </div>
                </div>

                <div className="space-y-2 mt-3">
                    <div className="flex items-center text-xs text-gray-600">
                        <Calendar className="w-3.5 h-3.5 mr-1.5 text-orange-500" />
                        <span>Harvest: {new Date(expectedHarvestDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-600">
                        <Package className="w-3.5 h-3.5 mr-1.5 text-orange-500" />
                        <span>{estimatedQuantity} kg total</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-600">
                        <MapPin className="w-3.5 h-3.5 mr-1.5 text-orange-500" />
                        <span className="truncate">{location}</span>
                    </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100">
                    <button className="w-full py-1.5 text-xs font-semibold text-orange-600 bg-orange-50 rounded-lg group-hover:bg-orange-600 group-hover:text-white transition-colors">
                        View Pre-order Details
                    </button>
                </div>
            </div>
        </div>
    );
};
