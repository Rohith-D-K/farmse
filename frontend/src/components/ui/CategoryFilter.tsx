import React from 'react';
import { useTranslation } from 'react-i18next';

interface CategoryFilterProps {
    categories: string[];
    activeCategory: string;
    onSelect: (category: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({ categories, activeCategory, onSelect }) => {
    const { t } = useTranslation();
    // Combine 'All' with other categories
    const allCategories = ['All', ...categories];

    return (
        <div className="w-full overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 pt-1 sticky top-16 bg-gray-50/95 backdrop-blur-sm z-30 md:static md:mx-0 md:px-0 md:bg-transparent">
            <div className="flex gap-2 items-center">
                {allCategories.map((category) => (
                    <button
                        key={category}
                        onClick={() => onSelect(category)}
                        className={`
                            px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border shadow-sm
                            ${activeCategory === category
                                ? 'bg-green-600 text-white border-green-600 shadow-md transform scale-105'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-green-200 hover:text-green-700 hover:bg-green-50'}
                        `}
                    >
                        {t(`crops.${category}`, {defaultValue: category})}
                    </button>
                ))}
            </div>
        </div>
    );
};
