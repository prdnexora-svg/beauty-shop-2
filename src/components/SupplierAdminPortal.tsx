import React, { useState, useEffect } from 'react';
import { 
  Building2, Sparkles, ShieldCheck, Mail, ArrowRight, Settings, Plus, FileText, 
  TrendingUp, BarChart3, Users, CheckCircle2, ChevronRight, Edit3, Trash2, Check, Upload, Award, RefreshCw,
  Eye, MousePointer, Play, Film, Send, ExternalLink, Activity, MessageSquare, Package
} from 'lucide-react';
import { SponsoredAdManager } from './SponsoredAdManager';
import { SupplierAnalyticsDashboard } from './SupplierAnalyticsDashboard';
import { getStoredSponsoredAnalyticsEvents, SponsoredAnalyticsEvent } from '../data/sponsoredAnalyticsStore';
import { getStoredChatThreads, supplierReplyMessage, ChatThread } from '../data/chatStore';
import { ProductCreationWizard, CatalogProduct } from './ProductCreationWizard';
import { db } from '../db/database';
import { PopulatedRFQEnquiry } from '../db/types';

// Demo tenant: in production this comes from the authenticated supplier session
// and every db read below is scoped by RLS to the supplier's own rows.
const PORTAL_SUPPLIER_ID = 'supp-aura-labs';

const CATALOG_STORAGE_KEY = 'nexora_supplier_catalog_v1';

// Initial seed listings (used only until the supplier saves their own catalog)
const INITIAL_PRODUCTS: CatalogProduct[] = [
  { id: 'sp1', name: 'Peptide Skin Barrier Repair Cream', price: '145', mrp: '180', category: 'Skincare', subcategory: 'Moisturizers & Creams', brand: 'Aura Beauty Labs', stockQty: 2000, unit: 'Pcs', taxRate: '18%', status: 'Active', tags: ['repair', 'barrier'], attributes: [{ label: 'Size', value: '50ml' }], images: [] },
  { id: 'sp2', name: 'Clinical Vitamin C Infused Glow Serum', price: '190', mrp: '220', category: 'Skincare', subcategory: 'Serums & Treatments', brand: 'Aura Beauty Labs', stockQty: 3000, unit: 'Pcs', taxRate: '18%', status: 'Active', tags: ['vitamin-c', 'glow'], attributes: [{ label: 'Size', value: '30ml' }], images: [] },
  { id: 'sp3', name: 'Salicylic Acid Overnight Blemish Gel', price: '110', mrp: '135', category: 'Skincare', subcategory: 'Serums & Treatments', brand: 'Aura Beauty Labs', stockQty: 5000, unit: 'Pcs', taxRate: '18%', status: 'Draft', tags: [], attributes: [], images: [] }
];

