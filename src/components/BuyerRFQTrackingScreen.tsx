import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  MessageSquare, 
  FileText, 
  MoreVertical,
  ChevronRight,
  TrendingUp,
  Building2,
  Tag,
  ArrowRight,
  Download,
  Eye,
  AlertCircle,
  X,
  Scale,
  Truck,
  FlaskConical,
  TrendingDown
} from 'lucide-react';

interface RFQTrackingScreenProps {
  onBack: () => void;
  onNavigateToChat: (supplierId: string) => void;
}

export const BuyerRFQTrackingScreen: React.FC<RFQTrackingScreenProps> = ({ 
  onBack,
  onNavigateToChat
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'quoted' | 'closed'>('all');
  const [selectedRfqId, setSelectedRfqId] = useState<string | null>(null);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Mock RFQ Data
  const MOCK_RFQS = [
    {
      id: 'RFQ-8821',
      product: 'Vitamin C Brightening Serum (Bulk)',
      category: 'Skincare',
      date: '24 May 2024',
      status: 'Quoted',
      responses: 5,
      quotes: 3,
      quantity: '5,000 Units',
      targetPrice: '₹180 - ₹220 / unit',
      urgency: 'Standard'
    },
    {
      id: 'RFQ-8819',
      product: 'Professional Hair Spa Steamer',
      category: 'Salon Equipment',
      date: '22 May 2024',
      status: 'Pending',
      responses: 12,
      quotes: 0,
      quantity: '15 Units',
      targetPrice: '₹8,500 / unit',
      urgency: 'Immediate'
    },
    {
      id: 'RFQ-8790',
      product: 'Eco-friendly Glass Dropper Bottles (30ml)',
      category: 'Packaging',
      date: '15 May 2024',
      status: 'Closed',
      responses: 8,
      quotes: 6,
      quantity: '20,000 Units',
      targetPrice: '₹12 / unit',
      urgency: 'Standard'
    }
  ];

  // Mock Quotes for Detail View
  const MOCK_QUOTES = [
    {
      id: 'QT-101',
      supplier: 'Aura Beauty Labs',
      location: 'Mumbai, MH',
      price: '₹195',
      moq: '2,000 Units',
      leadTime: '15 Days',
      rating: 4.8,
      verified: true,
      features: ['Free Sample', 'ISO Certified']
    },
    {
      id: 'QT-102',
      supplier: 'Dermaglow India',
      location: 'Ahmedabad, GJ',
      price: '₹188',
      moq: '5,000 Units',
      leadTime: '25 Days',
      rating: 4.5,
      verified: true,
      features: ['Bulk Discount']
    },
    {
      id: 'QT-103',
      supplier: 'Radiant Cosmeceuticals',
      location: 'Noida, UP',
      price: '₹210',
      moq: '1,000 Units',
      leadTime: '10 Days',
      rating: 4.9,
      verified: false,
      features: ['Express Shipping']
    }
  ];

  const filteredRfqs = activeTab === 'all' 
    ? MOCK_RFQS 
    : MOCK_RFQS.filter(r => r.status.toLowerCase() === activeTab);

  return (
    <div className="min-h-screen bg-[#fdf8f8] pt-6 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="space-y-1">
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-[#b90064] font-bold text-[13px] hover:underline mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            <h1 className="text-3xl font-black text-[#1c1b1b] tracking-tight">Requirement Tracking</h1>
            <p className="text-[14px] text-[#594047]">Manage your active RFQs and compare supplier quotes in real-time.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="px-5 py-2.5 bg-white border border-[#e8e8e8] rounded-xl text-[13px] font-bold text-[#1c1b1b] flex items-center gap-2 hover:bg-[#fcf9f8] transition-all">
              <Download className="w-4 h-4" />
              Export Data
            </button>
            <button className="px-5 py-2.5 bg-[#b90064] text-white rounded-xl text-[13px] font-black flex items-center gap-2 hover:bg-[#8e004b] transition-all shadow-md">
              <TrendingUp className="w-4 h-4" />
              Post New RFQ
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* RFQ List Column */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Search & Tabs */}
            <div className="bg-white border border-[#e8e8e8] rounded-2xl p-4 shadow-sm space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c7077]" />
                <input 
                  type="text"
                  placeholder="Search requirements..."
                  className="w-full pl-10 pr-4 py-2 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-[12px] font-bold focus:outline-none focus:border-[#b90064]"
                />
              </div>
              
              <div className="flex items-center p-1 bg-[#fcf9f8] rounded-lg border border-[#e8e8e8]">
                {['all', 'pending', 'quoted', 'closed'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`flex-1 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-md transition-all ${
                      activeTab === tab 
                        ? 'bg-white text-[#b90064] shadow-sm' 
                        : 'text-[#8c7077] hover:text-[#1c1b1b]'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* RFQ Cards */}
            <div className="space-y-4">
              {filteredRfqs.map((rfq) => (
                <button
                  key={rfq.id}
                  onClick={() => setSelectedRfqId(rfq.id)}
                  className={`w-full text-left bg-white border rounded-2xl p-5 transition-all group ${
                    selectedRfqId === rfq.id 
                      ? 'border-[#b90064] ring-2 ring-[#fde7f3]' 
                      : 'border-[#e8e8e8] hover:border-[#b90064]/40 shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-black text-[#8c7077] uppercase tracking-widest">{rfq.id}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                      rfq.status === 'Quoted' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      rfq.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                      'bg-gray-50 text-gray-700 border-gray-100'
                    }`}>
                      {rfq.status}
                    </span>
                  </div>
                  <h3 className="text-[14px] font-bold text-[#1c1b1b] group-hover:text-[#b90064] transition-colors mb-2">{rfq.product}</h3>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="space-y-0.5">
                      <p className="text-[9px] text-[#8c7077] uppercase font-black">Responses</p>
                      <p className="text-[13px] font-black text-[#1c1b1b] flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-[#b90064]" />
                        {rfq.responses}
                      </p>
                    </div>
                    <div className="space-y-0.5 text-right">
                      <p className="text-[9px] text-[#8c7077] uppercase font-black">Quotes</p>
                      <p className="text-[13px] font-black text-[#1c1b1b] flex items-center justify-end gap-1.5">
                        {rfq.quotes}
                        <FileText className="w-3.5 h-3.5 text-[#0050d6]" />
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Detail View Column */}
          <div className="lg:col-span-2">
            {!selectedRfqId ? (
              <div className="h-full min-h-[400px] bg-white border border-[#e8e8e8] rounded-3xl flex flex-col items-center justify-center p-12 text-center border-dashed">
                <div className="w-16 h-16 bg-[#fcf9f8] rounded-2xl flex items-center justify-center text-[#8c7077] mb-4">
                  <Eye className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-[#1c1b1b]">Select a requirement to view details</h3>
                <p className="text-[14px] text-[#594047] max-w-xs mt-2">Track responses, compare official quotes, and communicate with verified suppliers.</p>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-300">
                
                {/* Active Selection Header */}
                <div className="bg-white border border-[#e8e8e8] rounded-3xl p-8 shadow-sm">
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-[#fcf9f8] border border-[#e8e8e8] rounded-lg text-[11px] font-black text-[#b90064] uppercase tracking-wider">
                          {MOCK_RFQS.find(r => r.id === selectedRfqId)?.id}
                        </span>
                        <span className="flex items-center gap-1 text-[12px] text-[#594047] font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          Posted on {MOCK_RFQS.find(r => r.id === selectedRfqId)?.date}
                        </span>
                      </div>
                      <h2 className="text-2xl font-black text-[#1c1b1b]">{MOCK_RFQS.find(r => r.id === selectedRfqId)?.product}</h2>
                      <div className="flex flex-wrap gap-6">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-[#8c7077]" />
                          <span className="text-[13px] font-bold text-[#1c1b1b]">{MOCK_RFQS.find(r => r.id === selectedRfqId)?.quantity}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-[#8c7077]" />
                          <span className="text-[13px] font-bold text-[#1c1b1b]">{MOCK_RFQS.find(r => r.id === selectedRfqId)?.targetPrice}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-[13px] font-black hover:bg-emerald-700 transition-all shadow-sm">
                        Accept Final Quote
                      </button>
                      <button className="px-6 py-2.5 bg-white border border-[#e8e8e8] text-[#594047] rounded-xl text-[13px] font-bold hover:bg-[#fcf9f8] transition-all">
                        Edit Requirement
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quotes Table / Comparison */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-[#1c1b1b] flex items-center gap-2">
                      Received Quotes
                      <span className="text-[12px] font-bold px-2 py-0.5 bg-[#fde7f3] text-[#b90064] rounded-full">3</span>
                    </h3>
                    <button 
                      onClick={() => setIsCompareModalOpen(true)}
                      className="text-[12px] font-bold text-[#b90064] hover:text-[#8e004b] hover:underline flex items-center gap-1 cursor-pointer bg-[#fde7f3] px-3 py-1.5 rounded-xl border border-[#e0bec6] transition-all shadow-xs"
                    >
                      <Scale className="w-4 h-4" />
                      <span>Compare Side-by-Side</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {MOCK_QUOTES.map((quote) => (
                      <div key={quote.id} className="bg-white border border-[#e8e8e8] rounded-2xl overflow-hidden hover:border-[#b90064]/30 transition-all group">
                        <div className="p-6">
                          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl flex items-center justify-center text-[#b90064]">
                                <Building2 className="w-6 h-6" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-[15px] font-bold text-[#1c1b1b]">{quote.supplier}</h4>
                                  {quote.verified && (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  )}
                                </div>
                                <p className="text-[11px] text-[#594047] flex items-center gap-1">
                                  {quote.location} • {quote.rating} ★ Rating
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-8">
                              <div className="space-y-1 text-center">
                                <p className="text-[9px] text-[#8c7077] uppercase font-black">Quote Price</p>
                                <p className="text-[16px] font-black text-[#b90064]">{quote.price}</p>
                              </div>
                              <div className="space-y-1 text-center border-l border-[#e8e8e8] pl-8">
                                <p className="text-[9px] text-[#8c7077] uppercase font-black">Lead Time</p>
                                <p className="text-[14px] font-bold text-[#1c1b1b]">{quote.leadTime}</p>
                              </div>
                              <div className="space-y-1 text-center border-l border-[#e8e8e8] pl-8">
                                <p className="text-[9px] text-[#8c7077] uppercase font-black">MOQ</p>
                                <p className="text-[14px] font-bold text-[#1c1b1b]">{quote.moq}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 w-full md:w-auto">
                              <button 
                                onClick={() => onNavigateToChat(quote.id)}
                                className="flex-1 md:flex-none px-4 py-2 bg-[#fde7f3] text-[#b90064] text-[12px] font-black rounded-lg hover:bg-[#ffd9e2] transition-all flex items-center justify-center gap-2"
                              >
                                <MessageSquare className="w-4 h-4" />
                                Chat
                              </button>
                              <button className="flex-1 md:flex-none px-4 py-2 bg-[#1c1b1b] text-white text-[12px] font-black rounded-lg hover:bg-black transition-all flex items-center justify-center gap-2">
                                <Eye className="w-4 h-4" />
                                View Full Quote
                              </button>
                            </div>

                          </div>

                          {/* Features / Highlights */}
                          <div className="mt-6 pt-4 border-t border-[#fcf9f8] flex flex-wrap gap-2">
                            {quote.features.map((feature, idx) => (
                              <span key={idx} className="px-2.5 py-1 bg-[#fcf9f8] border border-[#e8e8e8] rounded-md text-[10px] font-bold text-[#594047]">
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* No Quotes Empty State Logic would go here */}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* COMPARISON MATRIX MODAL */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#e8e8e8] rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col text-left">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-[#f0edec] bg-[#fcf9f8] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#fde7f3] text-[#b90064] text-[10px] font-black uppercase tracking-wider">Procurement Matrix</span>
                  <span className="text-xs text-[#8c7077] font-semibold">Comparing Quotes for: Vitamin C Brightening Serum (Bulk)</span>
                </div>
                <h3 className="text-xl font-black text-[#1c1b1b]">Side-by-Side Sourcing Comparison Matrix</h3>
              </div>
              <button 
                onClick={() => setIsCompareModalOpen(false)}
                className="p-2 rounded-xl hover:bg-gray-100 text-[#8c7077] transition-all cursor-pointer border border-[#e8e8e8] bg-white shadow-xs"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Comparison Grid */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Informational Alert */}
              <div className="bg-[#fdf8f8] border border-[#b90064]/10 rounded-2xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#b90064] shrink-0 mt-0.5" />
                <div className="text-xs text-[#594047] leading-relaxed">
                  <strong className="text-[#1c1b1b]">Compare and Decisioning Helper:</strong> This side-by-side matrix compares chemical formulations, stability testing reports, batch price scalability, and logistics. Highlighting indicates the best metric in each class to assist your procurement team.
                </div>
              </div>

              {/* Matrix Table */}
              <div className="overflow-x-auto rounded-2xl border border-[#e8e8e8] shadow-sm bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#fcf9f8] border-b border-[#e8e8e8]">
                      <th className="p-4 font-black text-[#1c1b1b] uppercase tracking-wider w-64">Comparison Metrics</th>
                      <th className="p-4 font-black text-[#1c1b1b] uppercase tracking-wider bg-[#b90064]/5 border-x border-[#e8e8e8]">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-[#b90064]" />
                          <span>Aura Beauty Labs (QT-101)</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">Nexora Verified • Mumbai</span>
                      </th>
                      <th className="p-4 font-black text-[#1c1b1b] uppercase tracking-wider border-r border-[#e8e8e8]">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-[#0050d6]" />
                          <span>Dermaglow India (QT-102)</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">Nexora Verified • Ahmedabad</span>
                      </th>
                      <th className="p-4 font-black text-[#1c1b1b] uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-[#594047]" />
                          <span>Radiant Cosmeceuticals (QT-103)</span>
                        </div>
                        <span className="text-[10px] font-bold text-stone-500 block mt-0.5">Self-Verified • Noida</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e8e8e8] font-medium text-[#1c1b1b]">
                    
                    {/* SECTION 1: COMMERCIALS */}
                    <tr className="bg-[#fcf9f8]/40">
                      <td className="p-4 font-black text-[#8c7077] uppercase tracking-widest text-[10px]" colSpan={4}>Commercial Sourcing Metrics</td>
                    </tr>
                    <tr>
                      <td className="p-4 text-[#594047] font-bold">Base Price (Target Qty)</td>
                      <td className="p-4 bg-[#b90064]/5 border-x border-[#e8e8e8]">
                        <span className="text-sm font-black text-[#b90064]">₹195 / unit</span>
                        <span className="text-[10px] text-[#8c7077] block mt-0.5">(for 5,000 Units)</span>
                      </td>
                      <td className="p-4 border-r border-[#e8e8e8] bg-emerald-50 text-emerald-800">
                        <span className="text-sm font-black text-emerald-700">₹188 / unit</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold ml-2">Best Price</span>
                        <span className="text-[10px] text-[#8c7077] block mt-0.5">(for 5,000 Units)</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-black text-stone-700">₹210 / unit</span>
                        <span className="text-[10px] text-[#8c7077] block mt-0.5">(for 5,000 Units)</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 text-[#594047] font-bold">Minimum Order Qty (MOQ)</td>
                      <td className="p-4 bg-[#b90064]/5 border-x border-[#e8e8e8]">2,000 Units</td>
                      <td className="p-4 border-r border-[#e8e8e8]">5,000 Units</td>
                      <td className="p-4 bg-emerald-50 text-emerald-800">
                        <span className="font-bold">1,000 Units</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold ml-2">Lowest MOQ</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 text-[#594047] font-bold">Delivery Lead Time</td>
                      <td className="p-4 bg-[#b90064]/5 border-x border-[#e8e8e8]">15 Days (Air/Express)</td>
                      <td className="p-4 border-r border-[#e8e8e8]">25 Days (Road freight)</td>
                      <td className="p-4 bg-emerald-50 text-emerald-800">
                        <span className="font-bold">10 Days (Direct express)</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold ml-2">Fastest</span>
                      </td>
                    </tr>

                    {/* MOQ SLABS DETAIL */}
                    <tr className="bg-[#fcf9f8]/40">
                      <td className="p-4 font-black text-[#8c7077] uppercase tracking-widest text-[10px]" colSpan={4}>MOQ Price Slabs / Volume Scalability</td>
                    </tr>
                    <tr>
                      <td className="p-4 text-[#594047] font-bold">1,000 Units Price Slab</td>
                      <td className="p-4 bg-[#b90064]/5 border-x border-[#e8e8e8]">₹210 / unit</td>
                      <td className="p-4 text-stone-400 border-r border-[#e8e8e8] italic">Not Available (MOQ 5k)</td>
                      <td className="p-4 font-bold text-stone-800">₹215 / unit</td>
                    </tr>
                    <tr>
                      <td className="p-4 text-[#594047] font-bold">5,000 Units Price Slab</td>
                      <td className="p-4 bg-[#b90064]/5 border-x border-[#e8e8e8]">₹195 / unit</td>
                      <td className="p-4 font-bold text-emerald-700 border-r border-[#e8e8e8]">₹188 / unit</td>
                      <td className="p-4">₹210 / unit</td>
                    </tr>
                    <tr>
                      <td className="p-4 text-[#594047] font-bold">10,000 Units Price Slab</td>
                      <td className="p-4 bg-[#b90064]/5 border-x border-[#e8e8e8]">₹180 / unit</td>
                      <td className="p-4 font-bold text-emerald-700 border-r border-[#e8e8e8] bg-emerald-50">₹175 / unit</td>
                      <td className="p-4">₹198 / unit</td>
                    </tr>

                    {/* TECHNICAL SPECS */}
                    <tr className="bg-[#fcf9f8]/40">
                      <td className="p-4 font-black text-[#8c7077] uppercase tracking-widest text-[10px]" colSpan={4}>Technical & Formulation Specifications</td>
                    </tr>
                    <tr>
                      <td className="p-4 text-[#594047] font-bold">Active Concentration</td>
                      <td className="p-4 bg-[#b90064]/10 border-x border-[#e8e8e8] font-bold text-[#b90064]">
                        10% Stable L-Ascorbic Acid + 2% Ferulic Acid + 1% Vitamin E
                        <span className="block text-[9px] font-black text-[#e6007e] uppercase mt-1">★ Highly Recommended Formulation</span>
                      </td>
                      <td className="p-4 border-r border-[#e8e8e8]">8% Ethyl Ascorbic Acid + 1% Hyaluronic Acid</td>
                      <td className="p-4">12% Sodium Ascorbyl Phosphate + Vitamin E</td>
                    </tr>
                    <tr>
                      <td className="p-4 text-[#594047] font-bold">pH Range & Stability</td>
                      <td className="p-4 bg-[#b90064]/5 border-x border-[#e8e8e8]">3.2 - 3.5 (Highly active, bioavailable)</td>
                      <td className="p-4 border-r border-[#e8e8e8]">3.8 - 4.2 (Extremely gentle, non-sticky)</td>
                      <td className="p-4">5.5 - 6.0 (Highly stable, mild skincare formulation)</td>
                    </tr>
                    <tr>
                      <td className="p-4 text-[#594047] font-bold">Stability Reports</td>
                      <td className="p-4 bg-[#b90064]/5 border-x border-[#e8e8e8] text-emerald-700">Passed 90-day accelerated oven stability testing</td>
                      <td className="p-4 border-r border-[#e8e8e8]">Standard real-time shelf life study (In-Progress)</td>
                      <td className="p-4">Passed 180-day ambient temperature testing</td>
                    </tr>
                    <tr>
                      <td className="p-4 text-[#594047] font-bold">Facility Certifications</td>
                      <td className="p-4 bg-[#b90064]/5 border-x border-[#e8e8e8]">WHO-GMP, ISO 22716, Halal Certified</td>
                      <td className="p-4 border-r border-[#e8e8e8]">GMP, ISO 9001, Cruelty-Free certified</td>
                      <td className="p-4">Ayush Premium Certified, WHO-GMP, Vegan</td>
                    </tr>

                    {/* TERMS AND SAMPLES */}
                    <tr className="bg-[#fcf9f8]/40">
                      <td className="p-4 font-black text-[#8c7077] uppercase tracking-widest text-[10px]" colSpan={4}>Logistics, Shipping & Sample Policies</td>
                    </tr>
                    <tr>
                      <td className="p-4 text-[#594047] font-bold">Custom Sample Policy</td>
                      <td className="p-4 bg-emerald-50 text-emerald-800 border-x border-[#e8e8e8]">
                        <span className="font-bold">Free Custom Sample</span>
                        <span className="block text-[9px] text-[#8c7077] mt-0.5">(Buyer only pays actual courier charges)</span>
                      </td>
                      <td className="p-4 border-r border-[#e8e8e8]">Reimbursed on first production run (₹1,500 upfront)</td>
                      <td className="p-4">Paid custom sample (Deducted from final commercial order)</td>
                    </tr>
                    <tr>
                      <td className="p-4 text-[#594047] font-bold">Logistic Terms</td>
                      <td className="p-4 bg-[#b90064]/5 border-x border-[#e8e8e8]">FOB JNPT Port (Mumbai MH)</td>
                      <td className="p-4 border-r border-[#e8e8e8]">EXW Factory (Ahmedabad GJ)</td>
                      <td className="p-4 bg-emerald-50 text-emerald-800">
                        <span className="font-bold">CIF Destination (PAN India shipping)</span>
                        <span className="block text-[9px] text-[#8c7077] mt-0.5">(In-transit insurance & clearance handled by supplier)</span>
                      </td>
                    </tr>
                    
                  </tbody>
                </table>
              </div>

            </div>

            {/* Modal Footer actions */}
            <div className="p-6 border-t border-[#f0edec] bg-[#fcf9f8] flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-[#594047] font-semibold">
                Direct procurement integration powered by Nexora Luxe trust engines.
              </span>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setIsCompareModalOpen(false)}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-white border border-[#e8e8e8] text-xs font-black text-[#1c1b1b] rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Close Matrix
                </button>
                <button
                  onClick={() => {
                    setIsCompareModalOpen(false);
                    onNavigateToChat('Aura Beauty Labs');
                  }}
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-[#b90064] text-white text-xs font-black rounded-xl hover:bg-[#8e004b] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Negotiate & Chat (Aura Labs)</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
