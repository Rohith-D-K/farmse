import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { ProductCard } from '../components/ui/ProductCard';
import { CategoryFilter } from '../components/ui/CategoryFilter';
import { Search, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

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
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const searchTerm = searchParams.get('search') || '';
    const [selectedCategory, setSelectedCategory] = useState('All');

    // Extract unique categories from products
    const categories = Array.from(new Set(products.map(p => p.cropName)));

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const data = await api.products.getAll();
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.cropName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.location.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || product.cropName === selectedCategory;
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
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20 md:pb-0">
            {/* Mobile Header (Search & Location) - Hidden on desktop as TopHeader covers it */}
            <div className="md:hidden space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-gray-900 truncate max-w-[200px]">
                        {user?.location || t('marketplace.select_location')}
                    </span>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder={t('marketplace.search_placeholder')}
                        value={searchTerm}
                        onChange={handleMobileSearch}
                        className="input-field pl-10 py-3 shadow-sm bg-white"
                    />
                </div>
            </div>

            {/* Promotional Banner */}
            <div className="relative rounded-2xl overflow-hidden shadow-lg border border-gray-100 min-h-[190px]" id="tour-marketplace-banner">
                <img
                    src="/produce/banner.avif"
                    alt="Fresh produce"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-gray-900/75 via-gray-900/55 to-gray-900/25" />
                <div className="relative z-10 p-6 text-white">
                    <h2 className="text-2xl font-bold mb-2">{t('marketplace.fresh_from_farm')}</h2>
                    <p className="text-gray-100 mb-4 text-sm max-w-[320px]">{t('marketplace.fresh_from_farm_desc')}</p>
                    <button className="bg-white text-gray-900 px-4 py-2 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all">
                        {t('marketplace.explore_produce')}
                    </button>
                </div>
            </div>

            {/* Categories */}
            <div className="space-y-2" id="tour-category-filter">
                <h3 className="font-bold text-gray-900 text-lg px-1">{t('marketplace.all_categories')}</h3>
                <CategoryFilter
                    categories={categories}
                    activeCategory={selectedCategory}
                    onSelect={setSelectedCategory}
                />
            </div>

            {/* Product Grid */}
            <div className="space-y-2">
                <h3 className="font-bold text-gray-900 text-lg px-1">
                    {selectedCategory === 'All' ? t('marketplace.title') : t(`crops.${selectedCategory}`, {defaultValue: selectedCategory})}
                </h3>
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                        <p className="text-gray-500">{t('marketplace.no_products_found')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" id="tour-product-grid">
                        {filteredProducts.map(product => (
                            <ProductCard
                                key={product.id}
                                {...product}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
