import React, { useState } from 'react';
import {
  ShieldCheck,
  Award,
  Calendar,
  FileCheck2,
  CheckCircle2,
  MapPin,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Building2,
  Info,
  BadgeCheck,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export interface TrustFactorItem {
  id: string;
  label: string;
  value: string;
  scorePoints: number;
  maxPoints: number;
  status: 'verified' | 'certified' | 'active' | 'warning';
  icon: React.ElementType;
  description: string;
  verifiedBy?: string;
  badgeTag?: string;
}

export interface TrustScoreGaugeProps {
  score?: number; // 0 - 100
  supplierName?: string;
  legalName?: string;
  gstin?: string;
  isGstVerified?: boolean;
  businessType?: string;
  establishedYear?: string; // e.g. "2014 (12 Yrs)" or "2014"
  certifications?: string[];
  responseSla?: string;
  ordersFulfilled?: string;
  compact?: boolean;
  className?: string;
  onViewCertificates?: () => void;
}

export const TrustScoreGauge: React.FC<TrustScoreGaugeProps> = ({
  score = 98,
  supplierName = 'Aura Beauty Labs',
  legalName,
  gstin = '27AABCU9601R1ZM',
  isGstVerified = true,
  businessType = 'Verified Manufacturer & OEM',
  establishedYear = '2014 (12 Yrs in Operation)',
  certifications = ['WHO-GMP Certified', 'ISO 22716:2007', 'US-FDA MoCRA Reg.', 'ISO 9001:2015'],
  responseSla = '< 1 hr',
  ordersFulfilled = '2,850+ B2B Shipments',
  compact = false,
  className = '',
  onViewCertificates,
}) => {
  const [showFactorDetails, setShowFactorDetails] = useState(!compact);
  const [activeFactorHover, setActiveFactorHover] = useState<string | null>(null);

  // Normalize established age text
  const currentYear = new Date().getFullYear();
  const yearMatch = establishedYear ? establishedYear.match(/\b(19\d\d|20\d\d)\b/) : null;
  const birthYear = yearMatch ? parseInt(yearMatch[1], 10) : 2014;
  const yearsInBusiness = Math.max(1, currentYear - birthYear);

  // Determine OEM certification presence
  const isOemCertified = certifications.some((c) =>
    /oem|gmp|iso 22716|fda|cgmp|ayush/i.test(c)
  ) || /oem|manufacturer/i.test(businessType);

  const mainOemCertName = certifications.find((c) =>
    /iso 22716|gmp|fda|ayush/i.test(c)
  ) || 'ISO 22716 & WHO-GMP Certified';

  // Construct individual trust factors with point allocations
  const trustFactors: TrustFactorItem[] = [
    {
      id: 'gst',
      label: 'GST Verified Registration',
      value: isGstVerified ? `GSTIN: ${gstin}` : 'GST Pending',
      scorePoints: isGstVerified ? 25 : 10,
      maxPoints: 25,
      status: isGstVerified ? 'verified' : 'warning',
      icon: CheckCircle2,
      description: 'Active GST corporate filing verified against Ministry of Corporate Affairs & GST Portal.',
      verifiedBy: 'Government GST Portal Sync',
      badgeTag: '100% Tax Compliant',
    },
    {
      id: 'oem',
      label: 'OEM / Cleanroom Certification',
      value: mainOemCertName,
      scorePoints: isOemCertified ? 25 : 12,
      maxPoints: 25,
      status: isOemCertified ? 'certified' : 'warning',
      icon: Award,
      description: 'Audited cleanroom cosmetics manufacturing & GMP quality management protocols.',
      verifiedBy: 'SGS & TÜV SÜD Audit',
      badgeTag: 'Class 10,000 Certified',
    },
    {
      id: 'age',
      label: 'Business Age & Track Record',
      value: `${yearsInBusiness}+ Years in Operation (Est. ${birthYear})`,
      scorePoints: Math.min(20, 10 + Math.floor(yearsInBusiness / 2)),
      maxPoints: 20,
      status: 'active',
      icon: Calendar,
      description: 'Established operational tenure demonstrating long-term commercial stability and supply reliability.',
      verifiedBy: 'Corporate Registry',
      badgeTag: `${yearsInBusiness} Yrs Tenure`,
    },
    {
      id: 'site',
      label: 'Physical Facility Site Audit',
      value: 'SGS Auditor Inspection Passed',
      scorePoints: 15,
      maxPoints: 15,
      status: 'verified',
      icon: MapPin,
      description: 'In-person physical factory inspection confirming cleanrooms, lab equipment, and staff headcount.',
      verifiedBy: 'Third-Party Onsite Audit',
      badgeTag: 'Site Verified',
    },
    {
      id: 'sla',
      label: 'Order SLA & Response Rate',
      value: `SLA: ${responseSla} | ${ordersFulfilled}`,
      scorePoints: 15,
      maxPoints: 15,
      status: 'active',
      icon: Clock,
      description: 'Proven track record of responding to buyer enquiries in under 2 hours and on-time order fulfillment.',
      verifiedBy: 'Nexora Platform Metrics',
      badgeTag: 'Fast Responder',
    },
  ];

  // Grade classification based on Trust Score
  const getScoreGrade = (val: number) => {
    if (val >= 95) {
      return {
        label: 'Platinum Elite Partner',
        tierName: 'Platinum Tier',
        color: 'from-purple-600 to-[#6B2D8C]',
        textColor: 'text-[#6B2D8C]',
        bgLight: 'bg-[#F5EEF8]',
        borderColor: 'border-[#D9C3E8]',
        badgeBg: 'bg-[#6B2D8C] text-white',
        gaugeStroke: '#6B2D8C',
        ringGlow: 'shadow-[0_0_20px_rgba(107,45,140,0.25)]',
        summary: 'Exceptional B2B Trust Rating. Top 2% Verified Supplier across all cosmetics & OEM parameters.',
      };
    }
    if (val >= 88) {
      return {
        label: 'Gold Certified Supplier',
        tierName: 'Gold Tier',
        color: 'from-amber-500 to-amber-600',
        textColor: 'text-amber-800',
        bgLight: 'bg-amber-50',
        borderColor: 'border-amber-200',
        badgeBg: 'bg-amber-600 text-white',
        gaugeStroke: '#D97706',
        ringGlow: 'shadow-[0_0_20px_rgba(217,119,6,0.2)]',
        summary: 'High B2B Trust Rating. Fully verified credentials, active GSTIN, and audited manufacturing lines.',
      };
    }
    return {
      label: 'Verified Member',
      tierName: 'Silver Tier',
      color: 'from-blue-600 to-indigo-600',
      textColor: 'text-blue-800',
      bgLight: 'bg-blue-50',
      borderColor: 'border-blue-200',
      badgeBg: 'bg-blue-600 text-white',
      gaugeStroke: '#2563EB',
      ringGlow: 'shadow-[0_0_15px_rgba(37,99,235,0.15)]',
      summary: 'Verified B2B Business Profile. Active registration and verified corporate documentation.',
    };
  };

  const grade = getScoreGrade(score);

  // Math for SVG semi-circle gauge (180 degrees)
  // Radius = 64, Path M 16 80 A 64 64 0 0 1 144 80
  // Length = PI * 64 = 201.06
  const arcRadius = 64;
  const arcLength = Math.PI * arcRadius; // ~201.06
  const strokeDashoffset = arcLength - (score / 100) * arcLength;

  return (
    <div
      className={`bg-white rounded-2xl border border-[#E8DEEF] shadow-sm overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* Top Header Strip */}
      <div className="bg-gradient-to-r from-[#2A0E3F] via-[#3B1556] to-[#2A0E3F] px-5 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
            <ShieldCheck className="w-4 h-4 text-[#C188E0]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm md:text-base font-black tracking-tight text-white">
                Supplier Trust Score &amp; Verification Index
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase ${grade.badgeBg}`}>
                {grade.tierName}
              </span>
            </div>
            <p className="text-[11px] text-purple-200/90 font-medium mt-0.5">
              Audited B2B Reliability Score for <span className="font-bold text-white">{supplierName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
            <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Nexora Verified</span>
          </span>
        </div>
      </div>

      {/* Main Visual Gauge + Key Factor Summary Grid */}
      <div className="p-5 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Visual Semi-Circle Gauge Meter (5 cols on lg) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 bg-[linear-gradient(180deg,#FDFBF7_0%,#F5EEF8_100%)] rounded-2xl border border-[#E8DEEF]/80 relative overflow-hidden">
            {/* Subtle background glow circle */}
            <div className="absolute w-40 h-40 rounded-full bg-[#6B2D8C]/5 blur-2xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

            {/* SVG Arc Gauge Container */}
            <div className="relative w-48 h-28 flex items-center justify-center overflow-hidden pt-2">
              <svg className="w-48 h-48 overflow-visible" viewBox="0 0 160 160">
                <defs>
                  {/* Gauge Gradient */}
                  <linearGradient id="trustGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8236A0" />
                    <stop offset="50%" stopColor="#6B2D8C" />
                    <stop offset="100%" stopColor="#2A0E3F" />
                  </linearGradient>
                  <linearGradient id="gaugeBgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#E8DEEF" />
                    <stop offset="100%" stopColor="#D9C3E8" />
                  </linearGradient>
                </defs>

                {/* Track (Background Arc) */}
                <path
                  d="M 16 80 A 64 64 0 0 1 144 80"
                  fill="none"
                  stroke="url(#gaugeBgGradient)"
                  strokeWidth="14"
                  strokeLinecap="round"
                />

                {/* Active Progress Arc */}
                <path
                  d="M 16 80 A 64 64 0 0 1 144 80"
                  fill="none"
                  stroke="url(#trustGaugeGradient)"
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={arcLength}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-out"
                />

                {/* Gauge Tick Markers */}
                <circle cx="16" cy="80" r="2.5" fill="#6B2D8C" />
                <circle cx="80" cy="16" r="2.5" fill="#6B2D8C" />
                <circle cx="144" cy="80" r="2.5" fill="#6B2D8C" />
              </svg>

              {/* Center Score Number Display */}
              <div className="absolute top-10 flex flex-col items-center justify-center text-center">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-3xl md:text-4xl font-black text-[#2A0E3F] tracking-tight">
                    {score}
                  </span>
                  <span className="text-sm font-bold text-[#7E6C96]">/100</span>
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#6B2D8C] mt-0.5">
                  Trust Index
                </span>
              </div>
            </div>

            {/* Score Label & Rating Summary */}
            <div className="mt-3 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#D9C3E8] text-xs font-black text-[#2A0E3F] shadow-3xs">
                <Sparkles className="w-3.5 h-3.5 text-[#6B2D8C]" />
                <span>{grade.label}</span>
              </div>
              <p className="text-[11.5px] text-[#5B4A6E] mt-2 max-w-xs font-medium leading-relaxed">
                {grade.summary}
              </p>
            </div>
          </div>

          {/* Right Column: High-Impact Factor Pills (7 cols on lg) */}
          <div className="lg:col-span-7 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-extrabold text-[#2A0E3F] uppercase tracking-wider flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#6B2D8C]" />
                <span>Core Trust Verification Factors</span>
              </h4>
              <span className="text-[11px] font-bold text-[#6B2D8C] bg-[#F5EEF8] px-2.5 py-0.5 rounded-full border border-[#D9C3E8]">
                5 / 5 Factors Verified
              </span>
            </div>

            {/* Factor Highlights Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Factor 1: GST Verified */}
              <div
                onMouseEnter={() => setActiveFactorHover('gst')}
                onMouseLeave={() => setActiveFactorHover(null)}
                className={`p-3 rounded-xl border transition-all duration-200 cursor-default ${
                  activeFactorHover === 'gst'
                    ? 'bg-[#F5EEF8] border-[#6B2D8C] shadow-3xs'
                    : 'bg-emerald-50/60 border-emerald-200/80 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-300/80">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-950 block">
                        GST Registration
                      </span>
                      <span className="text-[12px] font-bold text-[#2A0E3F] font-mono block">
                        {isGstVerified ? gstin : 'Pending'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300">
                    +25 Pts
                  </span>
                </div>
                <p className="text-[10.5px] text-[#5B4A6E] mt-2 font-medium leading-tight">
                  Active GSTIN corporate tax filing verified with government database.
                </p>
              </div>

              {/* Factor 2: OEM Certified */}
              <div
                onMouseEnter={() => setActiveFactorHover('oem')}
                onMouseLeave={() => setActiveFactorHover(null)}
                className={`p-3 rounded-xl border transition-all duration-200 cursor-default ${
                  activeFactorHover === 'oem'
                    ? 'bg-[#F5EEF8] border-[#6B2D8C] shadow-3xs'
                    : 'bg-purple-50/60 border-purple-200/80 hover:border-purple-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-100 text-[#6B2D8C] flex items-center justify-center shrink-0 border border-purple-200">
                      <Award className="w-4 h-4 text-[#6B2D8C]" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-950 block">
                        OEM &amp; GMP Status
                      </span>
                      <span className="text-[12px] font-bold text-[#2A0E3F] block truncate max-w-[130px]">
                        {mainOemCertName}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold text-[#6B2D8C] bg-purple-100/80 px-2 py-0.5 rounded border border-purple-200">
                    +25 Pts
                  </span>
                </div>
                <p className="text-[10.5px] text-[#5B4A6E] mt-2 font-medium leading-tight">
                  WHO-GMP &amp; ISO 22716 cleanroom cosmetic formulation certified.
                </p>
              </div>

              {/* Factor 3: Business Age */}
              <div
                onMouseEnter={() => setActiveFactorHover('age')}
                onMouseLeave={() => setActiveFactorHover(null)}
                className={`p-3 rounded-xl border transition-all duration-200 cursor-default ${
                  activeFactorHover === 'age'
                    ? 'bg-[#F5EEF8] border-[#6B2D8C] shadow-3xs'
                    : 'bg-amber-50/60 border-amber-200/80 hover:border-amber-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 border border-amber-300/80">
                      <Calendar className="w-4 h-4 text-amber-800" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-950 block">
                        Business Age
                      </span>
                      <span className="text-[12px] font-bold text-[#2A0E3F] block">
                        {yearsInBusiness}+ Years (Est. {birthYear})
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300">
                    +20 Pts
                  </span>
                </div>
                <p className="text-[10.5px] text-[#5B4A6E] mt-2 font-medium leading-tight">
                  Long-standing manufacturing operations &amp; proven supply stability.
                </p>
              </div>

              {/* Factor 4: Physical Site Audit */}
              <div
                onMouseEnter={() => setActiveFactorHover('site')}
                onMouseLeave={() => setActiveFactorHover(null)}
                className={`p-3 rounded-xl border transition-all duration-200 cursor-default ${
                  activeFactorHover === 'site'
                    ? 'bg-[#F5EEF8] border-[#6B2D8C] shadow-3xs'
                    : 'bg-blue-50/60 border-blue-200/80 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center shrink-0 border border-blue-200">
                      <MapPin className="w-4 h-4 text-blue-800" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-950 block">
                        Site Audit Passed
                      </span>
                      <span className="text-[12px] font-bold text-[#2A0E3F] block">
                        SGS Onsite Verified
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold text-blue-900 bg-blue-100/80 px-2 py-0.5 rounded border border-blue-200">
                    +15 Pts
                  </span>
                </div>
                <p className="text-[10.5px] text-[#5B4A6E] mt-2 font-medium leading-tight">
                  In-person physical facility &amp; equipment audit confirmed.
                </p>
              </div>
            </div>

            {/* Bottom Toggle / CTA Button */}
            <div className="pt-2 flex items-center justify-between border-t border-[#F4F0E9] mt-1">
              <button
                type="button"
                onClick={() => setShowFactorDetails(!showFactorDetails)}
                className="text-xs font-bold text-[#6B2D8C] hover:text-[#4A2560] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>{showFactorDetails ? 'Hide Comprehensive Breakdown' : 'View Full Factor Score Breakdown'}</span>
                {showFactorDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {onViewCertificates && (
                <button
                  type="button"
                  onClick={onViewCertificates}
                  className="text-xs font-bold text-[#2A0E3F] hover:text-[#6B2D8C] underline underline-offset-4 transition-colors cursor-pointer"
                >
                  View Scanned Certificates &rarr;
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Expanded Factor Score Table Breakdown */}
        {showFactorDetails && (
          <div className="mt-6 pt-5 border-t border-[#E8DEEF] animate-in fade-in duration-300">
            <h5 className="text-xs font-extrabold text-[#2A0E3F] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-[#6B2D8C]" />
              <span>Trust Index Factor Scorecard</span>
            </h5>

            <div className="space-y-2.5">
              {trustFactors.map((factor) => {
                const IconComponent = factor.icon;
                const percentage = Math.round((factor.scorePoints / factor.maxPoints) * 100);

                return (
                  <div
                    key={factor.id}
                    className="p-3 bg-[#FDFBF7] rounded-xl border border-[#E8DEEF] hover:border-[#D9C3E8] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-8 h-8 rounded-xl bg-[#F5EEF8] border border-[#D9C3E8] flex items-center justify-center shrink-0 mt-0.5 text-[#6B2D8C]">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-[#2A0E3F]">{factor.label}</span>
                          <span className="text-[10px] font-extrabold px-2 py-0.2 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                            {factor.badgeTag}
                          </span>
                        </div>
                        <p className="text-[11.5px] text-[#5B4A6E] mt-0.5 font-medium">
                          {factor.value} &bull; <span className="text-[#7E6C96]">{factor.description}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <div className="w-24 bg-gray-200 rounded-full h-2 overflow-hidden border border-gray-300/60 hidden md:block">
                        <div
                          className="bg-gradient-to-r from-[#8236A0] to-[#6B2D8C] h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-black text-[#2A0E3F] font-mono bg-white px-2.5 py-1 rounded-lg border border-[#E8DEEF]">
                        {factor.scorePoints} / {factor.maxPoints} pts
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
