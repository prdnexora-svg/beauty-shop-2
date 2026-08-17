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
  AlertCircle
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
                    <button className="text-[12px] font-bold text-[#0050d6] hover:underline flex items-center gap-1">
                      Compare Side-by-Side
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
    </div>
  );
};
