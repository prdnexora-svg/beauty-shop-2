import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import {
  TrendingUp,
  ArrowUpRight,
  Filter,
  Calendar,
  Sparkles,
  Scissors,
  Factory,
  Package,
  Armchair,
  Layers,
  Send,
  Search,
  CheckCircle2,
  Download,
  Info,
  ShieldCheck
} from 'lucide-react';

interface SourcingTrendsDashboardProps {
  onOpenRFQModal: () => void;
  onNavigateToCategory: (categoryName: string) => void;
}

// 6-Month demand trend data (March 2026 - August 2026)
const MONTHLY_DEMAND_DATA = [
  {
    month: 'Mar 2026',
    shortMonth: 'Mar',
    skincare: 1420,
    haircare: 1100,
    oem: 890,
    packaging: 650,
    salonEquipment: 480,
    totalRFQs: 4540,
    dealValueLakhs: 412,
    topKeyword: 'Niacinamide 10% Base'
  },
  {
    month: 'Apr 2026',
    shortMonth: 'Apr',
    skincare: 1680,
    haircare: 1320,
    oem: 1080,
    packaging: 780,
    salonEquipment: 540,
    totalRFQs: 5400,
    dealValueLakhs: 495,
    topKeyword: 'Rosemary Scalp Drops'
  },
  {
    month: 'May 2026',
    shortMonth: 'May',
    skincare: 2050,
    haircare: 1610,
    oem: 1340,
    packaging: 960,
    salonEquipment: 620,
    totalRFQs: 6580,
    dealValueLakhs: 618,
    topKeyword: 'Peptide Barrier Cream'
  },
  {
    month: 'Jun 2026',
    shortMonth: 'Jun',
    skincare: 2420,
    haircare: 1950,
    oem: 1650,
    packaging: 1140,
    salonEquipment: 730,
    totalRFQs: 7890,
    dealValueLakhs: 742,
    topKeyword: 'Airless PCR Pumps'
  },
  {
    month: 'Jul 2026',
    shortMonth: 'Jul',
    skincare: 2810,
    haircare: 2310,
    oem: 1980,
    packaging: 1380,
    salonEquipment: 860,
    totalRFQs: 9340,
    dealValueLakhs: 890,
    topKeyword: 'Keratin Lab Formulations'
  },
  {
    month: 'Aug 2026',
    shortMonth: 'Aug',
    skincare: 3240,
    haircare: 2680,
    oem: 2280,
    packaging: 1560,
    salonEquipment: 990,
    totalRFQs: 10750,
    dealValueLakhs: 1045,
    topKeyword: 'Ceramide Body Barrier Milk'
  }
];

// 6-Month category performance comparison metrics
const CATEGORY_METRICS = [
  {
    id: 'skincare',
    name: 'Skincare & Actives',
    color: '#B90064',
    growthPct: '+128%',
    currentVolume: '3,240 RFQs/mo',
    avgDealMoq: '1,200 Units',
    avgUnitPrice: '₹280 - ₹650',
    topTrendingSub: 'Peptides & Ceramide Creams',
    icon: Sparkles
  },
  {
    id: 'haircare',
    name: 'Haircare & Scalp Tech',
    color: '#E6007E',
    growthPct: '+143%',
    currentVolume: '2,680 RFQs/mo',
    avgDealMoq: '500 Liters',
    avgUnitPrice: '₹350 - ₹1,200/L',
    topTrendingSub: 'Rosemary Peptide Drops & Keratin',
    icon: Scissors
  },
  {
    id: 'oem',
    name: 'OEM / Private Label',
    color: '#0050D6',
    growthPct: '+156%',
    currentVolume: '2,280 RFQs/mo',
    avgDealMoq: '3,000 Units',
    avgUnitPrice: '₹140 - ₹420',
    topTrendingSub: 'Turnkey Clinical Formulations',
    icon: Factory
  },
  {
    id: 'packaging',
    name: 'Eco & Luxury Packaging',
    color: '#059669',
    growthPct: '+140%',
    currentVolume: '1,560 RFQs/mo',
    avgDealMoq: '5,000 Units',
    avgUnitPrice: '₹22 - ₹95',
    topTrendingSub: 'PCR Airless Pumps & Frosted Glass',
    icon: Package
  },
  {
    id: 'salonEquipment',
    name: 'Salon & Spa Devices',
    color: '#D97706',
    growthPct: '+106%',
    currentVolume: '990 RFQs/mo',
    avgDealMoq: '10 Sets',
    avgUnitPrice: '₹15,000 - ₹95,000',
    topTrendingSub: 'Ozone Hair Spas & Hydraulic Chairs',
    icon: Armchair
  }
];

