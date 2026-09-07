import React, { useState, useEffect, useMemo } from 'react';
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
  TrendingDown,
  Edit3,
  Check,
  Save,
  Layers,
  RefreshCw,
  PackageCheck
} from 'lucide-react';
import { CATEGORY_TAXONOMY, getSubcategoriesForCategoryName } from '../data/categories';
import { addNotification } from '../data/notifications';
import { db } from '../db/database';
import type { PopulatedOrder, PopulatedRFQEnquiry } from '../db/types';
import { OrderConfirmationModal } from './OrderConfirmationModal';
import { downloadOrderInvoice, downloadOrderInvoiceCsv, getOrderLineItems, ORDER_STATUS_LABELS, formatInr, formatDate } from '../utils/invoicePdf';

/**
 * Canonical demo buyer for the relational store. The RFQ tracking screen
 * derives its buyer from the selected RFQ so accepted orders always appear in
 * "Your Orders".
 */
const RESOLVE_BUYER_ID = 'buyer-prof-priya';

const BUSINESS_DAYS = 30;

function resolveBuyerIdFromRfqs(): string {
  const list = db.getRFQsAndEnquiries();
  if (list.length > 0 && list[0].buyer_id) return list[0].buyer_id;
  return RESOLVE_BUYER_ID;
}

function isActiveRfqListItemStatus(status: string): string {
  if (status === 'new') return 'Pending';
  if (status === 'negotiating') return 'Negotiating';
  if (status === 'responded') return 'Quoted';
  if (status === 'closed') return 'Closed';
  return 'Closed';
}

function statusLabelForNotification(status: string): string {
  return ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] || status;
}

