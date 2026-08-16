import React, { useState } from 'react';
import {
  ShieldCheck,
  Phone,
  MessageCircle,
  Send,
  Award,
  FileCheck2,
  Zap,
  Globe2,
  Activity,
  CheckCircle2,
  Bookmark,
  BookmarkCheck,
  Scale,
  Plus,
  Check,
  X,
  MapPin,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Package,
  Leaf,
  BadgeCheck,
  Video,
  Star
} from 'lucide-react';
import { VerifiedSupplier } from '../types';

interface VerifiedSuppliersSectionProps {
  suppliers: VerifiedSupplier[];
  isSaved?: (supplierId: string) => boolean;
  onToggleSave?: (supplierId: string, supplierName?: string) => void;
  selectedComparisonIds?: string[];
  onToggleComparison?: (supplier: VerifiedSupplier) => void;
  onOpenComparisonModal?: () => void;
  onClearComparison?: () => void;
  onOpenEnquiry: (supplier: VerifiedSupplier) => void;
  onOpenMapModal?: (supplier: VerifiedSupplier) => void;
  onOpenFacilityTour?: (supplier: VerifiedSupplier) => void;
  onCallSupplier: (supplierName: string) => void;
  onWhatsAppSupplier: (supplierName: string) => void;
}

export const VerifiedSuppliersSection: React.FC<VerifiedSuppliersSectionProps> = ({
  suppliers,
  isSaved,
  onToggleSave,
  selectedComparisonIds = [],
  onToggleComparison,
  onOpenComparisonModal,
  onClearComparison,
  onOpenEnquiry,
  onOpenMapModal,
  onOpenFacilityTour,
  onCallSupplier,
  onWhatsAppSupplier
}) => {
  const [expandedPortfolioIds, setExpandedPortfolioIds] = useState<Record<string, boolean>>({});
  const [activeRatingSupplierId, setActiveRatingSupplierId] = useState<string | null>(null);

  const togglePortfolio = (supplierId: string) => {
    setExpandedPortfolioIds((prev) => ({
      ...prev,
      [supplierId]: !prev[supplierId]
    }));
  };

  const getPortfolioProducts = (sup: VerifiedSupplier) => {
    if (sup.portfolioProducts && sup.portfolioProducts.length > 0) {
      return sup.portfolioProducts;
    }
    return [
      {
        id: `${sup.id}-port-1`,
        name: `${sup.categories[0] || 'Professional'} Hair & Skin Serum Base`,
        image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=400&q=80',
        price: '₹850 / L',
        moq: '50 Units'
      },
      {
        id: `${sup.id}-port-2`,
        name: `${sup.categories[1] || 'Botanical'} Repair Complex Base`,
        image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=400&q=80',
        price: '₹1,200 / L',
        moq: '25 Units'
      },
      {
        id: `${sup.id}-port-3`,
        name: `${sup.categories[0] || 'Cosmeceutical'} Active Fluid Base`,
        image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80',
        price: '₹620 / kg',
        moq: '100 kg'
      }
    ];
  };

  const getCertBadges = (sup: VerifiedSupplier) => {
    const rawList = sup.certificationsList || [
      sup.isIsoCertified ? 'ISO 22716' : null,
      sup.isGmpCertified ? 'WHO-GMP' : null,
      sup.isFdaRegistered ? 'US-FDA' : null
    ].filter(Boolean) as string[];

    return rawList.map((certStr) => {
      const certLower = certStr.toLowerCase();
      if (certLower.includes('iso')) {
        return {
          label: certStr.replace(/certified|compliant/gi, '').trim(),
          icon: <Award className="w-3 h-3 text-[#b90064]" />,
          style: 'bg-[#fde7f3] text-[#b90064] border-[#e0bec6]'
        };
      }
      if (certLower.includes('gmp')) {
        return {
          label: certStr.replace(/compliant|certified/gi, '').trim(),
          icon: <BadgeCheck className="w-3 h-3 text-[#00875a]" />,
          style: 'bg-[#e8f5e9] text-[#00875a] border-[#a5d6a7]'
        };
      }
      if (
        certLower.includes('organic') ||
        certLower.includes('ecocert') ||
        certLower.includes('usda') ||
        certLower.includes('ayush')
      ) {
        return {
          label: certStr.replace(/certified|equivalent/gi, '').trim(),
          icon: <Leaf className="w-3 h-3 text-[#2e7d32]" />,
          style: 'bg-[#f1f8e9] text-[#2e7d32] border-[#c5e1a5]'
        };
      }
      if (certLower.includes('fda')) {
        return {
          label: certStr.replace(/registered|filed/gi, '').trim(),
          icon: <FileCheck2 className="w-3 h-3 text-[#0050d6]" />,
          style: 'bg-[#dbe1ff] text-[#0050d6] border-[#a5c0ff]'
        };
      }
      if (
        certLower.includes('halal') ||
        certLower.includes('cruelty') ||
        certLower.includes('glp') ||
        certLower.includes('ce')
      ) {
        return {
          label: certStr.replace(/certified|ready|support/gi, '').trim(),
          icon: <ShieldCheck className="w-3 h-3 text-[#6b21a8]" />,
          style: 'bg-[#f3e8ff] text-[#6b21a8] border-[#e9d5ff]'
        };
      }
      return {
        label: certStr.trim(),
        icon: <Award className="w-3 h-3 text-[#594047]" />,
        style: 'bg-white text-[#594047] border-[#e8e8e8]'
      };
    });
  };

  const isSelectedForComparison = (id: string) => selectedComparisonIds.includes(id);

  const selectedSuppliersList = suppliers.filter((s) => selectedComparisonIds.includes(s.id));

  return (
    <section id="suppliers" className="py-14 bg-white border-t border-[#e8e8e8] relative">
      <div className="max-w-[1440px] mx-auto px-5 md:px-10">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#b90064]">VERIFIED NETWORK</span>
              <span className="text-[10px] font-bold bg-[#dbe1ff] text-[#0050d6] px-2 py-0.5 rounded-full">FACILITY AUDITED</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1c1b1b] mt-1 tracking-tight">
              Verified Manufacturing Partners
            </h2>
            <p className="text-[13px] text-[#594047] mt-1">
              Direct connection to registered labs, contract formulators and OEM plants. Select up to 3 for side-by-side comparison.
            </p>
          </div>

          {/* Compare Button in Header */}
          {onOpenComparisonModal && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onOpenComparisonModal}
                className={`text-[13px] font-bold px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 shadow-2xs ${
                  selectedComparisonIds.length > 0
                    ? 'bg-[#b90064] border-[#b90064] text-white hover:bg-[#8e004b]'
                    : 'bg-white border-[#e8e8e8] text-[#594047] hover:border-[#b90064] hover:text-[#b90064]'
                }`}
              >
                <Scale className="w-4 h-4" />
                <span>Compare Suppliers</span>
                {selectedComparisonIds.length > 0 ? (
                  <span className="bg-white text-[#b90064] text-[11px] font-extrabold px-1.5 py-0.2 rounded-full">
                    {selectedComparisonIds.length}/3
                  </span>
                ) : (
                  <span className="text-[11px] text-[#8c7077] font-normal">
                    (Max 3)
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Suppliers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {suppliers.map((sup) => {
            const saved = isSaved ? isSaved(sup.id) : false;
            const inComparison = isSelectedForComparison(sup.id);
            const isPortfolioExpanded = !!expandedPortfolioIds[sup.id];
            const portfolioList = getPortfolioProducts(sup);

            return (
              <div
                key={sup.id}
                className={`bg-[#fcf9f8] rounded-2xl border p-6 flex flex-col justify-between card-hover-fx transition-all ${
                  inComparison
                    ? 'border-[#b90064] ring-1 ring-[#b90064]/20 shadow-md'
                    : 'border-[#e8e8e8]'
                }`}
              >
                <div>
                  
                  {/* Header with Monogram Logo, Verifications & Quick Actions */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    
                    <div className="flex items-center gap-3.5">
                      {/* Monogram Logo */}
                      <div className="w-13 h-13 rounded-xl bg-[#b90064] text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                        {sup.shortCode}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-[#1c1b1b]">{sup.name}</h3>

                          {/* Verified Badge */}
                          <span className="inline-flex items-center gap-1 bg-[#fde7f3] text-[#b90064] border border-[#f5b8d6] px-2 py-0.5 rounded-full text-[11px] font-extrabold shadow-2xs">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#b90064]" />
                            Verified
                          </span>

                          {/* Dynamic Star-Rating Widget with Hover/Tap Breakdown */}
                          <div className="relative group/rating inline-block">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveRatingSupplierId(activeRatingSupplierId === sup.id ? null : sup.id);
                              }}
                              className="inline-flex items-center gap-1.5 bg-[#fff8e6] hover:bg-[#fff2cd] border border-[#ffe082] px-2.5 py-0.5 rounded-full transition-all cursor-pointer shadow-2xs"
                              title="Click or hover to inspect Reliability & Product Quality Ratings"
                            >
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => {
                                  const ratingVal = sup.overallRating || 4.9;
                                  return (
                                    <Star
                                      key={star}
                                      className={`w-3 h-3 ${
                                        star <= Math.floor(ratingVal)
                                          ? 'fill-[#f59e0b] text-[#f59e0b]'
                                          : star - ratingVal <= 0.5
                                          ? 'fill-[#f59e0b]/50 text-[#f59e0b]'
                                          : 'text-[#d1d5db]'
                                      }`}
                                    />
                                  );
                                })}
                              </div>
                              <span className="text-[11.5px] font-extrabold text-[#92400e]">
                                {sup.overallRating || 4.9}
                              </span>
                              <span className="text-[10px] font-medium text-[#b45309] hidden sm:inline">
                                ({sup.totalReviewsCount || 142})
                              </span>
                            </button>

                            {/* Reliability & Product Quality Rating Popover */}
                            <div
                              className={`absolute top-full left-0 mt-1.5 w-68 bg-white border border-[#e8e8e8] rounded-xl p-3.5 shadow-xl z-40 transition-all duration-200 ${
                                activeRatingSupplierId === sup.id
                                  ? 'opacity-100 pointer-events-auto scale-100'
                                  : 'opacity-0 pointer-events-none group-hover/rating:opacity-100 group-hover/rating:pointer-events-auto scale-95 group-hover/rating:scale-100'
                              }`}
                            >
                              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#f0f0f0]">
                                <div className="flex items-center gap-1.5">
                                  <Star className="w-4 h-4 fill-[#f59e0b] text-[#f59e0b]" />
                                  <span className="text-[13px] font-bold text-[#1c1b1b]">
                                    {sup.overallRating || 4.9} / 5.0 Rating
                                  </span>
                                </div>
                                <span className="text-[10px] font-bold text-[#00875a] bg-[#e6f4ea] px-2 py-0.5 rounded-full">
                                  Verified Feedback
                                </span>
                              </div>

                              <div className="space-y-2.5 text-[11px]">
                                {/* Product Quality Rating */}
                                <div>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium text-[#594047] flex items-center gap-1">
                                      <Sparkles className="w-3 h-3 text-[#b90064]" />
                                      Product Quality
                                    </span>
                                    <span className="font-extrabold text-[#1c1b1b]">
                                      {((sup.productQualityRating || 98) / 20).toFixed(1)} / 5.0 ({sup.productQualityRating || 98}%)
                                    </span>
                                  </div>
                                  <div className="w-full bg-[#f0edec] h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className="bg-[#00875a] h-full rounded-full transition-all"
                                      style={{ width: `${sup.productQualityRating || 98}%` }}
                                    />
                                  </div>
                                </div>

                                {/* Reliability Rating */}
                                <div>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium text-[#594047] flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 text-[#00875a]" />
                                      Reliability & Spec Match
                                    </span>
                                    <span className="font-extrabold text-[#1c1b1b]">
                                      {((sup.reliabilityRating || 99) / 20).toFixed(1)} / 5.0 ({sup.reliabilityRating || 99}%)
                                    </span>
                                  </div>
                                  <div className="w-full bg-[#f0edec] h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className="bg-[#b90064] h-full rounded-full transition-all"
                                      style={{ width: `${sup.reliabilityRating || 99}%` }}
                                    />
                                  </div>
                                </div>

                                {/* Response Speed */}
                                <div>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium text-[#594047] flex items-center gap-1">
                                      <Zap className="w-3 h-3 text-[#0050d6]" />
                                      Response Speed
                                    </span>
                                    <span className="font-extrabold text-[#1c1b1b]">
                                      {sup.responseRate || '98% within 2 hrs'}
                                    </span>
                                  </div>
                                  <div className="w-full bg-[#f0edec] h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className="bg-[#0050d6] h-full rounded-full transition-all"
                                      style={{ width: `${sup.responseScore || 97}%` }}
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="mt-3 pt-2 border-t border-[#f0f0f0] text-[10px] text-[#8c7077] flex items-center justify-between">
                                <span>{sup.totalReviewsCount || 142} verified B2B orders</span>
                                <span className="text-[#b90064] font-bold">Audited</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <p className="text-[12px] font-medium text-[#594047]">
                            {sup.type} • {sup.city}{sup.state ? `, ${sup.state}` : ''}
                          </p>
                          {onOpenMapModal && (
                            <button
                              onClick={() => onOpenMapModal(sup)}
                              className="text-[11px] font-bold text-[#b90064] hover:text-[#8e004b] bg-[#fde7f3] hover:bg-[#fbd0e8] px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                              title="View manufacturer proximity to shipping ports, airports and raw material hubs"
                            >
                              <MapPin className="w-3 h-3" />
                              <span>View on Map</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Compare & Bookmark Buttons + Score */}
                    <div className="flex items-center gap-2 shrink-0">
                      
                      {/* Compare Checkbox Button */}
                      {onToggleComparison && (
                        <button
                          onClick={() => onToggleComparison(sup)}
                          className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all flex items-center gap-1 shadow-2xs ${
                            inComparison
                              ? 'bg-[#b90064] border-[#b90064] text-white'
                              : 'bg-white border-[#e8e8e8] text-[#594047] hover:border-[#b90064] hover:text-[#b90064]'
                          }`}
                          title={inComparison ? 'Remove from comparison' : 'Add to side-by-side comparison (up to 3)'}
                        >
                          {inComparison ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Compared</span>
                            </>
                          ) : (
                            <>
                              <Scale className="w-3.5 h-3.5 text-[#b90064]" />
                              <span>Compare</span>
                            </>
                          )}
                        </button>
                      )}

                      {/* Bookmark Toggle */}
                      {onToggleSave && (
                        <button
                          onClick={() => onToggleSave(sup.id, sup.name)}
                          className={`p-1.5 rounded-lg border transition-all ${
                            saved
                              ? 'bg-[#fde7f3] border-[#b90064] text-[#b90064]'
                              : 'bg-white border-[#e8e8e8] text-[#8c7077] hover:text-[#b90064] hover:border-[#b90064]'
                          }`}
                          title={saved ? 'Remove from Saved Suppliers' : 'Save Supplier'}
                        >
                          {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                        </button>
                      )}

                    </div>

                  </div>

                  {/* Trust Score & Facility Pill */}
                  <div className="flex items-center justify-between mb-4 bg-white border border-[#e8e8e8] p-2.5 rounded-xl shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8c7077]">Trust Score</span>
                      <span className="text-[13px] font-extrabold text-[#b90064]">{sup.trustScore || 98}/100</span>
                      <span className="text-[10px] font-semibold text-[#0050d6] bg-[#dbe1ff] px-2 py-0.5 rounded-full">
                        {sup.establishedYear || '10+ yrs in business'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00875a]"></span>
                        <span className="text-[11px] font-medium text-[#1c1b1b]">Audit Passed</span>
                      </div>
                      {onOpenFacilityTour && (
                        <button
                          onClick={() => onOpenFacilityTour(sup)}
                          className="text-[11px] font-bold text-[#b90064] bg-[#fde7f3] hover:bg-[#b90064] hover:text-white border border-[#e0bec6] px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                          title="Play 15-second virtual tour video of manufacturing facility"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>View Facility</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Certifications & Compliance Badge Row */}
                  <div className="mb-4">
                    <span className="text-[10.5px] font-bold text-[#8c7077] uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                      <Award className="w-3 h-3 text-[#b90064]" />
                      Accreditations & Certifications
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {sup.isGstVerified && (
                        <span className="text-[11px] font-semibold bg-white border border-[#e8e8e8] text-[#0050d6] px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                          <FileCheck2 className="w-3 h-3 text-[#0050d6]" />
                          <span>GST Verified</span>
                        </span>
                      )}
                      {getCertBadges(sup).map((badge, idx) => (
                        <span
                          key={idx}
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 shadow-2xs ${badge.style}`}
                        >
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Verified Performance Metrics & Progress Bars */}
                  <div className="bg-white rounded-xl border border-[#e8e8e8] p-3.5 mb-4 space-y-3 shadow-2xs">
                    
                    {/* Reliability Metric */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-[#1c1b1b] flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-[#0050d6]" />
                          Reliability & Batch Consistency
                        </span>
                        <span className="font-bold text-[#0050d6]">{sup.reliabilityRating || 99}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#f0e6eb] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#0050d6] rounded-full transition-all duration-500"
                          style={{ width: `${sup.reliabilityRating || 99}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Response Speed Metric */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-[#1c1b1b] flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-[#b90064]" />
                          Response Time (SLA)
                        </span>
                        <span className="font-bold text-[#b90064]">{sup.responseTimeText || '< 2 hrs'} ({sup.responseScore || 97}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#f0e6eb] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#b90064] rounded-full transition-all duration-500"
                          style={{ width: `${sup.responseScore || 97}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Export Readiness Metric */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-[#1c1b1b] flex items-center gap-1.5">
                          <Globe2 className="w-3.5 h-3.5 text-[#00875a]" />
                          Export Compliance Readiness
                        </span>
                        <span className="font-bold text-[#00875a]">{sup.exportReadiness || 94}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#f0e6eb] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#00875a] rounded-full transition-all duration-500"
                          style={{ width: `${sup.exportReadiness || 94}%` }}
                        ></div>
                      </div>
                      {sup.exportCertifications && (
                        <p className="text-[10px] text-[#594047] font-medium mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-[#00875a]" />
                          {sup.exportCertifications}
                        </p>
                      )}
                    </div>

                  </div>

                  {/* Production Capabilities / Categories */}
                  <div className="mb-4">
                    <span className="text-[11px] font-semibold text-[#8c7077] uppercase tracking-wider block mb-1.5">
                      Core Specialties & Capabilities
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(sup.specialties || sup.categories).map((c, idx) => (
                        <span key={idx} className="text-[11px] bg-white border border-[#e8e8e8] text-[#594047] px-2.5 py-0.5 rounded shadow-2xs">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Expandable Best-Selling Portfolio Section */}
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={() => togglePortfolio(sup.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all text-[12px] font-bold cursor-pointer ${
                        isPortfolioExpanded
                          ? 'bg-[#fde7f3] border-[#b90064] text-[#b90064] shadow-2xs'
                          : 'bg-white border-[#e8e8e8] text-[#1c1b1b] hover:border-[#b90064] hover:text-[#b90064] shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-[#b90064]" />
                        <span>Best-Selling Portfolio</span>
                        <span className="text-[10px] font-extrabold bg-[#b90064] text-white px-1.5 py-0.2 rounded-full">
                          3 Products
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-[#8c7077]">
                        <span>{isPortfolioExpanded ? 'Hide Showcase' : 'View Best-Sellers'}</span>
                        {isPortfolioExpanded ? (
                          <ChevronUp className="w-4 h-4 text-[#b90064]" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </button>

                    {isPortfolioExpanded && (
                      <div className="mt-2.5 p-3 bg-white border border-[#e0bec6] rounded-xl shadow-2xs">
                        <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-[#f0edec]">
                          <span className="text-[10.5px] font-bold text-[#8c7077] uppercase tracking-wider flex items-center gap-1">
                            <Package className="w-3 h-3 text-[#b90064]" />
                            Top 3 Best-Selling Products
                          </span>
                          <span className="text-[10px] font-medium text-[#0050d6] bg-[#dbe1ff] px-1.5 py-0.2 rounded">
                            Click product to enquire
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {portfolioList.slice(0, 3).map((prod) => (
                            <div
                              key={prod.id}
                              onClick={() =>
                                onOpenEnquiry({
                                  title: prod.name,
                                  supplierName: sup.name,
                                  type: sup.type,
                                  city: sup.city,
                                  state: sup.state,
                                  image: prod.image,
                                  priceRange: prod.price,
                                  moq: prod.moq,
                                  category: sup.categories[0] || 'Cosmetics'
                                })
                              }
                              className="group/item border border-[#e8e8e8] hover:border-[#b90064] rounded-lg p-2 bg-[#fcf9f8] hover:bg-[#fde7f3]/30 transition-all cursor-pointer flex flex-col justify-between"
                              title={`Click to enquire about ${prod.name}`}
                            >
                              <div>
                                <div className="aspect-square rounded-md overflow-hidden bg-[#f0edec] mb-1.5 relative border border-[#e8e8e8]">
                                  <img
                                    src={prod.image}
                                    alt={prod.name}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover/item:scale-108"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src =
                                        'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=400&q=80';
                                    }}
                                  />
                                  <span className="absolute top-1 right-1 bg-black/75 text-white text-[8px] font-bold px-1 rounded uppercase tracking-wider">
                                    Best
                                  </span>
                                </div>
                                <h5 className="text-[11px] font-bold text-[#1c1b1b] group-hover/item:text-[#b90064] line-clamp-2 leading-tight mb-1">
                                  {prod.name}
                                </h5>
                              </div>

                              <div className="pt-1.5 border-t border-[#f0edec] mt-1 text-[10px]">
                                <p className="font-extrabold text-[#b90064]">{prod.price}</p>
                                <p className="text-[#8c7077] font-medium truncate">MOQ: {prod.moq}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-[#e8e8e8] grid grid-cols-5 gap-2.5">
                  
                  <button
                    onClick={() => onOpenEnquiry(sup)}
                    className="col-span-3 bg-[#b90064] hover:bg-[#8e004b] text-white text-[13px] font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-2xs active:scale-98"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Contact Supplier</span>
                  </button>

                  <button
                    onClick={() => onCallSupplier(sup.name)}
                    title="Call Phone"
                    className="col-span-1 bg-white hover:bg-[#f7f2f2] border border-[#e8e8e8] text-[#594047] hover:text-[#1c1b1b] rounded-lg transition-colors flex items-center justify-center"
                  >
                    <Phone className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onWhatsAppSupplier(sup.name)}
                    title="WhatsApp Direct"
                    className="col-span-1 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#128C7E] rounded-lg transition-colors flex items-center justify-center"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>

                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* Floating Bottom Comparison Drawer Bar */}
      {selectedComparisonIds.length > 0 && onOpenComparisonModal && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#1c1b1b] text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-4 animate-slideUp max-w-[92vw] sm:max-w-xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#b90064] text-white flex items-center justify-center shrink-0">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[12px] font-bold leading-tight">
                {selectedComparisonIds.length} of 3 Selected
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {selectedSuppliersList.map((s) => (
                  <span
                    key={s.id}
                    className="text-[10px] font-bold bg-white/20 text-white px-1.5 py-0.2 rounded"
                  >
                    {s.shortCode}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onOpenComparisonModal}
              className="bg-[#b90064] hover:bg-[#8e004b] text-white text-[12px] font-bold px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm active:scale-98 whitespace-nowrap"
            >
              <span>Compare Side-by-Side</span>
            </button>

            {onClearComparison && (
              <button
                onClick={onClearComparison}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Clear selection"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
