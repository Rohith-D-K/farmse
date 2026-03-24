import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Package, MapPin, ArrowRight } from 'lucide-react';

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
            className="bg-white overflow-hidden cursor-pointer transition-all duration-300 active:scale-[0.97] group flex flex-col h-full"
            style={{ borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}
        >
            {/* Image / Placeholder */}
            {image ? (
                <div className="h-40 w-full overflow-hidden" style={{ borderRadius: 'var(--radius-card) var(--radius-card) 0 0' }}>
                    <img src={image} alt={cropName}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-400" />
                </div>
            ) : (
                <div className="h-40 w-full flex items-center justify-center"
                    style={{ background: 'var(--color-amber-light)', borderRadius: 'var(--radius-card) var(--radius-card) 0 0' }}>
                    <Package className="w-10 h-10" style={{ color: '#F5A623', opacity: 0.5 }} strokeWidth={1.5} />
                </div>
            )}

            <div className="p-4 flex flex-col flex-1 justify-between">
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-farmse-dark group-hover:text-farmse-amber transition-colors"
                        style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                        {cropName}
                    </h3>
                    <div className="text-right">
                        <span className="text-sm font-bold" style={{ color: '#2D7A4F' }}>₹{basePricePerKg}</span>
                        <span className="text-xs text-farmse-muted">/kg</span>
                    </div>
                </div>

                {/* Meta */}
                <div className="space-y-1.5">
                    <div className="flex items-center text-xs text-farmse-muted gap-1.5">
                        <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#F5A623' }} strokeWidth={1.5} />
                        <span>Harvest: {new Date(expectedHarvestDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center text-xs text-farmse-muted gap-1.5">
                        <Package className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#F5A623' }} strokeWidth={1.5} />
                        <span>{estimatedQuantity} kg available</span>
                    </div>
                    <div className="flex items-center text-xs text-farmse-muted gap-1.5">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#F5A623' }} strokeWidth={1.5} />
                        <span className="truncate">{location}</span>
                    </div>
                </div>

                {/* CTA */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                    <button className="w-full py-2 text-xs font-semibold flex items-center justify-center gap-1.5 rounded-card transition-all"
                        style={{ background: '#FFF3DC', color: '#E8901A' }}>
                        View Pre-order Details
                        <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
                    </button>
                </div>
            </div>
        </div>
    );
};