function loadStoredCatalog(): CatalogProduct[] {
  try {
    const raw = localStorage.getItem(CATALOG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Corrupt storage — fall back to seed catalog.
  }
  return INITIAL_PRODUCTS;
}

/** Compact relative-time label for lead cards, e.g. "Just now" / "3 hours ago". */
function timeAgoLabel(iso: string): string {
  const then = new Date(iso).getTime();
  if (isNaN(then)) return iso;
  const diffMin = Math.floor((Date.now() - then) / 60000);
  if (diffMin < 2) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}

interface SupplierAdminPortalProps {
  onNavigateToProduct?: (productId: string) => void;
  initialTab?: 'dashboard' | 'products' | 'sponsored-ads' | 'analytics' | 'enquiries' | 'rfqs' | 'verification' | 'chat-hub';
}

export const SupplierAdminPortal: React.FC<SupplierAdminPortalProps> = ({
  onNavigateToProduct,
  initialTab = 'dashboard'
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'sponsored-ads' | 'analytics' | 'enquiries' | 'rfqs' | 'verification' | 'chat-hub'>(initialTab);
  const [analyticsEvents, setAnalyticsEvents] = useState<SponsoredAnalyticsEvent[]>([]);
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [portalReplyText, setPortalReplyText] = useState('');

  useEffect(() => {
    const loadEvents = () => {
      setAnalyticsEvents(getStoredSponsoredAnalyticsEvents());
    };
    const loadChats = () => {
      const threads = getStoredChatThreads();
      setChatThreads(threads);
      if (!selectedChatId && threads.length > 0) {
        setSelectedChatId(threads[0].id);
      }
    };
    loadEvents();
    loadChats();
    window.addEventListener('nexora_analytics_event_recorded', loadEvents);
    window.addEventListener('nexora_chat_updated', loadChats);
    return () => {
      window.removeEventListener('nexora_analytics_event_recorded', loadEvents);
      window.removeEventListener('nexora_chat_updated', loadChats);
    };
  }, []);

  // Supplier Onboarding & Profile Verification states
  const [supplierGst, setSupplierGst] = useState('07AABCU9603R1ZM');
  const [gstVerified, setGstVerified] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Product creation state (Screen 20) — persisted so the catalog survives reloads
  const [products, setProducts] = useState<CatalogProduct[]>(loadStoredCatalog);
  const [showMobileToBuyers, setShowMobileToBuyers] = useState(true);

  useEffect(() => {
    try {
      localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(products));
    } catch {
      // Storage unavailable — catalog remains in-memory for this session.
    }
  }, [products]);

  // Live buyer leads & public sourcing requirements from the relational store.
  // Direct enquiries land here the moment a buyer submits the Enquiry modal;
  // public RFQs arrive from the Post Requirement screen.
  const [liveEnquiries, setLiveEnquiries] = useState<PopulatedRFQEnquiry[]>([]);
  const [liveRfqs, setLiveRfqs] = useState<PopulatedRFQEnquiry[]>([]);

  useEffect(() => {
    const loadLeads = () => {
      const all = db.getRFQsAndEnquiries();
      const sorted = [...all].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
      setLiveEnquiries(sorted.filter((r) => r.type === 'direct_enquiry'));
      setLiveRfqs(sorted.filter((r) => r.type === 'public_rfq'));
    };
    loadLeads();
    const unsubscribe = db.subscribe(() => loadLeads());
    window.addEventListener('nexora-db-change', loadLeads);
    return () => {
      unsubscribe();
      window.removeEventListener('nexora-db-change', loadLeads);
    };
  }, []);

  // Quote form state (Screen 23) — now bound to a real RFQ/enquiry row
  const [selectedRfq, setSelectedRfq] = useState<PopulatedRFQEnquiry | null>(null);
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteLeadTime, setQuoteLeadTime] = useState('');
  const [quoteSubmitted, setQuoteSubmitted] = useState(false);
  const [quoteSentToast, setQuoteSentToast] = useState<string | null>(null);

  const handleVerifyGst = () => {
    if (!supplierGst.trim()) return;
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setGstVerified(true);
    }, 1200);
  };

  const handlePublishProduct = (product: CatalogProduct) => {
    setProducts((prev) => [product, ...prev]);
  };

  const handleSaveDraftProduct = (product: CatalogProduct) => {
    setProducts((prev) => [product, ...prev]);
  };

  const handleSendQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotePrice || !quoteLeadTime || !selectedRfq) return;
    setQuoteSubmitted(true);

    const rfq = selectedRfq;
    const unitPrice = parseFloat(quotePrice.replace(/[^0-9.]/g, '')) || 0;
    const qty = rfq.quantity_required || 1;
    const validity = new Date();
    validity.setDate(validity.getDate() + 14);

    setTimeout(() => {
      try {
        // Persist the commercial quote so the buyer sees it instantly in
        // "My RFQs & Quotes" (BuyerRFQTrackingScreen reads the same store).
        db.createQuote({
          rfq_id: rfq.id,
          supplier_id: PORTAL_SUPPLIER_ID,
          unit_price: unitPrice,
          total_price: unitPrice * qty,
          moq_offered: qty,
          lead_time: quoteLeadTime,
          validity_date: validity.toISOString(),
          terms_and_conditions: 'Standard Nexora Luxe B2B supply terms. 50% advance, balance on dispatch. GST extra as applicable.',
          status: 'submitted',
          sample_available: true,
          notes: `Quoted ${quotePrice} per unit against "${rfq.requirement_title}".`
        });
        if (rfq.status === 'new') {
          db.updateRFQStatus(rfq.id, 'responded');
        }
      } catch (err) {
        console.warn('[SupplierPortal] Quote persistence error handled gracefully', err);
      }
      setQuoteSubmitted(false);
      setSelectedRfq(null);
      setQuotePrice('');
      setQuoteLeadTime('');
      setQuoteSentToast('Commercial quote sent — the buyer can now review it under “My RFQs & Quotes”.');
      setTimeout(() => setQuoteSentToast(null), 4000);
    }, 900);
  };

  return (
    <div className="bg-[#FDFBF7] min-h-screen flex flex-col md:flex-row">
      
      {/* SIDEBAR NAVIGATION */}
      <div className="w-full md:w-64 border-r border-[#E8DEEF] bg-white p-6 space-y-8 shrink-0">
        <div>
          <span className="text-sm font-black text-[#6B2D8C] tracking-tight block">Nexora Luxe</span>
          <span className="text-[10px] text-[#7E6C96] uppercase font-bold tracking-wider">Manufacturer Admin Suite</span>
        </div>

        <nav className="flex flex-col gap-1 text-xs font-bold text-[#5B4A6E]">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-left transition-all cursor-pointer ${
              activeTab === 'dashboard' ? 'bg-[#F5EEF8] text-[#6B2D8C]' : 'hover:bg-neutral-50'
            }`}
          >
            <BarChart3 className="w-4.5 h-4.5" />
            <span>Suite Dashboard</span>
          </button>
          
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-left transition-all cursor-pointer ${
              activeTab === 'products' ? 'bg-[#F5EEF8] text-[#6B2D8C]' : 'hover:bg-neutral-50'
            }`}
          >
            <Plus className="w-4.5 h-4.5" />
            <span>My Catalog ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sponsored-ads')}
            className={`flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all cursor-pointer ${
              activeTab === 'sponsored-ads' ? 'bg-[#F5EEF8] text-[#6B2D8C]' : 'hover:bg-neutral-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4.5 h-4.5 text-[#6B2D8C]" />
              <span>Ad Campaigns</span>
            </div>
            <span className="text-[9px] bg-[#6B2D8C] text-white px-1.5 py-0.5 rounded-full font-bold uppercase">
              Promote
            </span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all cursor-pointer ${
              activeTab === 'analytics' ? 'bg-[#F5EEF8] text-[#6B2D8C]' : 'hover:bg-neutral-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <BarChart3 className="w-4.5 h-4.5 text-[#6B2D8C]" />
              <span>Ad Analytics (Screen 25)</span>
            </div>
            <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold uppercase">
              Live
            </span>
          </button>

          <button
            onClick={() => setActiveTab('enquiries')}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-left transition-all cursor-pointer ${
              activeTab === 'enquiries' ? 'bg-[#F5EEF8] text-[#6B2D8C]' : 'hover:bg-neutral-50'
            }`}
          >
            <Mail className="w-4.5 h-4.5" />
            <span>Buyer Enquiries ({liveEnquiries.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('rfqs')}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-left transition-all cursor-pointer ${
              activeTab === 'rfqs' ? 'bg-[#F5EEF8] text-[#6B2D8C]' : 'hover:bg-neutral-50'
            }`}
          >
            <FileText className="w-4.5 h-4.5" />
            <span>RFQ Marketplace ({liveRfqs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('verification')}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-left transition-all cursor-pointer ${
              activeTab === 'verification' ? 'bg-[#F5EEF8] text-[#6B2D8C]' : 'hover:bg-neutral-50'
            }`}
          >
            <ShieldCheck className="w-4.5 h-4.5" />
            <span>Verification Hub</span>
          </button>

          <button
            onClick={() => setActiveTab('chat-hub')}
            className={`flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all cursor-pointer ${
              activeTab === 'chat-hub' ? 'bg-[#F5EEF8] text-[#6B2D8C]' : 'hover:bg-neutral-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-4.5 h-4.5 text-[#6B2D8C]" />
              <span>Inquiries / Chat Hub</span>
            </div>
            <span className="text-[9px] bg-[#6B2D8C] text-white px-1.5 py-0.5 rounded-full font-bold">
              {chatThreads.length}
            </span>
          </button>
        </nav>
      </div>

      {/* MAIN WORKSPACE CONTENT */}
      <div className="flex-1 p-6 md:p-10 space-y-8 overflow-y-auto">
        
        {/* ================== CHAT HUB TAB ================== */}
        {activeTab === 'chat-hub' && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col md:flex-row h-[70vh]">
            <div className="w-full md:w-80 border-r border-stone-200 bg-stone-50 flex flex-col shrink-0">
              <div className="p-4 border-b border-stone-200 bg-white flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-stone-900">Buyer Chat Threads</h3>
                <span className="text-[10px] bg-purple-100 text-[#6B2D8C] px-2 py-0.5 rounded-full font-bold">
                  {chatThreads.length} Active
                </span>
              </div>
              <div className="overflow-y-auto flex-1 divide-y divide-stone-100">
                {chatThreads.map(thread => {
                  const lastMsg = thread.messages[thread.messages.length - 1];
                  const isSelected = thread.id === selectedChatId;
                  return (
                    <div
                      key={thread.id}
                      onClick={() => setSelectedChatId(thread.id)}
                      className={`p-3.5 cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#F5EEF8] border-l-4 border-[#6B2D8C]' : 'hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-stone-900 truncate">Buyer Thread #{thread.id.slice(-4)}</span>
                        <span className="text-[10px] text-stone-400">{lastMsg?.timestamp || ''}</span>
                      </div>
                      <p className="text-[11px] text-stone-600 truncate font-medium">{lastMsg?.text || 'No messages'}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 flex flex-col bg-white">
              {(() => {
                const currentThread = chatThreads.find(t => t.id === selectedChatId) || chatThreads[0];
                if (!currentThread) {
                  return (
                    <div className="flex-1 flex items-center justify-center text-stone-400 text-xs">
                      No chat threads available.
                    </div>
                  );
                }
                return (
                  <>
                    <div className="p-4 border-b border-stone-200 bg-white flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-extrabold text-stone-900">Live Buyer Sourcing Conversation</h4>
                        <p className="text-[10px] text-emerald-600 font-bold mt-0.5">● Connected with Verified B2B Buyer</p>
                      </div>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FDFBF7]">
                      {currentThread.messages.map(m => (
                        <div key={m.id} className={`flex flex-col ${m.sender === 'supplier' ? 'items-end' : 'items-start'}`}>
                          <span className="text-[9px] text-stone-400 mb-0.5">{m.senderName} • {m.timestamp}</span>
                          <div className={`p-3 rounded-xl text-xs max-w-md ${
                            m.sender === 'supplier' ? 'bg-[#6B2D8C] text-white' : 'bg-white border border-stone-200 text-stone-900'
                          }`}>
                            {m.productContext && (
                              <div className="mb-2 p-2 bg-black/10 rounded text-[11px]">
                                <b>Inquiry Product:</b> {m.productContext.title}
                              </div>
                            )}
                            <p>{m.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-3.5 border-t border-stone-200 bg-white flex items-center gap-2">
                      <input
                        type="text"
                        value={portalReplyText}
                        onChange={(e) => setPortalReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && portalReplyText.trim()) {
                            supplierReplyMessage(currentThread.id, portalReplyText);
                            setPortalReplyText('');
                            setChatThreads(getStoredChatThreads());
                          }
                        }}
                        placeholder="Type reply as Aura Beauty Labs Sales Desk..."
                        className="flex-1 bg-stone-100 border border-stone-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#C9A961]"
                      />
                      <button
                        onClick={() => {
                          if (!portalReplyText.trim()) return;
                          supplierReplyMessage(currentThread.id, portalReplyText);
                          setPortalReplyText('');
                          setChatThreads(getStoredChatThreads());
                        }}
                        className="bg-[#6B2D8C] text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#4A2560] cursor-pointer"
                      >
                        Send Reply
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
        
        {/* UPPER STATUS STRIP */}
        <div className="bg-white border border-[#E8DEEF] p-4.5 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-base font-black text-zinc-900 flex items-center gap-1.5">
              Aura Beauty Labs
              <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold uppercase tracking-wider">GST Verified</span>
            </h2>
            <p className="text-xs text-[#5B4A6E] mt-0.5">Primary Manufacturing Plant: Mumbai High Tech Cosmetic Zone • Est: 2012</p>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-[11px] text-[#5B4A6E] font-semibold">Live Traffic Analytics:</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">98% conversion rating</span>
          </div>
        </div>

        {/* ================== SUITE DASHBOARD TAB ================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4.5 bg-white border border-[#E8DEEF] rounded-xl space-y-1.5 text-center md:text-left">
                <span className="text-[10px] text-[#7E6C96] uppercase font-bold tracking-wider">Catalog Listings</span>
                <span className="text-2xl font-black text-zinc-950 block">{products.length}</span>
              </div>
              <div className="p-4.5 bg-white border border-[#E8DEEF] rounded-xl space-y-1.5 text-center md:text-left">
                <span className="text-[10px] text-[#7E6C96] uppercase font-bold tracking-wider">Active Buyer Leads</span>
                <span className="text-2xl font-black text-[#6B2D8C] block">{liveEnquiries.length + liveRfqs.length}</span>
              </div>
              <div className="p-4.5 bg-white border border-[#E8DEEF] rounded-xl space-y-1.5 text-center md:text-left">
                <span className="text-[10px] text-[#7E6C96] uppercase font-bold tracking-wider">Response Speed</span>
                <span className="text-2xl font-black text-zinc-950 block text-emerald-600">3.5 hrs</span>
              </div>
              <div className="p-4.5 bg-white border border-[#E8DEEF] rounded-xl space-y-1.5 text-center md:text-left">
                <span className="text-[10px] text-[#7E6C96] uppercase font-bold tracking-wider">Monthly Views</span>
                <span className="text-2xl font-black text-zinc-950 block">4,810</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Sourcing Demand Forecast Chart */}
              <div className="bg-white border border-[#E8DEEF] rounded-xl p-5 space-y-4">
                <h3 className="font-extrabold text-xs text-[#7E6C96] uppercase tracking-wider">Sourcing Demand Forecast</h3>
                <div className="h-40 bg-zinc-50 border border-zinc-100 rounded-lg flex items-center justify-center">
                  <span className="text-xs text-[#5B4A6E] font-semibold italic">Monthly volume demand chart in progress...</span>
                </div>
              </div>

              {/* Manufacturing capacity index */}
              <div className="bg-white border border-[#E8DEEF] rounded-xl p-5 space-y-4">
                <h3 className="font-extrabold text-xs text-[#7E6C96] uppercase tracking-wider">Production Capacity &amp; Batches</h3>
                <div className="space-y-4 text-xs">
                  <div>
                    <div className="flex justify-between font-semibold text-zinc-800 mb-1">
                      <span>Lab Stability Queue</span>
                      <span>85% active</span>
                    </div>
                    <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#6B2D8C] h-full w-[85%]"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold text-zinc-800 mb-1">
                      <span>Contract Bulk Formulation</span>
                      <span>60% capacity occupied</span>
                    </div>
                    <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#6B2D8C] h-full w-[60%]"></div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ================== CATALOG MANAGEMENT TAB (Screen 19 / 20) ================== */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            
            {/* Create Product Form (Screen 20) — simplified multi-step wizard */}
            <ProductCreationWizard
              onPublish={handlePublishProduct}
              onSaveDraft={handleSaveDraftProduct}
              onViewProductList={() => {
                document.getElementById('catalog-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            />

            {/* Catalog list */}
            <div id="catalog-list" className="bg-white border border-[#E8DEEF] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E8DEEF] flex items-center justify-between">
                <h3 className="font-black text-sm text-zinc-950">My Catalog</h3>
                <span className="text-[11px] font-bold text-[#7E6C96]">{products.length} product{products.length !== 1 ? 's' : ''}</span>
              </div>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E8DEEF] text-[#7E6C96] font-bold uppercase tracking-wider bg-zinc-50">
                    <th className="p-4">Product Name</th>
                    <th className="p-4">Price / Unit</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DEEF] text-[#5B4A6E]">
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {p.images[0] ? (
                            <img src={p.images[0]} alt={p.name} className="w-9 h-9 rounded-lg object-cover border border-[#E8DEEF]" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-[#F5EEF8] flex items-center justify-center">
                              <Package className="w-4 h-4 text-[#6B2D8C]" />
                            </div>
                          )}
                          <div>
                            <span className="font-extrabold text-zinc-950 block">{p.name}</span>
                            <span className="text-[10px] text-zinc-400">{p.category}{p.subcategory ? ` · ${p.subcategory}` : ''}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-zinc-900">₹{p.price}</span>
                        {p.mrp && <span className="text-[10px] text-zinc-400 line-through ml-1.5">₹{p.mrp}</span>}
                        <span className="text-[10px] text-zinc-400 block">per {p.unit}</span>
                      </td>
                      <td className="p-4">{p.stockQty} {p.unit}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded font-bold text-[9.5px] uppercase tracking-wider ${
                          p.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-zinc-100 text-zinc-700'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onNavigateToProduct?.(p.id)}
                            className="text-[#6B2D8C] hover:text-[#4A2560] font-bold inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                          <button 
                            onClick={() => setProducts(products.filter(item => item.id !== p.id))}
                            className="text-red-500 hover:text-red-700 transition-colors inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ================== SPONSORED AD CAMPAIGN MANAGER ================== */}
        {activeTab === 'sponsored-ads' && (
          <SponsoredAdManager
            supplierId="seller_aura_001"
            supplierName="Aura Beauty Labs"
          />
        )}

        {/* ================== SCREEN 25 — SUPPLIER ANALYTICS & PERFORMANCE ================== */}
        {activeTab === 'analytics' && (
          <SupplierAnalyticsDashboard
            supplierId="seller_aura_001"
            supplierName="Aura Beauty Labs"
            onBoostProduct={(productId) => {
              setActiveTab('sponsored-ads');
            }}
            onViewProduct={(productId) => {
              if (onNavigateToProduct) {
                onNavigateToProduct(productId);
              }
            }}
          />
        )}
        {activeTab === 'enquiries' && (
          <div className="space-y-4">
            <h3 className="font-black text-sm text-zinc-950">Active Buyer Sourcing Enquiries</h3>
            {liveEnquiries.length === 0 && (
              <div className="bg-white border border-[#E8DEEF] rounded-xl p-8 text-center space-y-2">
                <Mail className="w-8 h-8 text-[#D9C3E8] mx-auto" />
                <p className="text-sm font-extrabold text-zinc-900">No buyer enquiries yet</p>
                <p className="text-xs text-[#5B4A6E]">New leads will appear here the moment a buyer sends an enquiry on one of your listings.</p>
              </div>
            )}
            {liveEnquiries.map((enq) => {
              const buyerName = enq.buyer?.company_name || enq.buyer?.contact_name || 'Verified Nexora Buyer';
              const hasQuoted = (enq.quotes_count || 0) > 0;
              const statusLabel = hasQuoted ? 'Quoted' : enq.status === 'new' ? 'Unread' : 'Responded';
              return (
              <div key={enq.id} className="bg-white border border-[#E8DEEF] rounded-xl p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-zinc-400 font-mono block">Enquiry REF: {enq.id} · {timeAgoLabel(enq.created_at)}</span>
                    <h4 className="font-extrabold text-sm text-zinc-950 mt-0.5">{buyerName}</h4>
                  </div>
                  <span className={`text-[9.5px] px-2 py-0.5 rounded font-bold uppercase ${
                    statusLabel === 'Unread'
                      ? 'bg-[#F5EEF8] text-[#6B2D8C] border border-[#D9C3E8]'
                      : statusLabel === 'Quoted'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-zinc-100 text-zinc-600'
                  }`}>
                    {statusLabel}
                  </span>
                </div>

                <div className="bg-[#FDFBF7] p-3 rounded-lg border border-[#E8DEEF] text-xs">
                  <p className="font-semibold text-zinc-800 mb-1">
                    {enq.requirement_title} (Target: {enq.quantity_required.toLocaleString('en-IN')} {enq.quantity_unit}) · {enq.delivery_location}
                  </p>
                  <p className="italic">"{enq.details}"</p>
                </div>

                <div className="flex justify-end gap-2 text-xs">
                  <button
                    onClick={() => setActiveTab('chat-hub')}
                    className="border border-[#E8DEEF] hover:border-zinc-400 text-zinc-800 font-bold px-3 py-2 rounded-lg cursor-pointer"
                  >
                    Chat with Buyer
                  </button>
                  <button
                    onClick={() => setSelectedRfq(enq)}
                    className="bg-[#6B2D8C] text-white font-extrabold px-3 py-2 rounded-lg hover:bg-[#4A2560] transition-colors cursor-pointer"
                  >
                    {hasQuoted ? 'Send Revised Quote' : 'Draft Proposal Bid'}
                  </button>
                </div>
              </div>
            );})}
          </div>
        )}

        {/* ================== RFQ PUBLIC MARKETPLACE (Screen 22 / 23) ================== */}
        {activeTab === 'rfqs' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="font-black text-sm text-zinc-950">Active Public Sourcing RFQ Directory</h3>
              <p className="text-xs text-[#5B4A6E]">Verified beauty product requirements posted by buyers seeking manufacturers, private label labs, and custom chemical formulators.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveRfqs.length === 0 && (
                <div className="md:col-span-2 bg-white border border-[#E8DEEF] rounded-xl p-8 text-center space-y-2">
                  <FileText className="w-8 h-8 text-[#D9C3E8] mx-auto" />
                  <p className="text-sm font-extrabold text-zinc-900">No open sourcing requirements right now</p>
                  <p className="text-xs text-[#5B4A6E]">Public buyer requirements posted via “Post Requirement” appear here in real time.</p>
                </div>
              )}
              {liveRfqs.map((rfq) => (
                <div key={rfq.id} className="bg-white border border-[#E8DEEF] rounded-xl p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                      <span>Lead ID: {rfq.id}</span>
                      <span>Published: {timeAgoLabel(rfq.created_at)}</span>
                    </div>
                    <h4 className="font-extrabold text-sm text-zinc-950">{rfq.requirement_title}</h4>
                    <div className="flex flex-wrap gap-2 text-[11px] text-[#5B4A6E]">
                      <span>Target Volume: <span className="font-bold text-zinc-900">{rfq.quantity_required.toLocaleString('en-IN')} {rfq.quantity_unit}</span></span>
                      <span>•</span>
                      <span>Destination: <span className="font-semibold text-zinc-800">{rfq.delivery_location}</span></span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E8DEEF] flex justify-between items-center text-xs">
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold uppercase">
                      {rfq.status === 'new' ? 'Open for bids' : rfq.status}
                      {(rfq.quotes_count || 0) > 0 ? ` · ${rfq.quotes_count} quote${(rfq.quotes_count || 0) > 1 ? 's' : ''}` : ''}
                    </span>
                    <button
                      onClick={() => setSelectedRfq(rfq)}
                      className="bg-[#6B2D8C] text-white font-extrabold px-3 py-2 rounded-lg hover:bg-[#4A2560] transition-colors cursor-pointer"
                    >
                      Submit Quote Proposal
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ================== VERIFICATION HUB (Screen 17 / 24) ================== */}
        {activeTab === 'verification' && (
          <div className="space-y-6">
            <div className="bg-white border border-[#E8DEEF] rounded-xl p-5 space-y-5">
              <div className="border-b border-[#E8DEEF] pb-3">
                <h3 className="font-black text-sm text-zinc-900">Supplier Legal Identity Onboarding</h3>
                <p className="text-xs text-[#5B4A6E] mt-0.5">Vetted business licenses boost matching weight curves by up to **40%** in search directories.</p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-[#5B4A6E] uppercase tracking-wider mb-1.5">Company GSTIN Number</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={15}
                      value={supplierGst}
                      onChange={(e) => setSupplierGst(e.target.value)}
                      placeholder="e.g. 07AABCU9603R1ZM"
                      className="flex-1 bg-[#FDFBF7] border border-[#E8DEEF] focus:border-[#C9A961] focus:outline-none px-3.5 py-2.5 rounded-lg uppercase tracking-wider font-mono font-bold"
                    />
                    <button
                      onClick={handleVerifyGst}
                      disabled={isVerifying}
                      className="bg-[#6B2D8C] text-white font-extrabold px-5 py-2.5 rounded-lg hover:bg-[#4A2560] transition-colors"
                    >
                      {isVerifying ? 'Checking...' : 'Sync Corporate Register'}
                    </button>
                  </div>
                </div>

                {gstVerified && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex gap-2.5 items-start">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="block font-bold text-emerald-800">Legal Business Verified Successfully</span>
                      <span className="block text-[#5B4A6E] mt-0.5">Aura Beauty Labs private manufacturing lines are fully checked, registered, and active.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Certifications and credentials upload */}
            <div className="bg-white border border-[#E8DEEF] rounded-xl p-5 space-y-4">
              <h3 className="font-extrabold text-xs text-[#7E6C96] uppercase tracking-wider">Manufacturing Certifications (GMP, ISO, organic)</h3>
              
              <div className="border-2 border-dashed border-[#D9C3E8] rounded-xl p-6 text-center hover:bg-neutral-50 transition-colors cursor-pointer group">
                <Upload className="w-8 h-8 text-zinc-400 group-hover:text-[#6B2D8C] mx-auto mb-2" />
                <span className="block text-xs font-bold text-zinc-900">Upload GMP / ISO Compliance Certificate</span>
                <span className="block text-[10px] text-zinc-400 mt-0.5">Supports high-res PDF or PNG up to 5MB</span>
              </div>
            </div>

            {/* Privacy & Visibility Settings */}
            <div className="bg-white border border-[#E8DEEF] rounded-xl p-5 space-y-4">
              <h3 className="font-extrabold text-xs text-[#7E6C96] uppercase tracking-wider">Privacy & Visibility Settings</h3>
              
              <div className="flex items-center justify-between p-4 bg-[#FDFBF7] rounded-xl border border-[#E8DEEF]">
                <div className="space-y-1">
                  <span className="block text-[13px] font-bold text-[#2A0E3F]">Show My Mobile Number to Verified Buyers</span>
                  <p className="text-[11px] text-[#5B4A6E]">When enabled, your verified business contact number will be visible to logged-in buyers. If disabled, they must send an enquiry to connect.</p>
                </div>
                <button
                  onClick={() => setShowMobileToBuyers(!showMobileToBuyers)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${showMobileToBuyers ? 'bg-[#6B2D8C]' : 'bg-[#E8DEEF]'}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${showMobileToBuyers ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Quote-sent confirmation toast (matches global toast styling) */}
      {quoteSentToast && (
        <div className="fixed bottom-22 right-6 z-50 bg-[#2A0E3F] text-white px-4 py-3 rounded-xl shadow-xl border border-[#352B44] flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#8236A0]" />
          <span className="text-[13px] font-medium">{quoteSentToast}</span>
        </div>
      )}

      {/* Custom Quote Submission form overlay (Screen 23) — shared by the
          Enquiry Inbox and the public RFQ marketplace */}
      {selectedRfq && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8DEEF] rounded-2xl w-full max-w-md p-6 relative shadow-2xl text-xs space-y-6">

            <div className="flex justify-between items-center pb-3 border-b border-[#E8DEEF]">
              <div>
                <span className="text-[9px] text-zinc-400 font-mono block">RFQ: {selectedRfq.id}</span>
                <h3 className="font-black text-sm text-zinc-900">Send Commercial Quote Proposal</h3>
              </div>
              <button onClick={() => setSelectedRfq(null)} className="text-zinc-400 hover:text-zinc-600 font-bold">
                Close
              </button>
            </div>

            <form onSubmit={handleSendQuote} className="space-y-4 text-xs">
              <div>
                <span className="block text-[#7E6C96] font-bold uppercase mb-1">Target Requirement</span>
                <span className="text-sm font-bold text-zinc-950 block">{selectedRfq.requirement_title}</span>
                <span className="text-[#5B4A6E] block mt-0.5">
                  Target volume requested: {selectedRfq.quantity_required.toLocaleString('en-IN')} {selectedRfq.quantity_unit}
                </span>
              </div>

              <div>
                <label className="block font-bold text-[#5B4A6E] uppercase tracking-wider mb-1.5">Proposed Price (per unit / Liter)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ₹135 / Unit"
                  value={quotePrice}
                  onChange={(e) => setQuotePrice(e.target.value)}
                  className="w-full bg-[#FDFBF7] border border-[#E8DEEF] focus:border-[#C9A961] focus:outline-none p-2.5 rounded-lg font-mono text-zinc-900"
                />
              </div>

              <div>
                <label className="block font-bold text-[#5B4A6E] uppercase tracking-wider mb-1.5">Production Lead-time</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 15 business days"
                  value={quoteLeadTime}
                  onChange={(e) => setQuoteLeadTime(e.target.value)}
                  className="w-full bg-[#FDFBF7] border border-[#E8DEEF] focus:border-[#C9A961] focus:outline-none p-2.5 rounded-lg"
                />
              </div>

              <button
                type="submit"
                disabled={quoteSubmitted}
                className="w-full py-3.5 bg-[#6B2D8C] hover:bg-[#4A2560] text-white font-extrabold uppercase tracking-wider rounded-lg shadow-sm transition-all"
              >
                {quoteSubmitted ? 'Transmitting quote securely...' : 'Submit Commercial Bid'}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
