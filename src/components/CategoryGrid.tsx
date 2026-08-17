import React from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';

interface CategoryGridProps {
  onCategoryClick?: (categoryName: string) => void;
  onViewAll?: () => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({ onCategoryClick, onViewAll }) => {
  const categories = [
    {
      id: 'cat-skincare',
      name: 'Skincare',
      query: 'Skincare',
      itemCount: '1,420+ listings',
      image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'cat-haircare',
      name: 'Haircare',
      query: 'Haircare',
      itemCount: '890+ listings',
      image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'cat-makeup',
      name: 'Cosmetics',
      query: 'Color Cosmetics',
      itemCount: '1,150+ listings',
      image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'cat-fragrance',
      name: 'Fragrances',
      query: 'Fragrances',
      itemCount: '620+ listings',
      image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'cat-salon-equip',
      name: 'Salon Equip',
      query: 'Salon Equipment',
      itemCount: '410+ units',
      image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'cat-devices',
      name: 'Aesthetic Devices',
      query: 'Aesthetic Devices',
      itemCount: '320+ systems',
      image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'cat-packaging',
      name: 'Packaging',
      query: 'Packaging',
      itemCount: '1,280+ molds',
      image: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'cat-oem',
      name: 'OEM / Private Label',
      query: 'OEM / Private Label',
      itemCount: '180+ audited labs',
      image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80',
    },
  ];

  return (
    <section className="mb-12">
      <div className="flex justify-between items-end mb-6 pb-2">
        <div>
          <h2 className="font-serif text-[22px] md:text-[26px] font-bold text-[#1C1B1B] border-b-2 border-[#B90064] pb-1 inline-block">
            Explore Core Verticals
          </h2>
          <p className="text-[13px] text-[#594047] mt-1">
            Source verified formulations and contract manufacturers
          </p>
        </div>
        <button
          onClick={onViewAll}
          className="text-[13px] font-bold text-[#B90064] hover:text-[#500037] flex items-center gap-1.5 transition-colors cursor-pointer group"
        >
          <span>View All Categories</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryClick?.(cat.query)}
            className="group block text-left cursor-pointer rounded-2xl bg-white/85 backdrop-blur-md border border-[#E8DFE3] hover:border-[#B90064]/40 p-2.5 shadow-2xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden"
          >
            <div className="w-full aspect-square rounded-xl overflow-hidden mb-2.5 bg-[#FAF1F5] relative">
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
              <ChevronRight className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 text-white/90 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <h3 className="text-[13px] font-extrabold text-[#1C1B1B] group-hover:text-[#B90064] transition-colors leading-tight truncate">
              {cat.name}
            </h3>
            <p className="text-[10.5px] font-semibold text-[#8D8087] truncate mt-0.5">
              {cat.itemCount}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
};