function buildRfqListItem(rfq: PopulatedRFQEnquiry) {
  const quotes = db.getQuotesByRfqId(rfq.id);
  const actionable = quotes.filter((q) => q.status === 'submitted' || q.status === 'negotiating');
  const best = actionable.length
    ? actionable.sort((a, b) => (a.counter_offer_price || a.unit_price) - (b.counter_offer_price || b.unit_price))[0]
    : null;
  return {
    id: rfq.id,
    product: rfq.requirement_title,
    category: rfq.category,
    subcategory: '',
    date: new Date(rfq.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    status: isActiveRfqListItemStatus(rfq.status),
    rawStatus: rfq.status,
    responses: rfq.quotes_count + 1,
    quotes: rfq.quotes_count,
    quantity: `${rfq.quantity_required.toLocaleString()} ${rfq.quantity_unit || 'Units'}`,
    targetPrice: rfq.target_budget ? `₹${rfq.target_budget} / unit` : 'Price on Request',
    urgency: 'Standard',
    details: rfq.details,
    bestQuotePrice: best ? best.counter_offer_price || best.unit_price : null,
    bestQuoteSupplier: best?.supplier?.company_name || best?.supplier_id || null,
    bestQuoteValidity: best?.validity_date || null,
    maxValidity: quotes.length ? Math.max(...quotes.map((q) => new Date(q.validity_date).getTime())) : null,
    rawRfq: rfq,
  };
}

interface RFQTrackingScreenProps {
  onBack: () => void;
  onNavigateToChat: (supplierId: string) => void;
}

const INITIAL_RFQS = [
  {
    id: 'RFQ-8821',
    product: 'Vitamin C Brightening Serum (Bulk)',
    category: 'Skincare',
    subcategory: 'Serums & Treatments',
    date: '24 May 2024',
    status: 'Quoted',
    responses: 5,
    quotes: 3,
    quantity: '5,000 Units',
    targetPrice: '₹180 - ₹220 / unit',
    urgency: 'Standard',
    details: 'Looking for 15% 3-O-Ethyl Ascorbic Acid serum with UV amber glass dropper packaging.'
  },
  {
    id: 'RFQ-8819',
    product: 'Professional Hair Spa Steamer',
    category: 'Salon & Spa Equipment',
    subcategory: 'Hair Styling & Drying Tools',
    date: '22 May 2024',
    status: 'Pending',
    responses: 12,
    quotes: 0,
    quantity: '15 Units',
    targetPrice: '₹8,500 / unit',
    urgency: 'Immediate',
    details: 'Double helmet salon spa steamers with adjustable height and micro-mist features.'
  },
  {
    id: 'RFQ-8790',
    product: 'Eco-friendly Glass Dropper Bottles (30ml)',
    category: 'Packaging & Containers',
    subcategory: 'Bottles (Glass, PET, HDPE)',
    date: '15 May 2024',
    status: 'Closed',
    responses: 8,
    quotes: 6,
    quantity: '20,000 Units',
    targetPrice: '₹12 / unit',
    urgency: 'Standard',
    details: 'Matte frosted white 30ml glass bottles with rose gold metallic collar droppers.'
  }
];

export const BuyerRFQTrackingScreen: React.FC<RFQTrackingScreenProps> = ({
  onBack,
  onNavigateToChat
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'quoted' | 'closed'>('all');
  const [selectedRfqId, setSelectedRfqId] = useState<string | null>(() => {
    const list = db.getRFQsAndEnquiries();
    return list[0]?.id || null;
  });
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [rfqsList, setRfqsList] = useState(() => {
    return db.getRFQsAndEnquiries().map(buildRfqListItem);
  });

  // Edit RFQ Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRfqId, setEditingRfqId] = useState<string | null>(null);
  const [editProduct, setEditProduct] = useState('');
  const [editCategory, setEditCategory] = useState('Skincare');
  const [editSubcategory, setEditSubcategory] = useState('Serums & Treatments');
  const [editQuantity, setEditQuantity] = useState('');
  const [editTargetPrice, setEditTargetPrice] = useState('');
  const [editUrgency, setEditUrgency] = useState('Standard');
  const [editDetails, setEditDetails] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Counter Offer Modal State
  const [isCounterModalOpen, setIsCounterModalOpen] = useState(false);
  const [counterQuoteId, setCounterQuoteId] = useState<string | null>(null);
  const [counterPriceInput, setCounterPriceInput] = useState('');
  const [counterNotesInput, setCounterNotesInput] = useState('');

  // Final order / confirmation state
  const [activeBuyerId, setActiveBuyerId] = useState<string>(() => resolveBuyerIdFromRfqs());
  const [activeOrders, setActiveOrders] = useState<PopulatedOrder[]>(() => db.getOrdersByBuyerId(resolveBuyerIdFromRfqs()));
  const [confirmationOrder, setConfirmationOrder] = useState<PopulatedOrder | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedRfqIds, setSimulatedRfqIds] = useState<Set<string>>(() => new Set());

  // React state synchronization with the relational database
  useEffect(() => {
    const refresh = () => {
      db.expireExpiredQuotes();
      const buyerId = resolveBuyerIdFromRfqs();
      setActiveBuyerId(buyerId);
      setActiveOrders(db.getOrdersByBuyerId(buyerId));
      const updated = db.getRFQsAndEnquiries().map(buildRfqListItem);
      setRfqsList(updated);
    };
    const unsubscribe = db.subscribe(() => refresh());
    refresh();
    return unsubscribe;
  }, []);

  // Auto-populate the selected RFQ with one round of simulated supplier
  // responses when the database has no real quotes for it yet. This keeps the
  // buyer journey alive in preview and demo mode while real suppliers can also
  // submit quotes through the Supplier Admin Portal.
  useEffect(() => {
    if (!selectedRfqId) return;
    const hasQuotes = db.getQuotesByRfqId(selectedRfqId).length > 0;
    if (!hasQuotes && !simulatedRfqIds.has(selectedRfqId)) {
      db.simulateSupplierResponses(selectedRfqId, 3);
      setSimulatedRfqIds((prev) => new Set(prev).add(selectedRfqId));
    }
  }, [selectedRfqId, simulatedRfqIds]);

  const handleSimulateMore = () => {
    if (!selectedRfqId) return;
    setIsSimulating(true);
    setTimeout(() => {
      db.simulateSupplierResponses(selectedRfqId, 3);
      setIsSimulating(false);
      setToastMessage('3 more supplier responses received for this requirement.');
      setTimeout(() => setToastMessage(null), 3500);
    }, 900);
  };

  // Get dynamic quotes for the selected RFQ
  const activeQuotes = useMemo(() => {
    if (!selectedRfqId) return [];
    const dbQuotes = db.getQuotesByRfqId(selectedRfqId);

    return dbQuotes.map(q => {
      const supplierProfile = db.getSupplierProfileById(q.supplier_id);
      return {
        id: q.id,
        order: q.order,
        supplier: supplierProfile?.company_name || 'Verified Supplier',
        supplier_id: q.supplier_id,
        location: supplierProfile ? `${supplierProfile.city}, ${supplierProfile.state}` : 'India',
        price: `₹${q.unit_price}`,
        priceNum: q.unit_price,
        moq: `${q.moq_offered.toLocaleString()} Units`,
        leadTime: q.lead_time,
        rating: supplierProfile ? (supplierProfile.trust_score / 20).toFixed(1) : '4.5',
        verified: supplierProfile ? supplierProfile.is_verified : true,
        features: q.sample_available ? ['Free Sample Offered', 'Quality Guaranteed'] : ['Direct Offer'],
        terms: q.terms_and_conditions,
        formulation: q.notes || '15% High Stability Formulation Block',
        ph: '4.0 - 4.5 (Optimized Bioavailability)',
        stability: 'Accelerated stability results verified by ISO lab',
        certifications: supplierProfile?.is_iso_certified ? 'ISO 22716, GMP' : 'WHO-GMP, GMP',
        samplePolicy: q.sample_available ? 'Free Sample (Reimbursable)' : 'Paid custom sample',
        logisticTerms: 'FOB Plant (Domestic dispatch)',
        status: q.status,
        notes: q.notes,
        validityDate: q.validity_date,
        counterPrice: q.counter_offer_price,
        counterNotes: q.counter_offer_notes,
        isSimulated: q.is_simulated,
        createdAt: q.created_at
      };
    });
  }, [selectedRfqId, rfqsList]);

  const handleUpdateQuoteStatus = (quoteId: string, action: 'accept' | 'counter' | 'decline', valPrice?: number, valNotes?: string) => {
    const targetQuote = activeQuotes.find((q) => q.id === quoteId);
    if (targetQuote && isQuoteExpired(targetQuote)) {
      setToastMessage('This quote has expired. Request a revised quote before acting on it.');
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    let dbStatus: 'accepted' | 'rejected' | 'negotiating' = 'accepted';
    if (action === 'counter') dbStatus = 'negotiating';
    if (action === 'decline') dbStatus = 'rejected';

    db.updateQuoteStatus(quoteId, dbStatus, action === 'counter' ? {
      counter_offer_price: valPrice,
      counter_offer_notes: valNotes
    } : undefined);

    if (selectedRfqId) {
      db.updateRFQStatus(selectedRfqId, action === 'accept' ? 'closed' : 'negotiating');
    }

    // Accept → transition cleanly to final order confirmation
    if (action === 'accept') {
      const order = db.createOrderFromQuote(quoteId);
      if (order) {
        const buyerId = resolveBuyerIdFromRfqs();
        setActiveBuyerId(buyerId);
        setActiveOrders(db.getOrdersByBuyerId(buyerId));
        setConfirmationOrder(order);
        setIsOrderModalOpen(true);
        const populatedOrder = db.getOrderById(order.id);
        addNotification({
          type: 'order',
          title: `Order confirmed: ${order.order_no}`,
          description: `${order.product} · ${formatInr(order.total_amount, order.currency)} · ${statusLabelForNotification(order.status)}`,
          priority: 'high',
          targetScreen: 'rfq-tracking',
          targetParams: { rfqId: order.rfq_id, orderId: order.id },
          sender: { name: populatedOrder?.supplier?.company_name || 'Supplier', isVerified: true },
          metadata: {
            rfqId: order.rfq_id,
            price: `${formatInr(order.unit_price, order.currency)} / unit`,
            quantity: `${order.quantity.toLocaleString()} ${order.quantity_unit}`,
            supplierName: populatedOrder?.supplier?.company_name,
            productName: order.product,
            trackingNumber: order.order_no
          }
        });
      }
    }

    setToastMessage(`Quote successfully updated to ${action === 'accept' ? 'ACCEPTED' : action === 'decline' ? 'DECLINED' : 'NEGOTIATING'}! Relational database updated.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenEditModal = (rfqId: string) => {
    const target = rfqsList.find(r => r.id === rfqId);
    if (!target) return;
    setEditingRfqId(target.id);
    setEditProduct(target.product);
    setEditCategory(target.category);
    setEditSubcategory(target.subcategory || getSubcategoriesForCategoryName(target.category)[0] || '');
    setEditQuantity(target.quantity);
    setEditTargetPrice(target.targetPrice);
    setEditUrgency(target.urgency);
    setEditDetails(target.details || '');
    setIsEditModalOpen(true);
  };

  const handleSaveRfqEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRfqId) return;

    const parsedQty = parseInt(editQuantity.replace(/[^0-9]/g, '')) || 5000;
    const parsedBudget = parseInt(editTargetPrice.replace(/[^0-9]/g, '')) || 180;

    db.updateRFQEnquiry(editingRfqId, {
      requirement_title: editProduct,
      category: editCategory,
      quantity_required: parsedQty,
      target_budget: parsedBudget,
      details: editDetails,
      status: 'new'
    });

    setIsEditModalOpen(false);
    setToastMessage(`Requirement #${editingRfqId} updated successfully!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredRfqs = activeTab === 'all'
    ? rfqsList
    : activeTab === 'quoted'
      ? rfqsList.filter(r => r.status === 'Quoted' || r.status === 'Negotiating')
      : rfqsList.filter(r => r.status.toLowerCase() === activeTab);

  const selectedRfq = rfqsList.find(r => r.id === selectedRfqId);

  const bestActiveQuote = useMemo(() => {
    const actionable = activeQuotes.filter(q => q.status === 'submitted' || q.status === 'negotiating');
    return actionable.sort((a, b) => (a.counterPrice || a.priceNum) - (b.counterPrice || b.priceNum))[0] || null;
  }, [activeQuotes]);

  const getQuoteStatusChip = (status: string) => {
    if (status === 'accepted' || status === 'order_placed') return { label: 'Accepted', className: 'bg-emerald-100 text-emerald-800' };
    if (status === 'rejected') return { label: 'Declined', className: 'bg-rose-100 text-rose-800' };
    if (status === 'negotiating') return { label: 'Negotiating', className: 'bg-amber-100 text-amber-800' };
    if (status === 'expired') return { label: 'Expired', className: 'bg-stone-200 text-stone-700' };
    return { label: 'Pending', className: 'bg-sky-100 text-sky-800' };
  };

  const isQuoteExpired = (quote: typeof activeQuotes[number]) => {
    if (quote.status === 'expired') return true;
    if (!quote.validityDate) return false;
    return new Date(quote.validityDate).getTime() < new Date().getTime();
  };

  const acceptBestQuote = () => {
    if (!bestActiveQuote) return;
    if (isQuoteExpired(bestActiveQuote)) {
      setToastMessage('This quote has expired. Request a revised quote before accepting.');
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }
    handleUpdateQuoteStatus(bestActiveQuote.id, 'accept');
  };

  const handleCancelOrder = (orderId: string) => {
    const order = db.cancelOrder(orderId, 'Cancelled by buyer from RFQ tracking.');
    if (order) {
      setActiveOrders(db.getOrdersByBuyerId(activeBuyerId));
      addNotification({
        type: 'order',
        title: `Order cancelled: ${order.order_no}`,
        description: order.product,
        priority: 'high',
        targetScreen: 'rfq-tracking',
        targetParams: { rfqId: order.rfq_id, orderId: order.id },
        sender: { name: 'You', isVerified: true },
        metadata: { rfqId: order.rfq_id, productName: order.product }
      });
    }
    setToastMessage('Order cancelled. You can reorder from the order history.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleReorder = (orderId: string) => {
    const rfq = db.reorderFromOrder(orderId);
    if (rfq) {
      setSelectedRfqId(rfq.id);
      setActiveTab('all');
      addNotification({
        type: 'rfq_response',
        title: `Reorder created: ${rfq.id}`,
        description: rfq.requirement_title,
        priority: 'medium',
        targetScreen: 'rfq-tracking',
        targetParams: { rfqId: rfq.id },
        sender: { name: 'Order history', isVerified: true }
      });
      setToastMessage(`Reorder RFQ created as ${rfq.id}. Simulated supplier responses will populate on selection.`);
      setTimeout(() => setToastMessage(null), 4500);
    } else {
      setToastMessage('Unable to create a reorder for this order.');
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pt-6 pb-20 relative">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 font-bold text-xs animate-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="space-y-1">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-[#6B2D8C] font-bold text-[13px] hover:underline mb-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            <h1 className="text-3xl font-black text-[#2A0E3F] tracking-tight">Requirement Tracking</h1>
            <p className="text-[14px] text-[#5B4A6E]">Manage your active RFQs and compare supplier quotes in real-time.</p>
          </div>

          <div className="flex items-center gap-3">
            <button className="px-5 py-2.5 bg-white border border-[#E8DEEF] rounded-xl text-[13px] font-bold text-[#2A0E3F] flex items-center gap-2 hover:bg-[#FDFBF7] transition-all cursor-pointer">
              <Download className="w-4 h-4" />
              Export Data
            </button>
            <button className="px-5 py-2.5 bg-[#6B2D8C] text-white rounded-xl text-[13px] font-black flex items-center gap-2 hover:bg-[#4A2560] transition-all shadow-md cursor-pointer">
              <TrendingUp className="w-4 h-4" />
              Post New RFQ
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* RFQ List Column */}
          <div className="lg:col-span-1 space-y-6">

            {/* Search & Tabs */}
            <div className="bg-white border border-[#E8DEEF] rounded-2xl p-4 shadow-sm space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7E6C96]" />
                <input
                  type="text"
                  placeholder="Search requirements..."
                  className="w-full pl-10 pr-4 py-2 bg-[#FDFBF7] border border-[#E8DEEF] rounded-xl text-[12px] font-bold focus:outline-none focus:border-[#C9A961]"
                />
              </div>

              <div className="flex items-center p-1 bg-[#FDFBF7] rounded-lg border border-[#E8DEEF]">
                {['all', 'pending', 'quoted', 'closed'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`flex-1 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                      activeTab === tab
                        ? 'bg-white text-[#6B2D8C] shadow-sm'
                        : 'text-[#7E6C96] hover:text-[#2A0E3F]'
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
                  className={`w-full text-left bg-white border rounded-2xl p-5 transition-all group cursor-pointer ${
                    selectedRfqId === rfq.id
                      ? 'border-[#6B2D8C] ring-2 ring-[#F5EEF8]'
                      : 'border-[#E8DEEF] hover:border-[#6B2D8C]/40 shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-black text-[#7E6C96] uppercase tracking-widest">{rfq.id}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                      rfq.status === 'Quoted' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      rfq.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                      'bg-gray-50 text-gray-700 border-gray-100'
                    }`}>
                      {rfq.status}
                    </span>
                  </div>
                  <h3 className="text-[14px] font-bold text-[#2A0E3F] group-hover:text-[#6B2D8C] transition-colors mb-2">{rfq.product}</h3>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="space-y-0.5">
                      <p className="text-[9px] text-[#7E6C96] uppercase font-black">Responses</p>
                      <p className="text-[13px] font-black text-[#2A0E3F] flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-[#6B2D8C]" />
                        {rfq.responses}
                      </p>
                    </div>
                    <div className="space-y-0.5 text-right">
                      <p className="text-[9px] text-[#7E6C96] uppercase font-black">Quotes</p>
                      <p className="text-[13px] font-black text-[#2A0E3F] flex items-center justify-end gap-1.5">
                        {rfq.quotes}
                        <FileText className="w-3.5 h-3.5 text-[#6B2D8C]" />
                      </p>
                    </div>
                  </div>
                  {rfq.bestQuotePrice !== null && rfq.rawStatus !== 'closed' && (
                    <div className="mt-3 pt-3 border-t border-[#F4F0E9] flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-[#6B2D8C]/10 text-[#6B2D8C] text-[9px] font-black uppercase tracking-wide">
                        Best quote ₹{rfq.bestQuotePrice}
                      </span>
                      <span className="text-[10px] text-[#5B4A6E]">
                        {rfq.bestQuoteSupplier || 'Verified supplier'} · {rfq.bestQuoteValidity ? `valid ${formatDate(rfq.bestQuoteValidity)}` : ''}
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Detail View Column */}
          <div className="lg:col-span-2">
            {!selectedRfq ? (
              <div className="h-full min-h-[400px] bg-white border border-[#E8DEEF] rounded-3xl flex flex-col items-center justify-center p-12 text-center border-dashed">
                <div className="w-16 h-16 bg-[#FDFBF7] rounded-2xl flex items-center justify-center text-[#7E6C96] mb-4">
                  <Eye className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-[#2A0E3F]">Select a requirement to view details</h3>
                <p className="text-[14px] text-[#5B4A6E] max-w-xs mt-2">Track responses, compare official quotes, and communicate with verified suppliers.</p>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-300">

                {/* Active Selection Header */}
                <div className="bg-white border border-[#E8DEEF] rounded-3xl p-8 shadow-sm">
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-[#FDFBF7] border border-[#E8DEEF] rounded-lg text-[11px] font-black text-[#6B2D8C] uppercase tracking-wider">
                          {selectedRfq.id}
                        </span>
                        <span className="flex items-center gap-1 text-[12px] text-[#5B4A6E] font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          Posted on {selectedRfq.date}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          selectedRfq.status === 'Closed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : selectedRfq.status === 'Negotiating'
                              ? 'bg-amber-100 text-amber-800'
                              : selectedRfq.status === 'Quoted'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-stone-100 text-stone-700'
                        }`}>
                          {selectedRfq.status}
                        </span>
                      </div>
                      <h2 className="text-2xl font-black text-[#2A0E3F]">{selectedRfq.product}</h2>
                      <div className="flex flex-wrap gap-6">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-[#7E6C96]" />
                          <span className="text-[13px] font-bold text-[#2A0E3F]">{selectedRfq.quantity}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-[#7E6C96]" />
                          <span className="text-[13px] font-bold text-[#2A0E3F]">{selectedRfq.targetPrice}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-[#6B2D8C]" />
                          <span className="text-[13px] font-bold text-[#6B2D8C]">{selectedRfq.category} {selectedRfq.subcategory ? `> ${selectedRfq.subcategory}` : ''}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={acceptBestQuote}
                        disabled={!bestActiveQuote}
                        className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-[13px] font-black hover:bg-emerald-700 transition-all shadow-sm cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                      >
                        {bestActiveQuote ? `Accept Best Quote · ₹${bestActiveQuote.counterPrice || bestActiveQuote.priceNum}` : 'Awaiting Quotes'}
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(selectedRfq.id)}
                        className="px-6 py-2.5 bg-white border border-[#E8DEEF] text-[#5B4A6E] hover:text-[#6B2D8C] hover:border-[#6B2D8C] rounded-xl text-[13px] font-bold hover:bg-[#FDFBF7] transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit Requirement</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quotes Table / Comparison */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-[#2A0E3F] flex items-center gap-2">
                      Received Quotes
                      <span className="text-[12px] font-bold px-2 py-0.5 bg-[#F5EEF8] text-[#6B2D8C] rounded-full">{activeQuotes.length}</span>
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSimulateMore}
                        disabled={isSimulating}
                        className="text-[12px] font-bold text-[#6B2D8C] hover:text-[#4A2560] hover:underline flex items-center gap-1 cursor-pointer bg-[#F5EEF8] px-3 py-1.5 rounded-xl border border-[#D9C3E8] transition-all shadow-xs disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
                        <span>Simulate Supplier Response</span>
                      </button>
                      <button
                        onClick={() => setIsCompareModalOpen(true)}
                        className="text-[12px] font-bold text-[#6B2D8C] hover:text-[#4A2560] hover:underline flex items-center gap-1 cursor-pointer bg-[#F5EEF8] px-3 py-1.5 rounded-xl border border-[#D9C3E8] transition-all shadow-xs"
                      >
                        <Scale className="w-4 h-4" />
                        <span>Compare Side-by-Side</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {activeQuotes.map((quote) => (
                      <div key={quote.id} className={`bg-white border rounded-2xl overflow-hidden transition-all group ${quote.status === 'accepted' ? 'border-emerald-500 ring-2 ring-emerald-50' : 'border-[#E8DEEF] hover:border-[#6B2D8C]/30'}`}>
                        <div className="p-6">
                          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-[#FDFBF7] border border-[#E8DEEF] rounded-xl flex items-center justify-center text-[#6B2D8C]">
                                <Building2 className="w-6 h-6" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-[15px] font-bold text-[#2A0E3F]">{quote.supplier}</h4>
                                  {quote.verified && (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  )}
                                  {(() => {
                                    const chip = getQuoteStatusChip(quote.status);
                                    return (
                                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${chip.className}`}>
                                        {chip.label}
                                      </span>
                                    );
                                  })()}
                                  {quote.isSimulated && (
                                    <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[9px] font-black uppercase tracking-wider border border-sky-200">Demo</span>
                                  )}
                                </div>
                                <p className="text-[11px] text-[#5B4A6E] flex items-center gap-1">
                                  {quote.location} • {quote.rating} ★ Rating
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-8">
                              <div className="space-y-1 text-center">
                                <p className="text-[9px] text-[#7E6C96] uppercase font-black">Quote Price</p>
                                <p className="text-[16px] font-black text-[#6B2D8C]">{quote.price}</p>
                              </div>
                              <div className="space-y-1 text-center border-l border-[#E8DEEF] pl-8">
                                <p className="text-[9px] text-[#7E6C96] uppercase font-black">Lead Time</p>
                                <p className="text-[14px] font-bold text-[#2A0E3F]">{quote.leadTime}</p>
                              </div>
                              <div className="space-y-1 text-center border-l border-[#E8DEEF] pl-8">
                                <p className="text-[9px] text-[#7E6C96] uppercase font-black">MOQ</p>
                                <p className="text-[14px] font-bold text-[#2A0E3F]">{quote.moq}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 w-full md:w-auto">
                              <button
                                onClick={() => onNavigateToChat(quote.id)}
                                className="flex-1 md:flex-none px-4 py-2 bg-[#F5EEF8] text-[#6B2D8C] text-[12px] font-black rounded-lg hover:bg-[#E8D5F2] transition-all flex items-center justify-center gap-2 cursor-pointer"
                              >
                                <MessageSquare className="w-4 h-4" />
                                Chat
                              </button>

                              {(quote.status === 'submitted' || quote.status === 'negotiating') && !isQuoteExpired(quote) && (
                                <>
                                  <button
                                    onClick={() => handleUpdateQuoteStatus(quote.id, 'accept')}
                                    className="px-4 py-2 bg-emerald-600 text-white text-[12px] font-black rounded-lg hover:bg-emerald-700 transition-all cursor-pointer"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => {
                                      setCounterQuoteId(quote.id);
                                      setCounterPriceInput(quote.priceNum?.toString() || '');
                                      setIsCounterModalOpen(true);
                                    }}
                                    className="px-4 py-2 bg-white border border-[#6B2D8C] text-[#6B2D8C] text-[12px] font-black rounded-lg hover:bg-[#FDFBF7] transition-all cursor-pointer"
                                  >
                                    Counter
                                  </button>
                                  <button
                                    onClick={() => handleUpdateQuoteStatus(quote.id, 'decline')}
                                    className="px-4 py-2 bg-rose-50 text-rose-600 text-[12px] font-black rounded-lg hover:bg-rose-100 transition-all cursor-pointer"
                                  >
                                    Decline
                                  </button>
                                </>
                              )}
                            </div>

                          </div>

                          {/* Terms & Conditions details if any */}
                          {quote.terms && (
                            <div className="mt-4 p-3 bg-[#FDFBF7] rounded-xl border border-[#E8DEEF] text-[11px] text-[#5B4A6E] leading-relaxed">
                              <strong>Commercial Terms:</strong> {quote.terms}
                            </div>
                          )}

                          {quote.notes && (
                            <div className="mt-2 text-[11px] text-stone-500 italic">
                              <strong>Formulation Notes:</strong> {quote.notes}
                            </div>
                          )}

                          <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-[#5B4A6E]">
                            {quote.validityDate && (
                              <span className={`inline-flex items-center gap-1 ${isQuoteExpired(quote) && quote.status === 'submitted' ? 'text-rose-600 font-bold' : ''}`}>
                                <Clock className="w-3.5 h-3.5" />
                                Valid till {formatDate(quote.validityDate)}
                              </span>
                            )}
                            {quote.counterPrice && quote.counterPrice !== quote.priceNum && (
                              <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                                <TrendingDown className="w-3.5 h-3.5" />
                                Counter offer ₹{quote.counterPrice}
                                {quote.counterNotes ? ` · ${quote.counterNotes}` : ''}
                              </span>
                            )}
                          </div>

                          {/* Features / Highlights */}
                          <div className="mt-4 pt-3 border-t border-[#FDFBF7] flex flex-wrap gap-2">
                            {quote.features.map((feature, idx) => (
                              <span key={idx} className="px-2.5 py-1 bg-[#FDFBF7] border border-[#E8DEEF] rounded-md text-[10px] font-bold text-[#5B4A6E]">
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Orders / Order History */}
                <div className="space-y-4">
                  <h3 className="text-lg font-black text-[#2A0E3F] flex items-center gap-2">
                    <PackageCheck className="w-5 h-5 text-[#6B2D8C]" />
                    Your Orders
                    <span className="text-[12px] font-bold px-2 py-0.5 bg-[#F5EEF8] text-[#6B2D8C] rounded-full">{activeOrders.length}</span>
                  </h3>

                  {activeOrders.length === 0 ? (
                    <div className="bg-white border border-dashed border-[#D9C3E8] rounded-2xl p-6 text-center">
                      <p className="text-[13px] text-[#5B4A6E]">No orders yet. Accept a supplier quote to create your order and download the invoice.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeOrders.map(order => (
                        <div key={order.id} className="bg-white border border-[#E8DEEF] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[12px] font-black text-[#6B2D8C]">{order.order_no}</span>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase border border-emerald-200">
                                {ORDER_STATUS_LABELS[order.status] || order.status}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-stone-50 text-stone-600 text-[9px] font-black uppercase border border-stone-200">
                                {order.payment_status.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-[14px] font-bold text-[#2A0E3F]">{order.product}</p>
                            <p className="text-[12px] text-[#5B4A6E]">
                              {getOrderLineItems(order).length} line item{getOrderLineItems(order).length > 1 ? 's' : ''} · {order.quantity.toLocaleString()} {order.quantity_unit} · {formatInr(order.total_amount, order.currency)} · Est. delivery {formatDate(order.expected_delivery)}
                            </p>
                            <p className="text-[11px] text-[#7E6C96]">
                              Advance {order.advance_percent ? `${order.advance_percent}%` : '50%'} · Seller GSTIN {order.seller_gstin || 'Standard'} · {order.is_reorder ? 'Reorder order' : 'Original order'}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => { setConfirmationOrder(db.getOrderById(order.id)); setIsOrderModalOpen(true); }}
                              className="px-4 py-2 bg-[#F5EEF8] text-[#6B2D8C] text-[12px] font-black rounded-lg hover:bg-[#E8D5F2] transition-all flex items-center gap-2 cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </button>
                            <button
                              onClick={() => {
                                const orderRecord = db.getOrderById(order.id);
                                if (orderRecord) downloadOrderInvoice(orderRecord);
                              }}
                              className="px-4 py-2 bg-[#6B2D8C] text-white text-[12px] font-black rounded-lg hover:bg-[#4A2560] transition-all flex items-center gap-2 cursor-pointer"
                            >
                              <Download className="w-4 h-4" />
                              PDF
                            </button>
                            <button
                              onClick={() => {
                                const orderRecord = db.getOrderById(order.id);
                                if (orderRecord) downloadOrderInvoiceCsv(orderRecord);
                              }}
                              className="px-4 py-2 bg-white border border-[#6B2D8C] text-[#6B2D8C] text-[12px] font-black rounded-lg hover:bg-[#FDFBF7] transition-all flex items-center gap-2 cursor-pointer"
                            >
                              <FileText className="w-4 h-4" />
                              CSV
                            </button>
                            {order.status !== 'cancelled' && (
                              <button
                                onClick={() => handleCancelOrder(order.id)}
                                className="px-4 py-2 bg-rose-50 text-rose-600 text-[12px] font-black rounded-lg hover:bg-rose-100 transition-all cursor-pointer"
                              >
                                Cancel
                              </button>
                            )}
                            <button
                              onClick={() => handleReorder(order.id)}
                              className="px-4 py-2 bg-emerald-50 text-emerald-700 text-[12px] font-black rounded-lg hover:bg-emerald-100 transition-all cursor-pointer"
                            >
                              Reorder
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* No Quotes Empty State Logic would go here */}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* COMPARISON MATRIX MODAL (dynamic from activeQuotes) */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8DEEF] rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col text-left">
            <div className="p-6 border-b border-[#F4F0E9] bg-[#FDFBF7] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#F5EEF8] text-[#6B2D8C] text-[10px] font-black uppercase tracking-wider">Procurement Matrix</span>
                  <span className="text-xs text-[#7E6C96] font-semibold">Comparing {activeQuotes.length} quote{activeQuotes.length === 1 ? '' : 's'} for requirement {selectedRfq?.id || ''}</span>
                </div>
                <h3 className="text-xl font-black text-[#2A0E3F]">Side-by-Side Sourcing Comparison</h3>
              </div>
              <button onClick={() => setIsCompareModalOpen(false)} className="p-2 rounded-xl hover:bg-gray-100 text-[#7E6C96] transition-all cursor-pointer border border-[#E8DEEF] bg-white shadow-xs">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activeQuotes.length === 0 ? (
                <div className="py-16 text-center">
                  <AlertCircle className="w-10 h-10 text-[#D9C3E8] mx-auto mb-3" />
                  <p className="text-sm font-black text-[#2A0E3F]">No quotes to compare yet</p>
                  <p className="text-xs text-[#5B4A6E] mt-1">Use “Simulate Supplier Response” or wait for supplier quotes to arrive.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-[#E8DEEF] shadow-sm bg-white">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#FDFBF7] border-b border-[#E8DEEF]">
                        <th className="p-4 font-black text-[#2A0E3F] uppercase tracking-wider w-52">Metric</th>
                        {activeQuotes.map((quote) => (
                          <th key={quote.id} className="p-4 font-black text-[#2A0E3F] uppercase tracking-wider border-l border-[#E8DEEF]">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-[#6B2D8C]" />
                              <span>{quote.supplier} ({quote.id.replace(/^quote-/, 'Q-')})</span>
                            </div>
                            <span className="text-[10px] font-bold block mt-0.5">{quote.location} {quote.isSimulated ? '· Demo' : ''}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8DEEF] font-medium text-[#2A0E3F]">
                      {[
                        ['Status', (q: typeof activeQuotes[number]) => getQuoteStatusChip(q.status).label],
                        ['Effective Unit Price', (q: typeof activeQuotes[number]) => `₹${q.counterPrice || q.priceNum}`],
                        ['MOQ', (q: typeof activeQuotes[number]) => q.moq],
                        ['Lead Time', (q: typeof activeQuotes[number]) => q.leadTime],
                        ['Validity', (q: typeof activeQuotes[number]) => q.validityDate ? formatDate(q.validityDate) : '—'],
                        ['Terms', (q: typeof activeQuotes[number]) => q.terms || '—'],
                        ['Samples', (q: typeof activeQuotes[number]) => q.samplePolicy],
                        ['Route', (q: typeof activeQuotes[number]) => q.logisticTerms],
                      ].map(([label, getter]) => (
                        <tr key={label as string}>
                          <td className="p-4 text-[#5B4A6E] font-bold">{label as string}</td>
                          {activeQuotes.map((quote) => (
                            <td key={quote.id} className="p-4 border-l border-[#E8DEEF]">{(getter as (q: typeof activeQuotes[number]) => string)(quote)}</td>
                          ))}
                        </tr>
                      ))}
                      <tr className="bg-[#FDFBF7]/40">
                        <td className="p-4 text-[#5B4A6E] font-bold">Action</td>
                        {activeQuotes.map((quote) => (
                          <td key={quote.id} className="p-4 border-l border-[#E8DEEF]">
                            {(quote.status === 'submitted' || quote.status === 'negotiating') && !isQuoteExpired(quote) ? (
                              <div className="flex flex-wrap gap-2">
                                <button onClick={() => { setIsCompareModalOpen(false); handleUpdateQuoteStatus(quote.id, 'accept'); }} className="px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-black rounded-lg hover:bg-emerald-700 transition-all cursor-pointer">Accept</button>
                                <button onClick={() => { setIsCompareModalOpen(false); setCounterQuoteId(quote.id); setCounterPriceInput(quote.priceNum?.toString() || ''); setIsCounterModalOpen(true); }} className="px-3 py-1.5 bg-white border border-[#6B2D8C] text-[#6B2D8C] text-[10px] font-black rounded-lg hover:bg-[#FDFBF7] transition-all cursor-pointer">Counter</button>
                              </div>
                            ) : (
                              <span className={quote.status === 'order_placed' ? 'text-emerald-700 font-bold' : 'text-[#7E6C96]'}>{getQuoteStatusChip(quote.status).label}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-[#F4F0E9] bg-[#FDFBF7] flex items-center justify-between gap-3">
              <p className="text-[11px] text-[#5B4A6E]">Best price and fastest lead are highlighted in your quote cards.</p>
              <div className="flex gap-2">
                <button onClick={() => setIsCompareModalOpen(false)} className="px-5 py-2.5 bg-white border border-[#E8DEEF] text-xs font-bold text-[#5B4A6E] hover:bg-gray-50 rounded-xl transition-all cursor-pointer">Close</button>
                {bestActiveQuote && (
                  <button onClick={() => { setIsCompareModalOpen(false); acceptBestQuote(); }} className="px-5 py-2.5 bg-[#6B2D8C] text-white text-xs font-black rounded-xl hover:bg-[#4A2560] transition-all shadow-md cursor-pointer">
                    Accept Best Quote · ₹{bestActiveQuote.counterPrice || bestActiveQuote.priceNum}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT RFQ MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#E8DEEF] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

            {/* Modal Header */}
            <div className="p-6 border-b border-[#F4F0E9] bg-[#FDFBF7] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F5EEF8] text-[#6B2D8C] flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#2A0E3F]">Edit Sourcing Requirement</h3>
                  <p className="text-xs text-[#5B4A6E]">Update active specification parameters for #{editingRfqId}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white border border-[#E8DEEF] text-[#5B4A6E] hover:text-[#2A0E3F] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveRfqEdit} className="p-6 overflow-y-auto space-y-5">
              <div>
                <label className="block text-xs font-bold text-[#2A0E3F] mb-1.5">Requirement Title / Formulation</label>
                <input
                  type="text"
                  required
                  value={editProduct}
                  onChange={(e) => setEditProduct(e.target.value)}
                  className="w-full text-xs p-3 bg-[#FDFBF7] border border-[#E8DEEF] rounded-xl font-bold text-[#2A0E3F] focus:outline-none focus:border-[#C9A961]"
                  placeholder="e.g. Vitamin C 15% Brightening Serum Bulk"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#2A0E3F] mb-1.5">Master Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      setEditCategory(newCat);
                      const subs = getSubcategoriesForCategoryName(newCat);
                      setEditSubcategory(subs[0] || '');
                    }}
                    className="w-full text-xs p-3 bg-[#FDFBF7] border border-[#E8DEEF] rounded-xl font-bold text-[#2A0E3F] focus:outline-none focus:border-[#C9A961] cursor-pointer"
                  >
                    {Object.keys(CATEGORY_TAXONOMY).map((catKey) => (
                      <option key={catKey} value={catKey}>
                        {catKey}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2A0E3F] mb-1.5">Subcategory</label>
                  <select
                    value={editSubcategory}
                    onChange={(e) => setEditSubcategory(e.target.value)}
                    className="w-full text-xs p-3 bg-[#FDFBF7] border border-[#E8DEEF] rounded-xl font-bold text-[#2A0E3F] focus:outline-none focus:border-[#C9A961] cursor-pointer"
                  >
                    {getSubcategoriesForCategoryName(editCategory).map((subKey) => (
                      <option key={subKey} value={subKey}>
                        {subKey}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#2A0E3F] mb-1.5">Target Quantity</label>
                  <input
                    type="text"
                    required
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value)}
                    className="w-full text-xs p-3 bg-[#FDFBF7] border border-[#E8DEEF] rounded-xl font-bold text-[#2A0E3F] focus:outline-none focus:border-[#C9A961]"
                    placeholder="e.g. 5,000 Units"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2A0E3F] mb-1.5">Target Price Range</label>
                  <input
                    type="text"
                    required
                    value={editTargetPrice}
                    onChange={(e) => setEditTargetPrice(e.target.value)}
                    className="w-full text-xs p-3 bg-[#FDFBF7] border border-[#E8DEEF] rounded-xl font-bold text-[#2A0E3F] focus:outline-none focus:border-[#C9A961]"
                    placeholder="e.g. ₹180 - ₹220 / unit"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2A0E3F] mb-1.5">Urgency Level</label>
                  <select
                    value={editUrgency}
                    onChange={(e) => setEditUrgency(e.target.value)}
                    className="w-full text-xs p-3 bg-[#FDFBF7] border border-[#E8DEEF] rounded-xl font-bold text-[#2A0E3F] focus:outline-none focus:border-[#C9A961] cursor-pointer"
                  >
                    <option value="Immediate">Immediate (Within 7 Days)</option>
                    <option value="Standard">Standard (15-30 Days)</option>
                    <option value="Flexible">Flexible (Planning Phase)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2A0E3F] mb-1.5">Specification & Technical Brief</label>
                <textarea
                  rows={4}
                  value={editDetails}
                  onChange={(e) => setEditDetails(e.target.value)}
                  className="w-full text-xs p-3 bg-[#FDFBF7] border border-[#E8DEEF] rounded-xl font-medium text-[#2A0E3F] focus:outline-none focus:border-[#C9A961]"
                  placeholder="Detail active ingredients, packaging specifications, certifications, and delivery constraints..."
                />
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t border-[#F4F0E9] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 bg-white border border-[#E8DEEF] text-xs font-bold text-[#5B4A6E] hover:bg-gray-50 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#6B2D8C] text-white text-xs font-black rounded-xl hover:bg-[#4A2560] transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Requirements</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ORDER CONFIRMATION MODAL */}
      {isOrderModalOpen && confirmationOrder && (
        <OrderConfirmationModal
          isOpen={isOrderModalOpen}
          order={confirmationOrder}
          onClose={() => setIsOrderModalOpen(false)}
          onViewOrders={() => setIsOrderModalOpen(false)}
        />
      )}
    </div>
  );
};
