import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  CreditCard,
  Truck,
  FileText,
  FileCheck2,
  ShieldCheck,
  Sparkles,
  Clock,
  Check,
  Copy,
  ArrowRight,
  AlertCircle,
  Coins,
  Download,
  Printer,
  ThumbsUp,
  Star,
  RefreshCw,
  FileSignature,
  Eye,
  Settings,
  History,
  TrendingUp,
  ChevronRight,
  User,
  MapPin,
  Building2,
  MessageSquare,
  FlaskConical
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WorkspaceScreenProps {
  onOpenRFQModal?: () => void;
  onNavigateToExplore?: () => void;
}

export const WorkspaceScreen: React.FC<WorkspaceScreenProps> = ({
  onOpenRFQModal,
  onNavigateToExplore
}) => {
  const [activeTab, setActiveTab] = useState<'samples' | 'escrow' | 'documents'>('samples');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showLocalToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ----------------------------------------------------
  // STATE 1: SAMPLE ORDERING SYSTEM
  // ----------------------------------------------------
  const [sampleOrders, setSampleOrders] = useState([
    {
      id: 'SMP-9921',
      productName: 'Botanical Peptide Barrier Cream (Formula B)',
      supplierName: 'Aura Beauty Labs',
      location: 'Mumbai, Maharashtra',
      feeStructure: {
        formulationFee: 500,
        customPackagingMold: 250,
        shippingAndAssayFee: 150,
        total: 900,
        terms: '100% refundable back to buyer on subsequent bulk manufacturing order of ≥500 Liters.'
      },
      status: 'pending_payment', // pending_payment, paid_processing, shipped_in_transit, delivered_awaiting_feedback, completed
      trackingStep: 0, // 0 to 4
      feedback: null as any,
      dispatchCarrier: 'Blue Dart Premium Air',
      awbNo: 'BD-8831092-IN',
      estDelivery: 'Aug 19, 2026'
    },
    {
      id: 'SMP-8832',
      productName: 'Professional Retinol 1% Serum Base',
      supplierName: 'Dermaglow India',
      location: 'Ahmedabad, Gujarat',
      feeStructure: {
        formulationFee: 600,
        customPackagingMold: 0,
        shippingAndAssayFee: 100,
        total: 700,
        terms: '100% refundable back to buyer on subsequent bulk order of ≥100 Liters.'
      },
      status: 'shipped_in_transit',
      trackingStep: 2, // Compounded, Quality Passed, Dispatched
      feedback: null as any,
      dispatchCarrier: 'Blue Dart Premium Air',
      awbNo: 'BD-7731248-IN',
      estDelivery: 'Aug 17, 2026 (In Transit)'
    },
    {
      id: 'SMP-7714',
      productName: 'Keratin Hair Repair Spa Treatment',
      supplierName: 'LuxeForm Cosmetics',
      location: 'Delhi NCR',
      feeStructure: {
        formulationFee: 400,
        customPackagingMold: 150,
        shippingAndAssayFee: 100,
        total: 650,
        terms: '100% refundable back to buyer on bulk manufacturing contract.'
      },
      status: 'delivered_awaiting_feedback',
      trackingStep: 3, // Delivered
      feedback: null as any,
      dispatchCarrier: 'Delhivery B2B cargo',
      awbNo: 'DLV-4421098-DEL',
      estDelivery: 'Delivered Today'
    }
  ]);

  // Payment State Handler
  const [payingSampleId, setPayingSampleId] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState(0);

  const handlePaySampleFee = (sampleId: string) => {
    setPayingSampleId(sampleId);
    setPaymentProcessing(true);
    setPaymentStep(10);
    
    const interval = setInterval(() => {
      setPaymentStep((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setSampleOrders((prevOrders) =>
              prevOrders.map((o) =>
                o.id === sampleId
                  ? { ...o, status: 'paid_processing', trackingStep: 1 }
                  : o
              )
            );
            setPaymentProcessing(false);
            setPayingSampleId(null);
            showLocalToast('Sample ordering fee paid successfully! Compounding compounding initiated.');
          }, 300);
          return 100;
        }
        return prev + 25;
      });
    }, 200);
  };

  // Feedback State Handler
  const [feedbackSampleId, setFeedbackSampleId] = useState<string | null>(null);
  const [viscosityScore, setViscosityScore] = useState(5);
  const [scentScore, setScentScore] = useState(5);
  const [absorptionScore, setAbsorptionScore] = useState(5);
  const [packagingSeal, setPackagingSeal] = useState<'Pass' | 'Fail'>('Pass');
  const [feedbackRemarks, setFeedbackRemarks] = useState('');
  const [decision, setDecision] = useState<'approve' | 'adjust'>('approve');

  const handleSubmitFeedback = () => {
    if (!feedbackSampleId) return;
    
    setSampleOrders((prevOrders) =>
      prevOrders.map((o) =>
        o.id === feedbackSampleId
          ? {
              ...o,
              status: 'completed',
              trackingStep: 4,
              feedback: {
                viscosity: viscosityScore,
                scent: scentScore,
                absorption: absorptionScore,
                packaging: packagingSeal,
                remarks: feedbackRemarks,
                decision: decision
              }
            }
          : o
      )
    );

    showLocalToast(
      decision === 'approve'
        ? 'Sample approved! Proceeding to bulk manufacturing contract & PO generation.'
        : 'Formulation adjustment feedback logged successfully.'
    );
    setFeedbackSampleId(null);
    // Reset feedback fields
    setFeedbackRemarks('');
  };

  // ----------------------------------------------------
  // STATE 2: ESCROW PAYMENT & ADVANCE MILESTONE ENGINE
  // ----------------------------------------------------
  const [bulkContracts, setBulkContracts] = useState([
    {
      id: 'ESC-88301',
      productName: 'Private Label Vitamin C Active Serum',
      supplierName: 'LuxeForm Cosmetics Pvt Ltd',
      location: 'Delhi NCR',
      totalContractValue: 360000,
      quantityRequired: '3,000 Bottles (30ml standard amber glass)',
      milestones: {
        advancePercentage: 30,
        advanceAmount: 108000,
        postDispatchPercentage: 70,
        postDispatchAmount: 252000
      },
      status: 'awaiting_advance', // awaiting_advance, advance_locked, production_dispatched, inspected_delivered, completed_released
      blockchainTxHash: null as string | null
    },
    {
      id: 'ESC-77140',
      productName: 'Botanical Peptide Barrier Cream (Bulk Phase 1)',
      supplierName: 'Aura Beauty Labs',
      location: 'Mumbai, Maharashtra',
      totalContractValue: 640000,
      quantityRequired: '1,000 Liters (Bulk drumming container)',
      milestones: {
        advancePercentage: 30,
        advanceAmount: 192000,
        postDispatchPercentage: 70,
        postDispatchAmount: 448000
      },
      status: 'advance_locked', // 30% secured in escrow
      blockchainTxHash: '0x3f71c4c92b11e0a98471bd766a5e12f68b3dc8ef'
    }
  ]);

  const [escrowProcessingId, setEscrowProcessingId] = useState<string | null>(null);
  const [escrowActionType, setEscrowActionType] = useState<'fund_advance' | 'release_advance' | 'fund_final' | 'release_final' | null>(null);
  const [escrowProgress, setEscrowProgress] = useState(0);

  const handleEscrowAction = (contractId: string, action: 'fund_advance' | 'release_advance' | 'fund_final' | 'release_final') => {
    setEscrowProcessingId(contractId);
    setEscrowActionType(action);
    setEscrowProgress(15);

    const interval = setInterval(() => {
      setEscrowProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setBulkContracts((prevContracts) =>
              prevContracts.map((c) => {
                if (c.id !== contractId) return c;
                let nextStatus = c.status;
                let txHash = c.blockchainTxHash;

                if (action === 'fund_advance') {
                  nextStatus = 'advance_locked';
                  txHash = '0x' + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('');
                } else if (action === 'release_advance') {
                  nextStatus = 'production_dispatched';
                } else if (action === 'fund_final') {
                  nextStatus = 'inspected_delivered';
                } else if (action === 'release_final') {
                  nextStatus = 'completed_released';
                }

                return {
                  ...c,
                  status: nextStatus,
                  blockchainTxHash: txHash
                };
              })
            );

            setEscrowProcessingId(null);
            setEscrowActionType(null);

            const msgMap = {
              fund_advance: '30% Advance Payment successfully locked in B2B Escrow. Sourcing initiated.',
              release_advance: 'Advance escrow released to manufacturer. Production dispatched.',
              fund_final: '70% Balance locked in Escrow. Shipment delivery registered.',
              release_final: 'Contract completed! Locked funds fully settled with manufacturer.'
            };
            showLocalToast(msgMap[action]);
          }, 300);
          return 100;
        }
        return prev + 17;
      });
    }, 150);
  };

  // ----------------------------------------------------
  // STATE 3: PROFORMA INVOICE & PURCHASE ORDER (PO)
  // ----------------------------------------------------
  const [approvedQuotes, setApprovedQuotes] = useState([
    {
      id: 'QUO-441209',
      sourcingRequirement: '5,000 Frosted Cosmetic Jars (50g)',
      supplierName: 'BeautyPro Manufacturing',
      supplierAddress: 'Plot 42, GIDC Industrial Estate, Umargam, Gujarat - 396170',
      buyerName: 'Nexora Premium Cosmetics (You)',
      buyerAddress: 'Unit 504, Dynasty Business Park, Andheri East, Mumbai - 400059',
      supplierGstin: '24AAAAA1111A1Z1',
      buyerGstin: '27BBBBB2222B2Z2',
      items: [
        { desc: 'Frosted Glass Cosmetic Jar - 50g Premium Luxury Finish', qty: 5000, rate: 45, total: 225000 }
      ],
      igstRate: 18,
      igstAmount: 40500,
      grandTotal: 265500,
      paymentTerms: '30% Advance milestones, 70% Escrow Delivery Release',
      deliveryLeadTime: '14 Days from Advance payment',
      piNumber: 'PI-2026-88402',
      poNumber: 'PO-2026-33921',
      createdDate: 'Aug 16, 2026',
      documentStatus: 'ready' // ready, generated
    }
  ]);

  const [activeDocPreview, setActiveDocPreview] = useState<{
    quote: typeof approvedQuotes[0];
    type: 'PI' | 'PO';
  } | null>(null);

  const handleGenerateDocuments = (quoteId: string) => {
    setApprovedQuotes((prev) =>
      prev.map((q) => (q.id === quoteId ? { ...q, documentStatus: 'generated' } : q))
    );
    showLocalToast('Proforma Invoice & Purchase Order compiled and cryptographically signed!');
    // Open preview automatically
    const target = approvedQuotes.find((q) => q.id === quoteId);
    if (target) {
      setActiveDocPreview({ quote: { ...target, documentStatus: 'generated' }, type: 'PI' });
    }
  };

  return (
    <div id="workspace-container" className="py-8 px-4 md:px-10 max-w-[1440px] mx-auto min-h-[70vh]">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-22 right-6 z-50 bg-[#1c1b1b] text-white px-4 py-3 rounded-xl shadow-xl border border-[#313030] flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#e6007e]" />
          <span className="text-[13px] font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Screen Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fde7f3] text-[#b90064] font-bold text-[11px] uppercase tracking-wider mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>B2B SECURE WORKSPACE</span>
        </div>
        <h1 className="text-3xl font-black text-[#1c1b1b] tracking-tight">
          Commercial Sourcing &amp; Transaction Hub
        </h1>
        <p className="text-[14px] text-[#594047] font-medium mt-1">
          Manage formulation sampling checkouts, bulk escrow milestones, and automated Proforma Invoice/Purchase Order generators.
        </p>
      </div>

      {/* Primary Workspace Navigation Tabs */}
      <div className="flex border-b border-[#e8e8e8] mb-8 overflow-x-auto whitespace-nowrap scrollbar-none">
        <button
          onClick={() => setActiveTab('samples')}
          className={`pb-4 px-1 text-[14px] font-bold mr-8 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'samples'
              ? 'text-[#b90064] border-b-2 border-[#b90064]'
              : 'text-[#594047] hover:text-[#1c1b1b]'
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          <span>Formulation Sampling Hub</span>
          <span className="text-[10px] bg-[#fde7f3] text-[#b90064] px-1.5 py-0.5 rounded-full font-bold">
            {sampleOrders.filter(o => o.status !== 'completed').length} Active
          </span>
        </button>

        <button
          onClick={() => setActiveTab('escrow')}
          className={`pb-4 px-1 text-[14px] font-bold mr-8 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'escrow'
              ? 'text-[#b90064] border-b-2 border-[#b90064]'
              : 'text-[#594047] hover:text-[#1c1b1b]'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Escrow &amp; Milestone Engine</span>
          <span className="text-[10px] bg-[#e6f0ff] text-[#0050d6] px-1.5 py-0.5 rounded-full font-bold">
            {bulkContracts.filter(c => c.status !== 'completed_released').length} Bulk
          </span>
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`pb-4 px-1 text-[14px] font-bold mr-8 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'documents'
              ? 'text-[#b90064] border-b-2 border-[#b90064]'
              : 'text-[#594047] hover:text-[#1c1b1b]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Proforma Invoice &amp; PO Docs</span>
          <span className="text-[10px] bg-[#e6f4ea] text-[#137333] px-1.5 py-0.5 rounded-full font-bold">
            PI/PO Generated
          </span>
        </button>
      </div>

      {/* ----------------------------------------------------
          TAB 1: SAMPLES & CUSTOM FORMULATION TRACKING
          ---------------------------------------------------- */}
      {activeTab === 'samples' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200/60 p-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-[13px] text-amber-900 font-medium">
              <strong className="font-bold">Refundable Sample Policy:</strong> All lab-scale compounding and raw material assay costs incurred are 100% credited back to your account upon signing the subsequent commercial bulk supply contract.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Active Sample Orders */}
            <div className="lg:col-span-2 space-y-4">
              {sampleOrders.map((sample) => (
                <div key={sample.id} className="bg-white border border-[#e8e8e8] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2 pb-4 border-b border-[#f0edec]">
                    <div>
                      <span className="text-[11px] font-extrabold uppercase font-mono text-[#594047] bg-[#f0edec] px-2.5 py-1 rounded-md">
                        SAMPLE CODE: {sample.id}
                      </span>
                      <h3 className="text-base font-bold text-[#1c1b1b] mt-2 tracking-tight">
                        {sample.productName}
                      </h3>
                      <p className="text-[12px] text-[#594047] font-semibold mt-0.5">
                        Sourced from: <strong className="text-[#1c1b1b]">{sample.supplierName}</strong> ({sample.location})
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-[11px] text-[#8c7077] font-bold uppercase">Sampling Cost</div>
                      <div className="text-lg font-black text-[#b90064]">₹{sample.feeStructure.total}</div>
                      <span className="text-[10px] text-emerald-700 bg-[#e6f4ea] px-2 py-0.5 rounded-full font-bold uppercase">
                        100% Refundable
                      </span>
                    </div>
                  </div>

                  {/* Pricing breakdown drawer summary */}
                  <div className="py-3 px-4 bg-[#fcf9f8] rounded-xl border border-[#e8e8e8] text-[12px] my-4 grid grid-cols-1 sm:grid-cols-4 gap-2 text-[#594047]">
                    <div>
                      <span className="block text-[10px] font-extrabold text-[#8c7077] uppercase">Lab Compounding</span>
                      <span className="font-bold text-[#1c1b1b]">₹{sample.feeStructure.formulationFee}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-extrabold text-[#8c7077] uppercase">Packaging Mold</span>
                      <span className="font-bold text-[#1c1b1b]">₹{sample.feeStructure.customPackagingMold}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-extrabold text-[#8c7077] uppercase">Shipping &amp; NABL</span>
                      <span className="font-bold text-[#1c1b1b]">₹{sample.feeStructure.shippingAndAssayFee}</span>
                    </div>
                    <div className="sm:border-l sm:pl-3 sm:border-[#e8e8e8]">
                      <span className="block text-[10px] font-extrabold text-emerald-700 uppercase">Bulk Reimbursement</span>
                      <span className="text-[10.5px] font-bold text-[#1c1b1b] leading-tight block">Credited on PO</span>
                    </div>
                  </div>

                  {/* Delivery Timeline Visualizer Stepper */}
                  <div className="py-4">
                    <span className="text-[11px] font-extrabold text-[#8c7077] uppercase tracking-wider block mb-3">
                      Sampling Dispatch &amp; Quality Track
                    </span>
                    <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-bold relative">
                      {[
                        { label: 'Sourcing Approved', desc: 'Recipe cleared' },
                        { label: 'Lab Compounded', desc: 'Formulated' },
                        { label: 'Quality Assayed', desc: 'NABL Certified' },
                        { label: 'Dispatched', desc: sample.dispatchCarrier },
                        { label: 'Delivered', desc: sample.estDelivery }
                      ].map((step, idx) => {
                        const isDone = sample.trackingStep >= idx;
                        const isCurrent = sample.trackingStep === idx;
                        return (
                          <div key={idx} className="space-y-2 relative">
                            {/* Line connecting */}
                            {idx < 4 && (
                              <div
                                className={`absolute left-1/2 top-3 w-full h-[2px] z-0 -translate-y-1/2 ${
                                  sample.trackingStep > idx ? 'bg-[#00875a]' : 'bg-[#e8e8e8]'
                                }`}
                              />
                            )}
                            <div
                              className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center relative z-10 font-mono text-[11px] ${
                                isDone
                                  ? 'bg-[#00875a] text-white'
                                  : 'bg-[#e8e8e8] text-[#8c7077]'
                              } ${isCurrent ? 'ring-4 ring-emerald-100' : ''}`}
                            >
                              {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                            </div>
                            <div>
                              <div className={`leading-tight ${isDone ? 'text-zinc-950' : 'text-[#8c7077]'}`}>{step.label}</div>
                              <div className="text-[8.5px] text-[#8c7077] truncate font-medium max-w-[90px] mx-auto mt-0.5">{step.desc}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Interactive Status CTAs */}
                  <div className="mt-4 pt-4 border-t border-[#e8e8e8] flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[#0050d6]" />
                      <span className="text-[12px] font-bold text-zinc-900">
                        Carrier Status:{' '}
                        <span className="text-[#0050d6] font-extrabold uppercase">
                          {sample.status === 'pending_payment'
                            ? 'Awaiting Payment Settle'
                            : sample.status === 'paid_processing'
                            ? 'Aseptic Compounding Base'
                            : sample.status === 'shipped_in_transit'
                            ? 'In Transit - Courier Stream'
                            : sample.status === 'delivered_awaiting_feedback'
                            ? 'Delivered (Action Required)'
                            : 'Completed & Approved'}
                        </span>
                      </span>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                      {sample.status === 'pending_payment' && (
                        <button
                          onClick={() => handlePaySampleFee(sample.id)}
                          className="w-full sm:w-auto bg-[#b90064] hover:bg-[#8e004b] text-white text-[12.5px] font-bold py-2.5 px-5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>Pay Sampling Fee (₹{sample.feeStructure.total})</span>
                        </button>
                      )}

                      {sample.status === 'delivered_awaiting_feedback' && (
                        <button
                          onClick={() => setFeedbackSampleId(sample.id)}
                          className="w-full sm:w-auto bg-[#0050d6] hover:bg-[#003da8] text-white text-[12.5px] font-bold py-2.5 px-5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                        >
                          <ThumbsUp className="w-4 h-4" />
                          <span>Submit Lab Feedback &amp; Approve</span>
                        </button>
                      )}

                      {sample.status === 'completed' && (
                        <div className="flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11.5px] font-bold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Lab Formula Approved (Ready for Bulk PO)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Side Card: Active Sampling Stats */}
            <div className="space-y-6">
              <div className="bg-[#fcf9f8] border border-[#e8e8e8] p-5 rounded-2xl">
                <h4 className="font-bold text-[14px] text-[#1c1b1b] uppercase tracking-wider mb-3">
                  Sampling Sourcing SLA Log
                </h4>
                <div className="space-y-3.5 text-[12.5px] text-[#594047]">
                  <div className="flex justify-between border-b border-[#e8e8e8] pb-2">
                    <span>Average Dispatch Lead Time:</span>
                    <span className="font-bold text-[#1c1b1b]">48 Hours</span>
                  </div>
                  <div className="flex justify-between border-b border-[#e8e8e8] pb-2">
                    <span>Compounding Labs:</span>
                    <span className="font-bold text-emerald-700">ISO 9001 Audited</span>
                  </div>
                  <div className="flex justify-between border-b border-[#e8e8e8] pb-2">
                    <span>Feedback Loop Goal:</span>
                    <span className="font-bold text-[#0050d6]">PO Generation within 7 Days</span>
                  </div>
                </div>

                <div className="mt-5 p-3.5 bg-white border border-[#e8e8e8] rounded-xl text-[11px] font-medium text-[#594047] space-y-2">
                  <div className="font-bold text-zinc-950 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#b90064] fill-[#fde7f3]" />
                    Automatic Bulk Sourcing Link
                  </div>
                  <p className="leading-relaxed">
                    Once you approve a sample formula, our system marks the recipe as <strong>"Sourcing Locked"</strong>. You can then instantly compile a digital Purchase Order with certified rates.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 2: ESCROW PAYMENT & ADVANCE MILESTONE ENGINE
          ---------------------------------------------------- */}
      {activeTab === 'escrow' && (
        <div className="space-y-6">
          <div className="bg-[#e6f0ff] border border-[#bfdbfe] p-4 rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#0050d6] shrink-0 mt-0.5" />
            <div className="text-[13px] text-[#0050d6] font-medium">
              <strong className="font-bold">B2B Trade Protection Escrow:</strong> Your funds are safely locked in an independent banking escrow vault. Suppliers only receive milestones (30% advance for raw materials, 70% post-delivery) when verified dispatch logs and quality checks are cryptographically signed.
            </div>
          </div>

          <div className="space-y-6">
            {bulkContracts.map((contract) => (
              <div key={contract.id} className="bg-white border border-[#e8e8e8] rounded-2xl p-6 shadow-sm">
                
                {/* Header info */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-4 border-b border-[#f0edec]">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#f0edec] rounded text-[11px] font-bold font-mono">
                      CONTRACT ID: {contract.id}
                    </div>
                    <h3 className="text-lg font-bold text-[#1c1b1b] mt-2 tracking-tight">
                      {contract.productName}
                    </h3>
                    <p className="text-[13px] text-[#594047] font-semibold">
                      Bulk Manufacturer Partner: <strong className="text-[#1c1b1b]">{contract.supplierName}</strong> ({contract.location})
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-[11px] text-[#8c7077] font-bold uppercase">Contract Value</div>
                    <div className="text-xl font-black text-[#0050d6]">₹{contract.totalContractValue.toLocaleString('en-IN')}</div>
                    <span className="text-[11px] font-mono font-bold text-[#594047] block mt-0.5">
                      Batch: {contract.quantityRequired}
                    </span>
                  </div>
                </div>

                {/* Secure Escrow Milestone Visualizer */}
                <div className="my-8">
                  <span className="text-[11px] font-extrabold text-[#8c7077] uppercase tracking-wider block mb-4 text-center md:text-left">
                    Escrow Trust Ledger Milestones
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                    
                    {/* Milestone 1: 30% Advance Lock */}
                    <div className={`p-4 rounded-xl border transition-all ${
                      contract.status !== 'awaiting_advance'
                        ? 'bg-[#e6f4ea] border-[#a3cfb1]'
                        : 'bg-[#fcf9f8] border-dashed border-[#e8e8e8] ring-2 ring-amber-100'
                    }`}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-extrabold text-[#8c7077] uppercase">Milestone 1</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                          contract.status !== 'awaiting_advance'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {contract.status !== 'awaiting_advance' ? 'Funded & Locked' : 'Action Required'}
                        </span>
                      </div>
                      <h4 className="text-[13px] font-bold text-[#1c1b1b]">30% Advance Escrow</h4>
                      <p className="text-[11.5px] text-[#594047] mt-1">
                        Settle raw material costs: <strong className="text-[#1c1b1b]">₹{contract.milestones.advanceAmount.toLocaleString('en-IN')}</strong>
                      </p>
                    </div>

                    {/* Milestone 2: Supplier Dispatches & Advance Release */}
                    <div className={`p-4 rounded-xl border transition-all ${
                      contract.status === 'production_dispatched' || contract.status === 'inspected_delivered' || contract.status === 'completed_released'
                        ? 'bg-[#e6f4ea] border-[#a3cfb1]'
                        : contract.status === 'advance_locked'
                        ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-100'
                        : 'bg-[#fcf9f8] border-[#e8e8e8]'
                    }`}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-extrabold text-[#8c7077] uppercase">Milestone 2</span>
                        <span className="text-[10px] font-black">
                          {contract.status === 'awaiting_advance' ? 'Locked' : 'Processing'}
                        </span>
                      </div>
                      <h4 className="text-[13px] font-bold text-[#1c1b1b]">Production &amp; Dispatch</h4>
                      <p className="text-[11.5px] text-[#594047] mt-1">
                        Manufacturer updates bill of lading logs to unlock 30% advance release.
                      </p>
                    </div>

                    {/* Milestone 3: 70% Post-Dispatch Lock */}
                    <div className={`p-4 rounded-xl border transition-all ${
                      contract.status === 'inspected_delivered' || contract.status === 'completed_released'
                        ? 'bg-[#e6f4ea] border-[#a3cfb1]'
                        : contract.status === 'production_dispatched'
                        ? 'bg-amber-50 border-amber-300 ring-2 ring-[#0050d6]/10'
                        : 'bg-[#fcf9f8] border-[#e8e8e8]'
                    }`}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-extrabold text-[#8c7077] uppercase">Milestone 3</span>
                        <span className="text-[10px] font-black">Hold Secure</span>
                      </div>
                      <h4 className="text-[13px] font-bold text-[#1c1b1b]">70% Delivery Hold</h4>
                      <p className="text-[11.5px] text-[#594047] mt-1">
                        Deposit final <strong className="text-[#1c1b1b]">₹{contract.milestones.postDispatchAmount.toLocaleString('en-IN')}</strong> held in trust escrow.
                      </p>
                    </div>

                    {/* Milestone 4: Inspection Clear & Final Release */}
                    <div className={`p-4 rounded-xl border transition-all ${
                      contract.status === 'completed_released'
                        ? 'bg-[#e6f4ea] border-[#a3cfb1]'
                        : 'bg-[#fcf9f8] border-[#e8e8e8]'
                    }`}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-extrabold text-[#8c7077] uppercase">Milestone 4</span>
                        <span className="text-[10px] font-black">Final Settlement</span>
                      </div>
                      <h4 className="text-[13px] font-bold text-[#1c1b1b]">Quality Pass Release</h4>
                      <p className="text-[11.5px] text-[#594047] mt-1">
                        Inspect cargo at facility. Press release to settle full escrow balance.
                      </p>
                    </div>

                  </div>
                </div>

                {/* Progress feedback for active escrow processes */}
                {escrowProcessingId === contract.id && (
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-4 text-[12.5px]">
                    <div className="flex justify-between items-center font-bold text-[#1c1b1b] mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <RefreshCw className="w-4 h-4 animate-spin text-[#0050d6]" />
                        B2B Payment Settlement Gateway Syncing...
                      </span>
                      <span>{escrowProgress}%</span>
                    </div>
                    <div className="w-full bg-[#e8e8e8] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#0050d6] h-2 rounded-full transition-all duration-300" style={{ width: `${escrowProgress}%` }}></div>
                    </div>
                    <span className="text-[11px] text-[#8c7077] mt-1 block">Authorizing secure banking wire and registering hash to B2B Sourcing Ledger...</span>
                  </div>
                )}

                {/* Contract Footer Info & Actions */}
                <div className="pt-4 border-t border-[#e8e8e8] flex flex-col md:flex-row justify-between items-center gap-3">
                  <div className="text-[11.5px] text-[#594047] font-medium">
                    {contract.blockchainTxHash ? (
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                        <span>
                          Registrar Cryptographic Tx:{' '}
                          <code className="font-mono text-[#0050d6] font-bold bg-[#e6f0ff] px-1.5 py-0.5 rounded">
                            {contract.blockchainTxHash}
                          </code>
                        </span>
                      </div>
                    ) : (
                      <span className="text-amber-700 font-bold">
                        ▲ Trade payment escrow awaiting initial advance lock.
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 w-full md:w-auto">
                    {contract.status === 'awaiting_advance' && (
                      <button
                        onClick={() => handleEscrowAction(contract.id, 'fund_advance')}
                        className="w-full md:w-auto bg-[#0050d6] hover:bg-[#003da8] text-white text-[12px] font-bold py-2.5 px-5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Coins className="w-4 h-4" />
                        <span>Fund 30% Advance (₹{contract.milestones.advanceAmount.toLocaleString('en-IN')})</span>
                      </button>
                    )}

                    {contract.status === 'advance_locked' && (
                      <button
                        onClick={() => handleEscrowAction(contract.id, 'release_advance')}
                        className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold py-2.5 px-5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <FileCheck2 className="w-4 h-4" />
                        <span>Release 30% on Dispatch Settle</span>
                      </button>
                    )}

                    {contract.status === 'production_dispatched' && (
                      <button
                        onClick={() => handleEscrowAction(contract.id, 'fund_final')}
                        className="w-full md:w-auto bg-[#b90064] hover:bg-[#8e004b] text-white text-[12px] font-bold py-2.5 px-5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Fund 70% Final Held Escrow</span>
                      </button>
                    )}

                    {contract.status === 'inspected_delivered' && (
                      <button
                        onClick={() => handleEscrowAction(contract.id, 'release_final')}
                        className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold py-2.5 px-5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Quality Checked: Release Escrow &amp; Settle</span>
                      </button>
                    )}

                    {contract.status === 'completed_released' && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e6f4ea] text-[#137333] border border-[#a3cfb1] rounded-lg text-[12px] font-bold">
                        <Check className="w-4 h-4" />
                        <span>Contract Settle Completed Successfully</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 3: PROFORMA INVOICE & PURCHASE ORDER (PO)
          ---------------------------------------------------- */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-[#a3cfb1] p-4 rounded-xl flex items-start gap-3">
            <FileText className="w-5 h-5 text-[#137333] shrink-0 mt-0.5" />
            <div className="text-[13px] text-[#137333] font-medium">
              <strong className="font-bold">Authorized Document compiler:</strong> Approve quotes to automatically generate standardized B2B Proforma Invoices (PI) and Purchase Orders (PO) containing fully calculated CGST/SGST/IGST rates conforming to GST standards.
            </div>
          </div>

          <div className="bg-white border border-[#e8e8e8] rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fcf9f8] border-b border-[#e8e8e8] text-[11px] font-extrabold text-[#8c7077] uppercase tracking-wider">
                  <th className="py-3 px-6">Approved Sourcing Quote</th>
                  <th className="py-3 px-6">B2B Manufacturing Partner</th>
                  <th className="py-3 px-6">Total Amount (Incl. Taxes)</th>
                  <th className="py-3 px-6">Document Generation Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0edec] text-[13px]">
                {approvedQuotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-[#fdf8f8]/30 transition-colors">
                    <td className="py-4 px-6 font-bold text-[#1c1b1b]">
                      <div>{quote.sourcingRequirement}</div>
                      <span className="text-[10px] font-mono font-bold text-[#8c7077] bg-[#f0edec] px-1.5 py-0.5 rounded">
                        Quote ID: {quote.id}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-[#1c1b1b]">
                      {quote.supplierName}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-[#b90064]">₹{quote.grandTotal.toLocaleString('en-IN')}</div>
                      <span className="text-[10px] text-[#8c7077] font-semibold">Includes 18% IGST</span>
                    </td>
                    <td className="py-4 px-6">
                      {quote.documentStatus === 'generated' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          PI &amp; PO Compiled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md animate-pulse">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Awaiting Document Build
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {quote.documentStatus === 'generated' ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setActiveDocPreview({ quote, type: 'PI' })}
                            className="bg-white border border-[#e8e8e8] hover:bg-[#f0edec] text-[#1c1b1b] text-[11.5px] font-bold py-2 px-3.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview PI</span>
                          </button>
                          <button
                            onClick={() => setActiveDocPreview({ quote, type: 'PO' })}
                            className="bg-white border border-[#b90064] text-[#b90064] hover:bg-[#fde7f3] text-[11.5px] font-bold py-2 px-3.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <FileSignature className="w-3.5 h-3.5" />
                            <span>Preview PO</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleGenerateDocuments(quote.id)}
                          className="bg-[#b90064] hover:bg-[#8e004b] text-white text-[12px] font-bold py-2 px-4 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                        >
                          <FileCheck2 className="w-4 h-4" />
                          <span>Generate PI &amp; PO Docs</span>
                        </button>
                      )}
                    </td>
                </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          SUB-MODAL 1: SAMPLE FEEDBACK POPUP
          ---------------------------------------------------- */}
      {feedbackSampleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-[#e8e8e8] p-6 text-left space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[#e8e8e8]">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-[#b90064]" />
                <h3 className="font-bold text-base text-[#1c1b1b]">Compile Lab Sample Feedback</h3>
              </div>
              <button onClick={() => setFeedbackSampleId(null)} className="p-1 rounded-lg hover:bg-[#f0edec] text-zinc-500 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-[12.5px]">
              
              {/* Ratings Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-[#1c1b1b]">Viscosity / Texture</label>
                  <select
                    value={viscosityScore}
                    onChange={(e) => setViscosityScore(Number(e.target.value))}
                    className="w-full bg-[#fcf9f8] border border-[#e8e8e8] rounded-lg p-2 font-semibold"
                  >
                    <option value={5}>5 (Perfect Blend)</option>
                    <option value={4}>4 (Slightly Thick)</option>
                    <option value={3}>3 (Needs adjusting)</option>
                    <option value={2}>2 (Imperfect)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-[#1c1b1b]">Scent &amp; Aroma</label>
                  <select
                    value={scentScore}
                    onChange={(e) => setScentScore(Number(e.target.value))}
                    className="w-full bg-[#fcf9f8] border border-[#e8e8e8] rounded-lg p-2 font-semibold"
                  >
                    <option value={5}>5 (Matches Target)</option>
                    <option value={4}>4 (Too Intensive)</option>
                    <option value={3}>3 (Needs Essential Oils)</option>
                    <option value={2}>2 (Unpleasant)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-[#1c1b1b]">Skin Absorption</label>
                  <select
                    value={absorptionScore}
                    onChange={(e) => setAbsorptionScore(Number(e.target.value))}
                    className="w-full bg-[#fcf9f8] border border-[#e8e8e8] rounded-lg p-2 font-semibold"
                  >
                    <option value={5}>5 (Instant Seep)</option>
                    <option value={4}>4 (Slightly Greasy)</option>
                    <option value={3}>3 (Film Residual)</option>
                    <option value={2}>2 (Poor Settle)</option>
                  </select>
                </div>
              </div>

              {/* Packaging Leakage Test */}
              <div className="space-y-1">
                <label className="block font-bold text-[#1c1b1b]">Container &amp; Pump Seal Leakage Test</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                    <input
                      type="radio"
                      name="pkg-seal"
                      checked={packagingSeal === 'Pass'}
                      onChange={() => setPackagingSeal('Pass')}
                      className="accent-[#00875a] w-4 h-4 cursor-pointer"
                    />
                    <span className="text-[#00875a]">100% PASS (No Spillage/Oxidation)</span>
                  </label>
                  <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                    <input
                      type="radio"
                      name="pkg-seal"
                      checked={packagingSeal === 'Fail'}
                      onChange={() => setPackagingSeal('Fail')}
                      className="accent-[#c53929] w-4 h-4 cursor-pointer"
                    />
                    <span className="text-[#c53929]">FAIL (Active Leakage Registered)</span>
                  </label>
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-1">
                <label className="block font-bold text-[#1c1b1b]">Detailed Assay Remarks</label>
                <textarea
                  rows={2}
                  value={feedbackRemarks}
                  onChange={(e) => setFeedbackRemarks(e.target.value)}
                  placeholder="State viscosity improvements or scent preference details..."
                  className="w-full bg-[#fcf9f8] border border-[#e8e8e8] rounded-lg p-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-[#b90064]"
                />
              </div>

              {/* Sourcing Decision */}
              <div className="space-y-1 bg-[#fde7f3]/40 p-3 rounded-lg border border-[#ffd9e2]">
                <label className="block font-bold text-[#b90064] mb-1">Final Formulation Decision</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 font-bold cursor-pointer text-[#1c1b1b]">
                    <input
                      type="radio"
                      name="sourcing-dec"
                      checked={decision === 'approve'}
                      onChange={() => setDecision('approve')}
                      className="accent-[#b90064] w-4 h-4 cursor-pointer"
                    />
                    <span>Lock Recipe &amp; Request PO</span>
                  </label>
                  <label className="flex items-center gap-1.5 font-bold cursor-pointer text-[#1c1b1b]">
                    <input
                      type="radio"
                      name="sourcing-dec"
                      checked={decision === 'adjust'}
                      onChange={() => setDecision('adjust')}
                      className="accent-[#b90064] w-4 h-4 cursor-pointer"
                    />
                    <span>Reject &amp; Request Lab Adjustments</span>
                  </label>
                </div>
              </div>

            </div>

            <div className="pt-3 border-t border-[#e8e8e8] flex justify-end gap-2 text-[12.5px]">
              <button
                onClick={() => setFeedbackSampleId(null)}
                className="px-4 py-2 hover:bg-[#f0edec] rounded-lg text-[#594047] font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitFeedback}
                className="bg-[#b90064] hover:bg-[#8e004b] text-white font-bold px-5 py-2 rounded-lg cursor-pointer"
              >
                Submit Signed Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          SUB-MODAL 2: HIGH-FIDELITY PI & PO DOCUMENT VIEWER
          ---------------------------------------------------- */}
      {activeDocPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col md:flex-row overflow-hidden shadow-2xl border border-[#e8e8e8]">
            
            {/* Left Column: Authentic simulated document A4 sheet */}
            <div className="flex-1 bg-zinc-800 p-6 overflow-y-auto flex items-center justify-center">
              <div id="simulated-a4-sheet" className="bg-white text-zinc-900 w-full max-w-[595px] min-h-[842px] p-8 shadow-2xl relative border border-zinc-300 rounded-sm text-[12px] flex flex-col justify-between text-left">
                
                {/* PDF Header */}
                <div>
                  <div className="flex justify-between items-start pb-6 border-b border-zinc-200">
                    <div>
                      <div className="flex items-center gap-1.5 text-[#b90064]">
                        <span className="w-5 h-5 bg-[#b90064] text-white flex items-center justify-center rounded font-bold text-[11px]">N</span>
                        <span className="font-bold text-[15px] tracking-tight text-zinc-950">NEXORA LUXE B2B</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-1 font-medium">Verified Commercial Trade Document</p>
                    </div>

                    <div className="text-right">
                      <h2 className="text-base font-black text-zinc-950 uppercase tracking-wide">
                        {activeDocPreview.type === 'PI' ? 'PROFORMA INVOICE' : 'PURCHASE ORDER'}
                      </h2>
                      <span className="font-mono text-[11px] font-bold text-[#0050d6] block mt-1">
                        {activeDocPreview.type === 'PI' ? activeDocPreview.quote.piNumber : activeDocPreview.quote.poNumber}
                      </span>
                      <span className="text-[9.5px] text-zinc-400 font-bold uppercase block mt-0.5">
                        Date: {activeDocPreview.quote.createdDate}
                      </span>
                    </div>
                  </div>

                  {/* Company addresses */}
                  <div className="grid grid-cols-2 gap-6 py-6 border-b border-zinc-200">
                    <div>
                      <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider block mb-1">
                        {activeDocPreview.type === 'PI' ? 'ISSUED BY (SUPPLIER)' : 'ISSUER (BUYER)'}
                      </span>
                      <h4 className="font-black text-zinc-950">
                        {activeDocPreview.type === 'PI' ? activeDocPreview.quote.supplierName : activeDocPreview.quote.buyerName}
                      </h4>
                      <p className="text-zinc-500 leading-relaxed mt-1 text-[11px]">
                        {activeDocPreview.type === 'PI' ? activeDocPreview.quote.supplierAddress : activeDocPreview.quote.buyerAddress}
                      </p>
                      <div className="text-[10px] font-semibold text-zinc-700 mt-1.5 font-mono">
                        GSTIN: {activeDocPreview.type === 'PI' ? activeDocPreview.quote.supplierGstin : activeDocPreview.quote.buyerGstin}
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider block mb-1">
                        {activeDocPreview.type === 'PI' ? 'BILL TO (BUYER)' : 'SHIP TO (SUPPLIER)'}
                      </span>
                      <h4 className="font-black text-zinc-950">
                        {activeDocPreview.type === 'PI' ? activeDocPreview.quote.buyerName : activeDocPreview.quote.supplierName}
                      </h4>
                      <p className="text-zinc-500 leading-relaxed mt-1 text-[11px]">
                        {activeDocPreview.type === 'PI' ? activeDocPreview.quote.buyerAddress : activeDocPreview.quote.supplierAddress}
                      </p>
                      <div className="text-[10px] font-semibold text-zinc-700 mt-1.5 font-mono">
                        GSTIN: {activeDocPreview.type === 'PI' ? activeDocPreview.quote.buyerGstin : activeDocPreview.quote.supplierGstin}
                      </div>
                    </div>
                  </div>

                  {/* Itemized charges table */}
                  <div className="py-6">
                    <table className="w-full text-left text-[11.5px] border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-300 font-bold text-zinc-800">
                          <th className="pb-2">B2B Item Formulation Description</th>
                          <th className="pb-2 text-center">Batch Quantity</th>
                          <th className="pb-2 text-right">Unit Price</th>
                          <th className="pb-2 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200">
                        {activeDocPreview.quote.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-3 font-semibold text-zinc-950">{item.desc}</td>
                            <td className="py-3 text-center font-mono">{item.qty.toLocaleString()} Units</td>
                            <td className="py-3 text-right font-mono">₹{item.rate}</td>
                            <td className="py-3 text-right font-mono font-bold text-zinc-950">₹{item.total.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Calculations breakdown */}
                  <div className="border-t border-zinc-200 pt-4 flex justify-between">
                    <div className="max-w-[280px]">
                      <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider block mb-1">Commercial Settle Terms</span>
                      <p className="text-[10.5px] text-zinc-500 leading-relaxed font-semibold">
                        {activeDocPreview.quote.paymentTerms}. Handled via secure escrow milestone protection contract.
                      </p>
                      <p className="text-[10.5px] text-zinc-400 font-medium mt-1">
                        Expected Delivery: {activeDocPreview.quote.deliveryLeadTime}.
                      </p>
                    </div>

                    <div className="w-48 text-[11.5px] space-y-1.5">
                      <div className="flex justify-between text-zinc-500">
                        <span>Sourcing Subtotal:</span>
                        <span className="font-semibold text-zinc-950">₹{activeDocPreview.quote.items[0].total.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-zinc-500">
                        <span>GST Tax ({activeDocPreview.quote.igstRate}% IGST):</span>
                        <span className="font-semibold text-zinc-950">₹{activeDocPreview.quote.igstAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between border-t border-zinc-300 pt-2 font-black text-zinc-950 text-[13px]">
                        <span>Grand Total:</span>
                        <span className="text-[#b90064]">₹{activeDocPreview.quote.grandTotal.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* PDF Signatures and Seals */}
                <div className="pt-8 border-t border-zinc-200 flex justify-between items-end">
                  <div>
                    <div className="font-mono text-[9px] text-zinc-400">CRYPTOGRAPHIC DIGITAL SIGNATURE</div>
                    <div className="font-bold text-[11.5px] text-zinc-900 underline decoration-[#b90064] mt-1">
                      {activeDocPreview.type === 'PI' ? 'BeautyPro Accounts Dept' : 'Nexora Buyer Procurement'}
                    </div>
                    <div className="text-[9px] text-zinc-500">Authorized B2B Trade Signatory Seal</div>
                  </div>

                  <div className="w-14 h-14 rounded-full border border-dashed border-zinc-400 flex flex-col items-center justify-center text-[7px] text-zinc-400 font-extrabold rotate-6">
                    <span>NEXORA</span>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>TRADE LINK</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Right Column: Actions and explanation sidebar */}
            <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-[#e8e8e8] flex flex-col justify-between bg-[#fcf9f8] p-6 text-left">
              <div className="space-y-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#e6f4ea] text-emerald-800 rounded-full text-[10.5px] font-bold uppercase mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Documents compiled</span>
                  </div>
                  <h3 className="font-black text-lg text-[#1c1b1b]">
                    {activeDocPreview.type === 'PI' ? 'Proforma Invoice (PI)' : 'Purchase Order (PO)'}
                  </h3>
                  <p className="text-[12.5px] text-[#594047] font-semibold">
                    Simulated PDF Document Reader
                  </p>
                </div>

                <div className="space-y-3.5 text-[12px] text-[#594047]">
                  <p className="leading-relaxed">
                    This document was automatically generated upon B2B quote approval. It complies fully with inter-state GST billing laws and is ready to be locked into your active Escrow Milestone Contract.
                  </p>

                  <div className="bg-white p-3.5 rounded-xl border border-[#e8e8e8] space-y-1.5">
                    <div className="font-bold text-zinc-950 flex items-center gap-1.5 mb-1">
                      <LockIcon className="w-3.5 h-3.5 text-[#b90064]" />
                      Trade Locking
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Signing this {activeDocPreview.type} locks the trade rate at <strong>₹{activeDocPreview.quote.items[0].rate}/Unit</strong>. Raw material sourcing will begin automatically once the 30% advance escrow is funded.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mt-6">
                <button
                  onClick={() => {
                    showLocalToast(`Downloaded certified ${activeDocPreview.type} PDF successfully.`);
                  }}
                  className="w-full bg-[#b90064] hover:bg-[#8e004b] text-white font-bold text-[13px] py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Signed PDF</span>
                </button>

                <button
                  onClick={() => {
                    showLocalToast(`Document print request sent successfully.`);
                  }}
                  className="w-full bg-white border border-[#e8e8e8] hover:bg-[#f0edec] text-[#1c1b1b] font-bold text-[13px] py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Document</span>
                </button>

                <button
                  onClick={() => setActiveDocPreview(null)}
                  className="w-full bg-white border border-dashed border-[#e8e8e8] hover:bg-[#f0edec] text-[#594047] font-bold text-[13px] py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Close Previewer
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

// Simple inline Lock icon to prevent missing imports
const LockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
