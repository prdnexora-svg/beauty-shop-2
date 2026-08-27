import React from 'react';
import {
  Bookmark,
  BookmarkCheck,
  ShieldCheck,
  Phone,
  MessageCircle,
  Send,
  Award,
  FileCheck2,
  Trash2,
  ArrowRight,
  Store,
  Sparkles,
  Search,
  MapPin
} from 'lucide-react';
import { VerifiedSupplier } from '../types';

interface SavedSuppliersSectionProps {
  savedSuppliers: VerifiedSupplier[];
  onToggleSave: (supplierId: string, supplierName?: string) => void;
  onClearAll: () => void;
  onOpenEnquiry: (supplier: VerifiedSupplier) => void;
  onOpenMapModal?: (supplier: VerifiedSupplier) => void;
  onCallSupplier: (supplierName: string) => void;
  onWhatsAppSupplier: (supplierName: string) => void;
  onExploreMore: () => void;
}

export const SavedSuppliersSection: React.FC<SavedSuppliersSectionProps> = ({
  savedSuppliers,
  onToggleSave,
  onClearAll,
  onOpenEnquiry,
  onOpenMapModal,
  onCallSupplier,
  onWhatsAppSupplier,
  onExploreMore
}) => {
  return (
    <section id="my-saved-suppliers" className="py-12 bg-[#FDFBF7] border-t border-b border-[#E8DEEF]">
      <div className="max-w-[1440px] mx-auto px-5 md:px-10">
        
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3 border-b border-[#E8DEEF] pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 bg-[#F5EEF8] text-[#6B2D8C] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                <BookmarkCheck className="w-3.5 h-3.5" />
                Buyer Workspace
              </span>
              <span className="text-xs font-bold text-[#5B4A6E] bg-white border border-[#E8DEEF] px-2.5 py-0.5 rounded-full shadow-2xs">
                {savedSuppliers.length} Saved {savedSuppliers.length === 1 ? 'Supplier' : 'Suppliers'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2A0E3F] tracking-tight">
              My Saved Suppliers
            </h2>
            <p className="text-sm text-[#5B4A6E] mt-1">
              Quick access to your shortlisted manufacturing partners, custom OEM labs, and verified bulk distributors.
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2.5">
            {savedSuppliers.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-xs font-semibold text-[#7E6C96] hover:text-[#6B2D8C] px-3 py-2 rounded-lg hover:bg-white border border-transparent hover:border-[#E8DEEF] transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}
            <button
              onClick={onExploreMore}
              className="bg-white hover:bg-[#F6F1FA] text-[#2A0E3F] font-bold text-xs px-4 py-2.5 rounded-xl border border-[#E8DEEF] shadow-2xs transition-all flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5 text-[#6B2D8C]" />
              <span>Browse More Suppliers</span>
            </button>
          </div>
        </div>

        {/* Empty State */}
        {savedSuppliers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-[#E8DEEF] p-10 text-center max-w-xl mx-auto shadow-2xs">
            <div className="w-14 h-14 rounded-2xl bg-[#F5EEF8] text-[#6B2D8C] flex items-center justify-center mx-auto mb-4">
              <Bookmark className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-[#2A0E3F] mb-1">
              No bookmarked suppliers yet
            </h3>
            <p className="text-xs text-[#5B4A6E] leading-relaxed mb-6">
              Bookmark manufacturers, cosmeceutical formulators, and packaging suppliers as you explore. They will appear here for one-click RFQ dispatch and fast comparison.
            </p>
            <button
              onClick={onExploreMore}
              className="bg-[#6B2D8C] hover:bg-[#4A2560] text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-xs transition-all inline-flex items-center gap-2 active:scale-98"
            >
              <span>Explore Verified Suppliers</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Saved Suppliers Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedSuppliers.map((sup) => (
              <div
                key={sup.id}
                className="bg-white rounded-2xl border border-[#E8DEEF] p-5 shadow-2xs hover:border-[#7E6C96] hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  
                  {/* Top Bar with Monogram, Info & Bookmark Toggle */}
                  <div className="flex items-start justify-between gap-3 mb-3.5">
                    <div className="flex items-center gap-3">
                      {/* Monogram Logo */}
                      <div className="w-11 h-11 rounded-xl bg-[#6B2D8C] text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                        {sup.shortCode || sup.name.slice(0, 2).toUpperCase()}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-[15px] font-bold text-[#2A0E3F] group-hover:text-[#6B2D8C] transition-colors line-clamp-1">
                            {sup.name}
                          </h4>
                          <ShieldCheck className="w-4 h-4 text-[#6B2D8C] shrink-0" />
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <p className="text-xs text-[#5B4A6E] font-medium line-clamp-1">
                            {sup.type} • {sup.city}
                          </p>
                          {onOpenMapModal && (
                            <button
                              onClick={() => onOpenMapModal(sup)}
                              className="text-[10.5px] font-bold text-[#6B2D8C] hover:text-[#4A2560] bg-[#F5EEF8] hover:bg-[#fbd0e8] px-1.5 py-0.2 rounded flex items-center gap-0.5 transition-colors cursor-pointer"
                              title="View on Map"
                            >
                              <MapPin className="w-2.5 h-2.5" />
                              <span>Map</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bookmark Remove Button */}
                    <button
                      onClick={() => onToggleSave(sup.id, sup.name)}
                      className="p-1.5 text-[#6B2D8C] bg-[#F5EEF8] hover:bg-[#fcd0e5] rounded-lg transition-colors shadow-2xs shrink-0"
                      title="Remove from saved suppliers"
                    >
                      <BookmarkCheck className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Trust Score & Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-[11px] font-bold bg-[#F5EEF8] text-[#6B2D8C] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {sup.trustScore || 98}/100 Trust Score
                    </span>
                    {sup.isGstVerified && (
                      <span className="text-[11px] font-semibold bg-[#f0f4ff] text-[#6B2D8C] px-2 py-0.5 rounded-md flex items-center gap-1">
                        <FileCheck2 className="w-3 h-3" />
                        GST Verified
                      </span>
                    )}
                    {sup.isIsoCertified && (
                      <span className="text-[11px] font-semibold bg-[#D1FAE5] text-[#059669] px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        GMP / ISO
                      </span>
                    )}
                  </div>

                  {/* Operational SLAs & Response */}
                  <div className="bg-[#F6F1FA] rounded-xl p-3 mb-3.5 space-y-1.5 text-xs border border-[#E8DEEF]/60">
                    <div className="flex items-center justify-between">
                      <span className="text-[#7E6C96]">Response Time:</span>
                      <strong className="text-[#6B2D8C]">{sup.responseTimeText || '< 2 hrs'} ({sup.responseScore || 97}% SLA)</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#7E6C96]">Export Readiness:</span>
                      <strong className="text-[#059669]">{sup.exportReadiness || 94}% (FDA / EU Compliant)</strong>
                    </div>
                  </div>

                  {/* Core Capabilities */}
                  <div className="mb-4">
                    <span className="text-[10px] font-bold text-[#7E6C96] uppercase tracking-wider block mb-1.5">
                      Core Product Categories
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {sup.categories.slice(0, 3).map((c, i) => (
                        <span key={i} className="text-[11px] bg-[#F6F1FA] text-[#5B4A6E] px-2 py-0.5 rounded border border-[#E8DEEF]/80 font-medium">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Card Action Controls */}
                <div className="pt-3 border-t border-[#E8DEEF] grid grid-cols-5 gap-2">
                  <button
                    onClick={() => onOpenEnquiry(sup)}
                    className="col-span-3 bg-[#6B2D8C] hover:bg-[#4A2560] text-white text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-2xs active:scale-98"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Enquiry</span>
                  </button>

                  <button
                    onClick={() => onCallSupplier(sup.name)}
                    title="Direct Phone Line"
                    className="col-span-1 bg-[#F6F1FA] hover:bg-[#eae4e6] text-[#5B4A6E] hover:text-[#2A0E3F] rounded-xl transition-colors flex items-center justify-center border border-[#E8DEEF]"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onWhatsAppSupplier(sup.name)}
                    title="WhatsApp B2B Connect"
                    className="col-span-1 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#128C7E] rounded-xl transition-colors flex items-center justify-center"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
};
