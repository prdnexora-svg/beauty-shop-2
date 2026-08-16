import React from 'react';
import { ShieldCheck, Phone, MessageCircle, Send, Award, FileCheck2 } from 'lucide-react';
import { TrendingProduct } from '../types';

interface TrendingProductsProps {
  products: TrendingProduct[];
  onOpenEnquiry: (product: TrendingProduct) => void;
  onCallSupplier: (supplierName: string) => void;
  onWhatsAppSupplier: (supplierName: string) => void;
  onNavigateToPLP?: () => void;
}

export const TrendingProducts: React.FC<TrendingProductsProps> = ({
  products,
  onOpenEnquiry,
  onCallSupplier,
  onWhatsAppSupplier,
  onNavigateToPLP
}) => {
  return (
    <section id="products" className="py-14 bg-[#fdf8f8]">
      <div className="max-w-[1440px] mx-auto px-5 md:px-10">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#b90064]">HIGH IN-DEMAND</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1c1b1b] mt-1 tracking-tight">
              Trending B2B Products
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-[13px] text-[#594047] hidden md:block">
              Most queried formulations, spa equipment, and raw supplies by Indian beauty businesses.
            </p>
            {onNavigateToPLP && (
              <button
                onClick={onNavigateToPLP}
                className="text-xs font-bold text-[#b90064] hover:text-[#8e004b] flex items-center gap-1 hover:underline cursor-pointer shrink-0"
              >
                <span>View Full Catalog (PLP)</span>
                <span>→</span>
              </button>
            )}
          </div>
        </div>

        {/* Trending Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((prod) => (
            <div
              key={prod.id}
              className="bg-white rounded-2xl border border-[#e8e8e8] overflow-hidden flex flex-col justify-between card-hover-fx"
            >
              {/* Product Image */}
              <div className="relative h-52 w-full bg-[#f0edec] overflow-hidden">
                <img
                  src={prod.image}
                  alt={prod.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                
                {/* Category Pill */}
                <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-xs text-white text-[10px] font-semibold px-2.5 py-1 rounded-md">
                  {prod.category}
                </div>
              </div>

              {/* Product Info */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  
                  {/* Supplier & Verification Badges */}
                  <div className="space-y-1 mb-2.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#1c1b1b]">{prod.supplierName}</span>
                      <span className="text-[#8c7077]">{prod.supplierLocation}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px]">
                      {prod.isGstVerified && (
                        <span className="flex items-center gap-0.5 text-[#0050d6] font-semibold bg-[#dbe1ff]/60 px-1.5 py-0.5 rounded">
                          <FileCheck2 className="w-3 h-3" />
                          GST Verified
                        </span>
                      )}
                      {prod.isIsoCertified && (
                        <span className="flex items-center gap-0.5 text-[#b90064] font-semibold bg-[#fde7f3] px-1.5 py-0.5 rounded">
                          <Award className="w-3 h-3" />
                          ISO Certified
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-[15px] font-bold text-[#1c1b1b] line-clamp-2 leading-snug mb-3">
                    {prod.title}
                  </h3>

                </div>

                {/* Pricing & Actions */}
                <div className="pt-3 border-t border-[#f0edec] space-y-3">
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#8c7077] block uppercase font-medium">B2B Price</span>
                      <span className="text-[15px] font-bold text-[#b90064]">{prod.priceRange}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-[#8c7077] block uppercase font-medium">MOQ</span>
                      <span className="text-[13px] font-bold text-[#1c1b1b]">{prod.moq}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-5 gap-2 pt-1">
                    
                    <button
                      onClick={() => onOpenEnquiry(prod)}
                      className="col-span-3 bg-[#b90064] hover:bg-[#8e004b] text-white text-[12px] font-bold py-2.5 rounded-lg shadow-2xs transition-all flex items-center justify-center gap-1.5 active:scale-98"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Enquiry</span>
                    </button>

                    <button
                      onClick={() => onCallSupplier(prod.supplierName)}
                      title="Call Supplier"
                      className="col-span-1 bg-[#f7f2f2] hover:bg-[#ece7e7] border border-[#e8e8e8] text-[#594047] rounded-lg transition-colors flex items-center justify-center"
                    >
                      <Phone className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onWhatsAppSupplier(prod.supplierName)}
                      title="Chat on WhatsApp"
                      className="col-span-1 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#128C7E] rounded-lg transition-colors flex items-center justify-center"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>

                  </div>

                </div>

              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