// Growth velocity chart dataset
const VELOCITY_DATA = [
  { name: 'OEM / Private Label', growth: 156, fill: '#0050D6' },
  { name: 'Haircare & Scalp', growth: 143, fill: '#E6007E' },
  { name: 'Eco Packaging', growth: 140, fill: '#059669' },
  { name: 'Skincare Actives', growth: 128, fill: '#B90064' },
  { name: 'Salon Devices', growth: 106, fill: '#D97706' }
];

export const SourcingTrendsDashboard: React.FC<SourcingTrendsDashboardProps> = ({
  onOpenRFQModal,
  onNavigateToCategory
}) => {
  const [metricMode, setMetricMode] = useState<'rfqs' | 'dealValue'>('rfqs');
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>('all');
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);

  // Active series visibility
  const [visibleSeries, setVisibleSeries] = useState({
    skincare: true,
    haircare: true,
    oem: true,
    packaging: true,
    salonEquipment: true
  });

  const toggleSeries = (key: keyof typeof visibleSeries) => {
    setVisibleSeries((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Summary KPIs for the 6-month period
  const kpis = useMemo(() => {
    const startRFQs = MONTHLY_DEMAND_DATA[0].totalRFQs;
    const endRFQs = MONTHLY_DEMAND_DATA[MONTHLY_DEMAND_DATA.length - 1].totalRFQs;
    const overallGrowth = Math.round(((endRFQs - startRFQs) / startRFQs) * 100);

    const totalDeals = MONTHLY_DEMAND_DATA.reduce((acc, curr) => acc + curr.dealValueLakhs, 0);

    return {
      totalRFQs6Mo: '44,500+',
      overallGrowth: `+${overallGrowth}%`,
      totalDealValue: `₹${(totalDeals / 100).toFixed(1)} Cr`,
      topSourcedCategory: 'Skincare Actives (30%)',
      fastestGrowing: 'OEM Private Label (+156%)'
    };
  }, []);

  return (
    <div id="sourcing-trends-dashboard" className="bg-[#fdf8f8] py-10 border-b border-[#e8e8e8]">
      <div className="max-w-[1440px] mx-auto px-5 md:px-10">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-4 border-b border-[#e8e8e8] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 bg-[#fde7f3] text-[#b90064] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                <TrendingUp className="w-3.5 h-3.5" />
                Live B2B Market Intelligence
              </span>
              <span className="text-xs text-[#8c7077] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#594047]" />
                Last 6 Months (Mar – Aug 2026)
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1c1b1b] tracking-tight">
              Sourcing Trends &amp; Demand Growth
            </h2>
            <p className="text-sm text-[#594047] max-w-2xl mt-1">
              Real-time analysis of verified buyer inquiries, contract volumes, and private label formulation requests across India's beauty manufacturing network.
            </p>
          </div>

          {/* Metric Selector & CTA */}
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#f0edec] p-1 rounded-xl border border-[#e8e8e8]">
              <button
                onClick={() => setMetricMode('rfqs')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  metricMode === 'rfqs'
                    ? 'bg-white text-[#b90064] shadow-2xs'
                    : 'text-[#594047] hover:text-[#1c1b1b]'
                }`}
              >
                Inquiry Volume (RFQs)
              </button>
              <button
                onClick={() => setMetricMode('dealValue')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  metricMode === 'dealValue'
                    ? 'bg-white text-[#0050d6] shadow-2xs'
                    : 'text-[#594047] hover:text-[#1c1b1b]'
                }`}
              >
                Demand Value (₹ Lakhs)
              </button>
            </div>

            <button
              onClick={onOpenRFQModal}
              className="bg-[#b90064] hover:bg-[#8e004b] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-98"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Post Requirement</span>
            </button>
          </div>
        </div>

        {/* 4 Key Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-[#e8e8e8] shadow-2xs">
            <span className="text-[11px] font-bold text-[#8c7077] uppercase tracking-wider block mb-1">
              6-Month Inquiry Growth
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-[#1c1b1b]">{kpis.overallGrowth}</span>
              <span className="text-xs font-bold text-[#059669] flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" /> Surge
              </span>
            </div>
            <span className="text-xs text-[#594047] mt-1 block">From 4,540 to 10,750 RFQs/mo</span>
          </div>

          <div className="bg-white rounded-xl p-4 border border-[#e8e8e8] shadow-2xs">
            <span className="text-[11px] font-bold text-[#8c7077] uppercase tracking-wider block mb-1">
              Cumulative Sourcing Value
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-[#0050d6]">{kpis.totalDealValue}</span>
              <span className="text-xs font-semibold text-[#8c7077]">B2B Deals</span>
            </div>
            <span className="text-xs text-[#594047] mt-1 block">Verified commercial contracts</span>
          </div>

          <div className="bg-white rounded-xl p-4 border border-[#e8e8e8] shadow-2xs">
            <span className="text-[11px] font-bold text-[#8c7077] uppercase tracking-wider block mb-1">
              Fastest Surging Segment
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-lg sm:text-xl font-bold text-[#b90064]">OEM / Private Label</span>
            </div>
            <span className="text-xs text-[#059669] font-bold mt-1 block">+156% Growth (Highest)</span>
          </div>

          <div className="bg-white rounded-xl p-4 border border-[#e8e8e8] shadow-2xs">
            <span className="text-[11px] font-bold text-[#8c7077] uppercase tracking-wider block mb-1">
              Top Sourced Formulation
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-sm sm:text-base font-bold text-[#1c1b1b] truncate">
                Peptide &amp; Scalp Drops
              </span>
            </div>
            <span className="text-xs text-[#594047] mt-1 block">3,240 RFQs in August 2026</span>
          </div>
        </div>

        {/* Main Charts Grid: 6-Month Timeline Area Chart & Growth Velocity Bar Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Left 2 Cols: 6-Month Category Sourcing Demand Area Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#e8e8e8] shadow-2xs flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="text-base font-bold text-[#1c1b1b]">
                  {metricMode === 'rfqs'
                    ? 'Monthly Sourcing Inquiry Volume by Category'
                    : 'Monthly Estimated Sourcing Demand Value (₹ Lakhs)'}
                </h3>
                <p className="text-xs text-[#8c7077] mt-0.5">
                  Click on any category in the legend below to filter the timeline view
                </p>
              </div>

              {/* Quick toggle chips */}
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_METRICS.map((cat) => {
                  const key = cat.id as keyof typeof visibleSeries;
                  const isVisible = visibleSeries[key];
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleSeries(key)}
                      style={{
                        borderColor: isVisible ? cat.color : '#e8e8e8',
                        backgroundColor: isVisible ? `${cat.color}15` : '#f7f2f2',
                        color: isVisible ? cat.color : '#8c7077'
                      }}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: isVisible ? cat.color : '#8c7077' }}
                      />
                      {cat.name.split(' ')[0]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recharts Area Chart Container */}
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={MONTHLY_DEMAND_DATA}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSkincare" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#B90064" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#B90064" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorHaircare" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E6007E" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#E6007E" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorOem" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0050D6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#0050D6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorPackaging" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorSalon" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D97706" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#D97706" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#f0edec" vertical={false} />
                  <XAxis
                    dataKey="shortMonth"
                    stroke="#8c7077"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#e8e8e8' }}
                  />
                  <YAxis
                    stroke="#8c7077"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `${val}`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const item = MONTHLY_DEMAND_DATA.find((d) => d.shortMonth === label);
                        return (
                          <div className="bg-[#1c1b1b] text-white p-3.5 rounded-xl shadow-xl border border-[#313030] text-xs max-w-xs">
                            <div className="flex items-center justify-between border-b border-[#313030] pb-2 mb-2">
                              <span className="font-bold text-sm text-[#fcba03]">{item?.month}</span>
                              <span className="text-[11px] text-[#a09095]">
                                Total: <strong className="text-white">{item?.totalRFQs.toLocaleString()} RFQs</strong>
                              </span>
                            </div>
                            <div className="space-y-1.5">
                              {payload.map((entry: any) => (
                                <div key={entry.name} className="flex items-center justify-between gap-4">
                                  <span className="flex items-center gap-1.5 text-[#d4c5c9]">
                                    <span
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: entry.color }}
                                    />
                                    {entry.name}:
                                  </span>
                                  <span className="font-bold text-white">
                                    {entry.value.toLocaleString()} {metricMode === 'rfqs' ? 'RFQs' : 'Lakhs'}
                                  </span>
                                </div>
                              ))}
                            </div>
                            {item?.topKeyword && (
                              <div className="mt-2.5 pt-2 border-t border-[#313030] text-[11px] text-[#e0bec6]">
                                🔥 Top Sourced: <strong className="text-white">{item.topKeyword}</strong>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  {visibleSeries.skincare && (
                    <Area
                      type="monotone"
                      dataKey="skincare"
                      name="Skincare"
                      stroke="#B90064"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorSkincare)"
                    />
                  )}
                  {visibleSeries.haircare && (
                    <Area
                      type="monotone"
                      dataKey="haircare"
                      name="Haircare"
                      stroke="#E6007E"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorHaircare)"
                    />
                  )}
                  {visibleSeries.oem && (
                    <Area
                      type="monotone"
                      dataKey="oem"
                      name="OEM Private Label"
                      stroke="#0050D6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorOem)"
                    />
                  )}
                  {visibleSeries.packaging && (
                    <Area
                      type="monotone"
                      dataKey="packaging"
                      name="Packaging"
                      stroke="#059669"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorPackaging)"
                    />
                  )}
                  {visibleSeries.salonEquipment && (
                    <Area
                      type="monotone"
                      dataKey="salonEquipment"
                      name="Salon Devices"
                      stroke="#D97706"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorSalon)"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Bottom summary indicator */}
            <div className="pt-3 border-t border-[#e8e8e8] flex flex-wrap items-center justify-between text-xs text-[#594047] gap-2">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#0050d6]" />
                All RFQs verified through GST &amp; Business credentials
              </span>
              <span className="font-semibold text-[#b90064]">
                Current Peak: 10,750 Inquiries in August 2026
              </span>
            </div>
          </div>

          {/* Right Col: 6-Month Growth Velocity Comparison (Bar Chart) */}
          <div className="bg-white rounded-2xl p-6 border border-[#e8e8e8] shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-bold text-[#1c1b1b]">6-Month Growth Velocity</h3>
                <span className="text-xs font-bold text-[#059669] bg-[#e6f4ea] px-2 py-0.5 rounded">
                  Avg +134%
                </span>
              </div>
              <p className="text-xs text-[#8c7077] mb-4">
                Percentage increase in supplier requests from Mar 2026 to Aug 2026
              </p>

              {/* Horizontal Bar Representation */}
              <div className="h-[230px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={VELOCITY_DATA}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0edec" horizontal={false} />
                    <XAxis type="number" domain={[0, 180]} tickFormatter={(v) => `${v}%`} stroke="#8c7077" fontSize={11} />
                    <YAxis dataKey="name" type="category" stroke="#1c1b1b" fontSize={11} width={95} tickLine={false} />
                    <Tooltip
                      formatter={(value: any) => [`+${value}% Demand Surge`, '6-Mo Growth']}
                      contentStyle={{ backgroundColor: '#1c1b1b', borderColor: '#313030', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                      itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="growth" radius={[0, 6, 6, 0]}>
                      {VELOCITY_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Sourcing Prompt */}
            <div className="bg-[#fdf8f8] rounded-xl p-3 border border-[#e0bec6] mt-4">
              <span className="text-[11px] font-bold text-[#b90064] uppercase tracking-wider block mb-1">
                Buyer Recommendation
              </span>
              <p className="text-xs text-[#1c1b1b] leading-snug">
                OEM formulation lead times are tightening. Post advance quarterly batches early to lock manufacturer pricing.
              </p>
            </div>
          </div>

        </div>

        {/* Detailed Category Intelligence Breakdown Cards */}
        <div className="border-t border-[#e8e8e8] pt-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-[#1c1b1b]">
                Category-Wise Sourcing Profiles
              </h3>
              <p className="text-xs text-[#594047]">
                Benchmark minimum order quantities (MOQ), average factory unit costs, and fast-moving formulations
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {CATEGORY_METRICS.map((cat) => {
              const IconComp = cat.icon;
              return (
                <div
                  key={cat.id}
                  className="bg-white rounded-xl border border-[#e8e8e8] p-5 shadow-2xs hover:border-[#8c7077] hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
                          style={{ backgroundColor: cat.color }}
                        >
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-[15px] text-[#1c1b1b] group-hover:text-[#b90064] transition-colors">
                            {cat.name}
                          </h4>
                          <span className="text-xs text-[#594047]">{cat.currentVolume}</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#059669] bg-[#e6f4ea] px-2 py-0.5 rounded-full">
                        {cat.growthPct}
                      </span>
                    </div>

                    {/* Specification Specs Table */}
                    <div className="bg-[#f7f2f2] rounded-lg p-3 my-3 space-y-2 text-xs border border-[#e8e8e8]/60">
                      <div className="flex justify-between">
                        <span className="text-[#8c7077]">Standard MOQ:</span>
                        <strong className="text-[#1c1b1b]">{cat.avgDealMoq}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8c7077]">Factory Cost:</span>
                        <strong className="text-[#b90064]">{cat.avgUnitPrice}</strong>
                      </div>
                      <div className="pt-2 border-t border-[#e8e8e8] flex justify-between items-start">
                        <span className="text-[#8c7077]">Top Demanded:</span>
                        <span className="font-semibold text-[#1c1b1b] text-right ml-2 line-clamp-1">
                          {cat.topTrendingSub}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => onNavigateToCategory(cat.name.split(' ')[0])}
                      className="flex-1 bg-white hover:bg-[#f0edec] border border-[#e8e8e8] text-[#1c1b1b] font-bold text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <Search className="w-3.5 h-3.5 text-[#594047]" />
                      Explore Suppliers
                    </button>
                    <button
                      onClick={onOpenRFQModal}
                      className="bg-[#b90064] hover:bg-[#8e004b] text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-2xs"
                      title="Post RFQ in this Category"
                    >
                      <Send className="w-3.5 h-3.5" />
                      RFQ
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
