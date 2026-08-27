import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Send,
  FileSpreadsheet,
  ShieldCheck,
  Sparkles,
  Clock,
  Check,
  Copy,
  ArrowRight,
  TrendingUp,
  FileCheck2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RFQItem } from '../types';

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  rfq: RFQItem | null;
}

export const QuoteModal: React.FC<QuoteModalProps> = ({ isOpen, onClose, rfq }) => {
  const [submitted, setSubmitted] = useState(false);
  const [unitPrice, setUnitPrice] = useState('');
  const [leadTime, setLeadTime] = useState('7-10 Days');
  const [paymentTerms, setPaymentTerms] = useState('50% Advance, 50% on Dispatch');
  const [samplesReady, setSamplesReady] = useState(true);
  const [supplierRemarks, setSupplierRemarks] = useState('');
  const [supplierName, setSupplierName] = useState('Aura Beauty Labs');
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedRef, setCopiedRef] = useState(false);

  if (!isOpen || !rfq) return null;

  const quoteReference = `QUO-${Math.floor(100000 + Math.random() * 900000)}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitPrice.trim()) {
      setErrorMessage('Please state your proposed unit price for this quote.');
      return;
    }
    setErrorMessage('');
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setUnitPrice('');
    setSupplierRemarks('');
    setCopiedRef(false);
    onClose();
  };

  const handleCopyRef = () => {
    navigator.clipboard.writeText(quoteReference);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="bg-white rounded-2xl border border-[#E8DEEF] w-full max-w-lg shadow-2xl overflow-hidden relative"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-[#E8DEEF] flex items-center justify-between bg-[#FDFBF7]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6B2D8C] text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#2A0E3F]">Submit Formal Quote</h3>
              <p className="text-[12px] text-[#5B4A6E]">
                Bid for buyer requirement: <strong className="text-[#2A0E3F]">{rfq.buyerLocation}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-[#7E6C96] hover:text-[#2A0E3F] hover:bg-[#F4F0E9] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with AnimatePresence */}
        <div className="p-6 relative">
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="quote-success-overlay"
                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="text-center py-4 space-y-5"
              >
                {/* Animated Pulsing Icon */}
                <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.25, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    className="absolute inset-0 bg-[#F5EEF8] rounded-full opacity-60"
                  />
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                    className="w-16 h-16 bg-[#6B2D8C] text-white rounded-full flex items-center justify-center shadow-lg relative z-10"
                  >
                    <CheckCircle2 className="w-9 h-9" />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="absolute -top-1 -right-1 bg-gold-400 text-[#2A0E3F] p-1 rounded-full shadow-xs z-20"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </motion.div>
                </div>

                {/* Main Headline */}
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F5EEF8] text-[#6B2D8C] rounded-full text-[11px] font-bold tracking-wide uppercase mb-1.5 border border-[#bfdbfe]">
                    <FileCheck2 className="w-3.5 h-3.5 text-[#6B2D8C]" />
                    <span>Commercial Bid Live</span>
                  </div>
                  <h4 className="text-xl font-bold text-[#2A0E3F]">Quote Submitted Successfully!</h4>
                  <p className="text-[13px] text-[#5B4A6E] max-w-sm mx-auto mt-1">
                    The verified buyer has received your structured quote. You will be notified in real time when they accept or start direct negotiation.
                  </p>
                </div>

                {/* Commercial Summary Card */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-[#F6F1FA] p-4 rounded-xl text-left text-[12px] space-y-2 border border-[#E8DEEF]"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-[#E8DEEF]">
                    <span className="text-[#7E6C96]">RFQ Requirement:</span>
                    <span className="font-bold text-[#2A0E3F] truncate max-w-[200px]">{rfq.title}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#7E6C96]">Your Quoted Rate:</span>
                    <span className="font-bold text-[#6B2D8C] text-[13px]">{unitPrice}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#7E6C96]">Lead Time Offered:</span>
                    <span className="font-semibold text-[#2A0E3F]">{leadTime}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#7E6C96]">Payment Terms:</span>
                    <span className="font-medium text-[#2A0E3F]">{paymentTerms}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-[#E8DEEF] text-[11px]">
                    <span className="text-[#7E6C96]">Quote ID Reference:</span>
                    <button
                      onClick={handleCopyRef}
                      className="font-mono text-[#6B2D8C] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>{quoteReference}</span>
                      {copiedRef ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-[#7E6C96]" />
                      )}
                    </button>
                  </div>
                </motion.div>

                {/* Workflow Progression Stepper */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="bg-[#FDFBF7] p-3 rounded-xl border border-[#E8DEEF] text-[11.5px] text-left"
                >
                  <div className="flex items-center gap-2 text-[#2A0E3F] font-semibold mb-1">
                    <Clock className="w-3.5 h-3.5 text-[#6B2D8C]" />
                    <span>Buyer Response SLA</span>
                  </div>
                  <p className="text-[#5B4A6E]">
                    Buyers compare bids on the <strong>Quote Comparison Dashboard</strong>. Once selected, a direct encrypted chat window will open automatically.
                  </p>
                </motion.div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleReset}
                    className="w-full bg-[#6B2D8C] hover:bg-[#003da8] text-white font-bold text-[13px] py-2.5 rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Done &amp; Close</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="quote-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {/* RFQ Target Box */}
                <div className="bg-[#F6F1FA] p-3 rounded-xl border border-[#E8DEEF] text-[12px] space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#2A0E3F]">{rfq.title}</span>
                    <span className="text-[#6B2D8C] font-semibold">{rfq.quantityRequired}</span>
                  </div>
                  <p className="text-[#5B4A6E] text-[11px] line-clamp-2">{rfq.description}</p>
                </div>

                {errorMessage && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-[12px] rounded-lg">
                    {errorMessage}
                  </div>
                )}

                {/* Price & Lead Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-bold text-[#2A0E3F] mb-1">
                      Offered Unit Price <span className="text-[#6B2D8C]">*</span>
                    </label>
                    <input
                      type="text"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      placeholder="e.g. ₹920 / L or ₹38 / Jar"
                      className="w-full bg-[#F6F1FA] border border-[#E8DEEF] focus:border-[#C9A961] rounded-lg px-3 py-2 text-[13px] text-[#2A0E3F] focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-[#2A0E3F] mb-1">
                      Delivery Lead Time
                    </label>
                    <select
                      value={leadTime}
                      onChange={(e) => setLeadTime(e.target.value)}
                      className="w-full bg-[#F6F1FA] border border-[#E8DEEF] focus:border-[#C9A961] rounded-lg px-3 py-2 text-[13px] text-[#2A0E3F] focus:outline-none cursor-pointer"
                    >
                      <option value="Ready Stock (1-3 Days)">Ready Stock (1-3 Days)</option>
                      <option value="7-10 Days">7 — 10 Days</option>
                      <option value="14-21 Days">14 — 21 Days (Custom Run)</option>
                      <option value="30 Days">30 Days (Full Batch)</option>
                    </select>
                  </div>
                </div>

                {/* Payment Terms */}
                <div>
                  <label className="block text-[12px] font-bold text-[#2A0E3F] mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full bg-[#F6F1FA] border border-[#E8DEEF] focus:border-[#C9A961] rounded-lg px-3 py-2 text-[13px] text-[#2A0E3F] focus:outline-none cursor-pointer"
                  >
                    <option value="50% Advance, 50% on Dispatch">50% Advance, 50% on Dispatch</option>
                    <option value="100% Advance before Production">100% Advance before Production</option>
                    <option value="30 Days Credit (Verified Buyer)">30 Days Credit (Verified Buyer)</option>
                    <option value="Letter of Credit / Bank Escrow">Letter of Credit / Bank Escrow</option>
                  </select>
                </div>

                {/* Samples Ready Checkbox */}
                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-[12px] font-medium text-[#2A0E3F]">
                    <input
                      type="checkbox"
                      checked={samplesReady}
                      onChange={(e) => setSamplesReady(e.target.checked)}
                      className="accent-[#6B2D8C] w-4 h-4 rounded cursor-pointer"
                    />
                    <span>Lab / Packaging Samples are ready for immediate dispatch</span>
                  </label>
                </div>

                {/* Remarks / Formulation specs */}
                <div>
                  <label className="block text-[12px] font-bold text-[#2A0E3F] mb-1">
                    Supplier Remarks / Specs
                  </label>
                  <textarea
                    rows={2}
                    value={supplierRemarks}
                    onChange={(e) => setSupplierRemarks(e.target.value)}
                    placeholder="State COA certificates included, batch testing guarantees, or custom scent customization..."
                    className="w-full bg-[#F6F1FA] border border-[#E8DEEF] focus:border-[#C9A961] rounded-lg p-3 text-[13px] text-[#2A0E3F] focus:outline-none resize-none"
                  />
                </div>

                {/* Form Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-[12px] font-semibold text-[#5B4A6E] hover:bg-[#F6F1FA] rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="bg-[#6B2D8C] hover:bg-[#4A2560] text-white font-bold text-[12px] px-5 py-2.5 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Quote</span>
                  </motion.button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

