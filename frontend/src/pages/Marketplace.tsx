import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { ProductCard } from '../components/ui/ProductCard';
import { Search, MapPin, Zap, Timer } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { HarvestCard } from '../components/ui/HarvestCard';

/* ── Flash Deal Countdown (visual-only component) ── */
const FlashDealBanner: React.FC = () => {
    const [secs, setSecs] = useState(4 * 3600 + 23 * 60 + 47);
    useEffect(() => {
        const id = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
        return () => clearInterval(id);
    }, []);
    const h = String(Math.floor(secs / 3600)).padStart(2, '0');
    const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return (
        <div className="flash-banner p-4 flex items-center justify-between gap-3 animate-flash-pulse">
            <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-white" strokeWidth={1.5} fill="white" />
                <div>
                    <p className="text-white text-xs font-semibold tracking-wide uppercase opacity-90">Flash Deals</p>
                    <p className="text-white font-bold text-sm" style={{ fontFamily: 'var(--font-display)' }}>Up to 30% off today!</p>
                </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <Timer className="w-4 h-4 text-white/80" strokeWidth={1.5} />
                <div className="flex items-center gap-1">
                    {[h, m, s].map((val, i) => (
                        <React.Fragment key={i}>
                            <span className="bg-white/20 backdrop-blur rounded-md px-2 py-1 text-white font-bold text-sm tabular-nums"
                                style={{ fontFamily: 'var(--font-body)', minWidth: '2rem', textAlign: 'center' }}>
                                {val}
                            </span>
                            {i < 2 && <span className="text-white/80 font-bold text-sm">:</span>}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
};

interface Product {
    id: string;
    cropName: string;
    price: number;
    quantity: number;
    location: string;
    image: string;
    farmerId: string;
}

export const Marketplace: React.FC = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [products, setProducts] = useState<Product[]>([]);
    const [harvests, setHarvests] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<'products' | 'harvests'>('products');
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const searchTerm = searchParams.get('search') || '';
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');

    const CATEGORIES = ['All', 'Vegetables', 'Fruits', 'Grains', 'Dairy', 'Nuts', 'Greens', 'Herbs', 'Seeds', 'Organic Manure', 'Other'];

    const getCategory = (cropName: string) => {
        const name = cropName.toLowerCase();
        if (/(almond|cashew|walnut|peanut|nut)/i.test(name)) return 'Nuts';
        if (/(wheat|rice|corn|maize|barley|oat|grain|millet|dal|pulses)/i.test(name)) return 'Grains';
        if (/(milk|cheese|butter|ghee|paneer|dairy|curd)/i.test(name)) return 'Dairy';
        if (/(apple|banana|mango|grape|orange|strawberry|watermelon|lemon|fruit)/i.test(name)) return 'Fruits';
        if (/(mint|coriander|tulsi|basil|rosemary|thyme|herb|oregano)/i.test(name)) return 'Herbs';
        if (/(spinach|lettuce|kale|greens|leaves|celery)/i.test(name)) return 'Greens';
        if (/(seed|mustard|cumin|fennel|sesame)/i.test(name)) return 'Seeds';
        if (/(manure|compost|fertilizer|organic|soil|coco)/i.test(name)) return 'Organic Manure';
        if (/(tomato|potato|onion|carrot|cabbage|cauliflower|brinjal|cucumber|okra|beans|vegetable|pepper|chilli|garlic|ginger)/i.test(name)) return 'Vegetables';
        return 'Other';
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const data = await api.products.getAll();
            setProducts(data);
            const hData = await api.harvests.getAll();
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const visibleHarvests = hData.filter((h: any) => h.status === 'open' && new Date(h.expectedHarvestDate) >= today);
            setHarvests(visibleHarvests);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.cropName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.location.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || getCategory(product.cropName) === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Update URL when mobile search input changes
    const handleMobileSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value) {
            setSearchParams({ search: value });
        } else {
            setSearchParams({});
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 pb-20 md:pb-0">
                {/* Skeleton loading shimmer */}
                <div className="skeleton h-48 rounded-card" />
                <div className="skeleton h-10 rounded-pill" />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="skeleton rounded-card" style={{ height: 260 }} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5 pb-20 md:pb-0" style={{ background: 'var(--color-surface)' }}>

            {/* Mobile Search & Location */}
            <div className="md:hidden space-y-3">
                <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-farmse-green" strokeWidth={1.5} />
                    <span className="font-semibold text-farmse-dark truncate max-w-[220px]" style={{ fontFamily: 'var(--font-body)' }}>
                        {user?.location || t('marketplace.select_location')}
                    </span>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-farmse-muted" strokeWidth={1.5} />
                    <input
                        type="text"
                        placeholder={t('marketplace.search_placeholder')}
                        value={searchTerm}
                        onChange={handleMobileSearch}
                        className="input-field pl-10"
                    />
                </div>
            </div>

            {/* Flash Deals Banner */}
            <FlashDealBanner />

            {/* Hero Banner */}
            <div className="relative rounded-card overflow-hidden min-h-[190px]" id="tour-marketplace-banner"
                style={{ boxShadow: 'var(--shadow-card)' }}>
                <img
                    src="/produce/banner.avif"
                    alt="Fresh produce"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(120deg, rgba(26,46,31,0.82) 0%, rgba(26,46,31,0.50) 60%, transparent 100%)' }} />
                <div className="relative z-10 p-6 text-white">
                    <p className="text-farmse-amber text-xs font-semibold uppercase tracking-widest mb-1" style={{ fontFamily: 'var(--font-body)' }}>Farm Fresh · Direct to You</p>
                    <h2 className="text-3xl mb-2 leading-tight" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                        {t('marketplace.fresh_from_farm')}
                    </h2>
                    <p className="text-white/80 mb-4 text-sm max-w-[300px]" style={{ fontFamily: 'var(--font-body)' }}>
                        {t('marketplace.fresh_from_farm_desc')}
                    </p>
                    <button className="btn-amber text-sm px-5 py-2 rounded-pill active:scale-[0.97] transition-all">
                        {t('marketplace.explore_produce')}
                    </button>
                </div>
            </div>

            {/* View Toggle */}
            <div className="flex p-1 rounded-card w-full max-w-sm mx-auto" style={{ background: 'rgba(45,122,79,0.08)' }}>
                <button
                    onClick={() => setViewMode('products')}
                    className={`flex-1 py-2 px-4 rounded-card text-sm font-semibold transition-all ${
                        viewMode === 'products'
                            ? 'bg-white text-farmse-green shadow-card'
                            : 'text-farmse-muted hover:text-farmse-green'
                    }`}
                    style={{ fontFamily: 'var(--font-body)' }}
                >
                    Current Stock
                </button>
                <button
                    onClick={() => setViewMode('harvests')}
                    className={`flex-1 py-2 px-4 rounded-card text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                        viewMode === 'harvests'
                            ? 'bg-white text-farmse-amber shadow-card'
                            : 'text-farmse-muted hover:text-farmse-amber'
                    }`}
                    style={{ fontFamily: 'var(--font-body)' }}
                >
                    Harvests
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#F5A623' }}></span>
                        <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#F5A623' }}></span>
                    </span>
                </button>
            </div>

            {viewMode === 'products' ? (
                <>
                    {/* Category Pills */}
                    <div className="space-y-3" id="tour-category-filter">
                        <h3 className="font-bold text-farmse-dark text-base px-1" style={{ fontFamily: 'var(--font-display)' }}>
                            {t('marketplace.all_categories')}
                        </h3>
                        <div className="flex overflow-x-auto pb-2 -mx-2 px-2 gap-2 no-scrollbar">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={selectedCategory === cat ? 'pill-active' : 'pill-inactive'}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="space-y-3">
                        <h3 className="font-bold text-farmse-dark text-base px-1" style={{ fontFamily: 'var(--font-display)' }}>
                            {selectedCategory === 'All' ? t('marketplace.title') : selectedCategory}
                        </h3>
                        {filteredProducts.length === 0 ? (
                            <div className="text-center py-16 rounded-card border border-dashed border-farmse-green/20 bg-white">
                                <p className="text-farmse-muted text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                                    {t('marketplace.no_products_found')}
                                </p>
                                <p className="text-farmse-green text-xs font-semibold mt-2 cursor-pointer hover:underline"
                                    onClick={() => setSelectedCategory('All')}>
                                    Expand to all categories →
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" id="tour-product-grid">
                                {filteredProducts.map((product, i) => (
                                    <div key={product.id} className="stagger-child" style={{ '--i': i } as React.CSSProperties}>
                                        <ProductCard {...product} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="space-y-3">
                    <h3 className="font-bold text-farmse-dark text-base px-1 text-center mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                        Upcoming Harvests for Pre-order
                    </h3>
                    {harvests.length === 0 ? (
                        <div className="text-center py-12 rounded-card border border-dashed border-farmse-amber/30 bg-farmse-amber-light">
                            <p className="text-farmse-muted text-sm">No upcoming harvests right now. Check back later!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {harvests.map((harvest, i) => (
                                <div key={harvest.id} className="stagger-child" style={{ '--i': i } as React.CSSProperties}>
                                    <HarvestCard {...harvest} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
