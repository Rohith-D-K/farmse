import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { ProductCard } from '../components/ui/ProductCard';
import { CategoryFilter } from '../components/ui/CategoryFilter';
import { Search, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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
                        {user?.location || 'Select Location'}
                    </span>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search for vegetables, fruits..."
                        value={searchTerm}
                        onChange={handleMobileSearch}
                        className="input-field pl-10 py-3 shadow-sm bg-white"
                    />
                </div>
            </div>

            {/* Promotional Banner */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-2xl font-bold mb-2">Fresh from Farm</h2>
                    <p className="text-green-100 mb-4 text-sm max-w-[200px]">Get organic produce delivered directly to your doorstep.</p>
                    <button className="bg-white text-green-700 px-4 py-2 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all">
                        Order Now
                    </button>
                </div>
                {/* Decorative Circles */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 right-10 w-24 h-24 bg-yellow-400/20 rounded-full blur-xl"></div>
            </div>

            {/* Categories */}
            <div className="space-y-2">
                <h3 className="font-bold text-gray-900 text-lg px-1">Shop by Category</h3>
                <CategoryFilter
                    categories={categories}
                    activeCategory={selectedCategory}
                    onSelect={setSelectedCategory}
                />
            </div>

            {/* Product Grid */}
            <div className="space-y-2">
                <h3 className="font-bold text-gray-900 text-lg px-1">
                    {selectedCategory === 'All' ? 'In the Spotlight' : `${selectedCategory} near you`}
                </h3>
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                        <p className="text-gray-500">No products found for your search.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
