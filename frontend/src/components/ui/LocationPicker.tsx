import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Search, Navigation, Loader2, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../../lib/api';
import type { LocationSuggestion } from '../../lib/api';

// Fix Leaflet default marker icon
const defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface LocationPickerProps {
    label?: string;
    value: string;
    latitude: number | null;
    longitude: number | null;
    onChange: (location: string, lat: number | null, lng: number | null) => void;
    placeholder?: string;
    required?: boolean;
}

function MapUpdater({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lng], 15, { animate: true });
    }, [lat, lng, map]);
    return null;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
    label = 'Location',
    value,
    latitude,
    longitude,
    onChange,
    placeholder = 'Search for a location...',
    required = false
}) => {
    const [mode, setMode] = useState<'auto' | 'manual'>('manual');
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [detectingLocation, setDetectingLocation] = useState(false);
    const [gpsError, setGpsError] = useState('');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const hasCoordinates = latitude !== null && longitude !== null;
    const mapCenter: [number, number] = hasCoordinates
        ? [latitude!, longitude!]
        : [20.5937, 78.9629]; // Default: center of India

    // Close suggestions on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchSuggestions = useCallback(async (query: string) => {
        if (query.length < 2) {
            setSuggestions([]);
            return;
        }

        setLoadingSuggestions(true);
        try {
            const results = await api.location.autocomplete(query);
            setSuggestions(results);
            setShowSuggestions(true);
        } catch {
            setSuggestions([]);
        } finally {
            setLoadingSuggestions(false);
        }
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setSearchQuery(newValue);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchSuggestions(newValue);
        }, 350);
    };

    const handleSuggestionClick = (suggestion: LocationSuggestion) => {
        const displayLabel = suggestion.label || suggestion.sublabel;
        setSearchQuery(displayLabel);
        setShowSuggestions(false);
        onChange(displayLabel, suggestion.latitude, suggestion.longitude);
    };

    const detectGPSLocation = async () => {
        if (!navigator.geolocation) {
            setGpsError('Geolocation is not supported by your browser');
            return;
        }

        setDetectingLocation(true);
        setGpsError('');

        navigator.geolocation.getCurrentPosition(
            async ({ coords }) => {
                const lat = Number(coords.latitude.toFixed(6));
                const lng = Number(coords.longitude.toFixed(6));

                try {
                    const result = await api.location.reverseGeocode(lat, lng);
                    onChange(result.label, lat, lng);
                    setSearchQuery(result.label);
                } catch {
                    const fallback = `Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`;
                    onChange(fallback, lat, lng);
                    setSearchQuery(fallback);
                }
                setDetectingLocation(false);
            },
            (err) => {
                setGpsError(
                    err.code === 1
                        ? 'Location permission denied. Please allow location access.'
                        : 'Unable to detect location. Please try manual search.'
                );
                setDetectingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
        );
    };

    const handleAutoMode = () => {
        setMode('auto');
        detectGPSLocation();
    };

    const handleManualMode = () => {
        setMode('manual');
        setGpsError('');
    };

    return (
        <div ref={containerRef} className="space-y-3">
            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">
                {label} {required && <span className="text-red-500">*</span>}
            </label>

            {/* Mode Toggle */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                <button
                    type="button"
                    onClick={handleManualMode}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold transition-colors ${
                        mode === 'manual'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    <Search className="w-3.5 h-3.5" />
                    Search Manually
                </button>
                <button
                    type="button"
                    onClick={handleAutoMode}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold transition-colors ${
                        mode === 'auto'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    <Navigation className="w-3.5 h-3.5" />
                    Detect Automatically
                </button>
            </div>

            {/* Manual Search */}
            {mode === 'manual' && (
                <div className="relative">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                            className="input-field py-2.5 pl-10 pr-8"
                            placeholder={placeholder}
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('');
                                    setSuggestions([]);
                                    setShowSuggestions(false);
                                    onChange('', null, null);
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                            >
                                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                            </button>
                        )}
                    </div>

                    {loadingSuggestions && (
                        <div className="absolute z-[1000] w-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg p-3 flex items-center gap-2 text-xs text-gray-500">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Searching locations...
                        </div>
                    )}

                    {showSuggestions && suggestions.length > 0 && !loadingSuggestions && (
                        <div className="absolute z-[1000] w-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg max-h-56 overflow-y-auto">
                            {suggestions.map((s, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleSuggestionClick(s)}
                                    className="w-full text-left px-4 py-3 hover:bg-green-50 transition-colors flex items-start gap-3 border-b border-gray-50 last:border-0"
                                >
                                    <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{s.label}</p>
                                        {s.sublabel && s.sublabel !== s.label && (
                                            <p className="text-xs text-gray-500 truncate mt-0.5">{s.sublabel}</p>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Auto Detect */}
            {mode === 'auto' && (
                <div className="space-y-2">
                    {detectingLocation && (
                        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-xl">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Detecting your location...
                        </div>
                    )}
                    {gpsError && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">
                            {gpsError}
                        </div>
                    )}
                    {!detectingLocation && !gpsError && value && (
                        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-xl">
                            <MapPin className="w-4 h-4" />
                            {value}
                        </div>
                    )}
                    {!detectingLocation && (
                        <button
                            type="button"
                            onClick={detectGPSLocation}
                            className="text-xs font-medium text-green-600 hover:text-green-700 underline"
                        >
                            Re-detect location
                        </button>
                    )}
                </div>
            )}

            {/* Selected location display */}
            {value && mode === 'manual' && (
                <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate">{value}</span>
                </div>
            )}

            {/* Map Display */}
            <div className="rounded-xl overflow-hidden border border-gray-200 h-48">
                <MapContainer
                    center={mapCenter}
                    zoom={hasCoordinates ? 15 : 5}
                    className="w-full h-full"
                    scrollWheelZoom={false}
                    key={hasCoordinates ? `${latitude}-${longitude}` : 'default'}
                >
                    <TileLayer
                        attribution='&copy; OpenStreetMap contributors'
                        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                    />
                    {hasCoordinates && (
                        <>
                            <Marker position={[latitude!, longitude!]} icon={defaultIcon} />
                            <MapUpdater lat={latitude!} lng={longitude!} />
                        </>
                    )}
                </MapContainer>
            </div>

            {/* Hidden input for form validation */}
            <input type="hidden" value={value} required={required} />
        </div>
    );
};
