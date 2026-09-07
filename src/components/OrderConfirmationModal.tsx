import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  PackageCheck,
  Download,
  FileText,
  ArrowRight,
  Truck,
  Building2,
  MapPin,
  Calendar,
} from 'lucide-react';
import type { PopulatedOrder } from '../db/types';
import { downloadOrderInvoice, downloadOrderInvoiceCsv, getOrderLineItems, getSellerGstin, getBuyerGstin, ORDER_STATUS_LABELS, ORDER_STATUS_STEPS, formatInr, formatDate } from '../utils/invoicePdf';

interface OrderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: PopulatedOrder | null;
  onViewOrders?: () => void;
}

/**
 * Final order confirmation + invoice surface.
 *
 * Shown immediately after the buyer accepts a quote and an order is created.
 * Provides the downloadable PDF invoice and the full order-status stepper so
 * the transition from an accepted quote into a confirmed order is seamless.
 */
export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  isOpen,
  onClose,
  order,
  onViewOrders,
}) => {
  const [downloaded, setDownloaded] = useState(false);
  if (!isOpen || !order) return null;

  const lineItems = getOrderLineItems(order);

  const handleDownload = () => {
    try {
      downloadOrderInvoice(order);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2500);
    } catch (err) {
      console.warn('Invoice download failed:', err);
    }
  };

  const handleDownloadCsv = () => {
    try {
      downloadOrderInvoiceCsv(order);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2500);
    } catch (err) {
      console.warn('Invoice CSV download failed:', err);
    }
  };

  const activeIndex = ORDER_STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-[#E8DEEF] w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-[#E8DEEF] flex items-center justify-between bg-[#FDFBF7] sticky top-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#2A0E3F]">Order Confirmed</h3>
              <p className="text-[12px] text-[#5B4A6E]">{order.order_no}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl text-[#7E6C96] hover:text-[#2A0E3F] hover:bg-[#F4F0E9] flex items-center justify-center transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Success banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-[12.5px] text-emerald-800 leading-relaxed">
              <strong>Your quote has been accepted and the purchase order is live.</strong>
              <p className="mt-1">
                Supplier <strong>{order.supplier?.company_name || 'Verified Supplier'}</strong> has been notified.
                Track production, quality checks and dispatch below.
              </p>
            </div>
          </div>

          {/* Order summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#FDFBF7] rounded-2xl border border-[#E8DEEF] p-4 space-y-2">
              <div className="flex items-center gap-2 text-[11px] font-black text-[#7E6C96] uppercase tracking-wider">
                <Building2 className="w-4 h-4 text-[#6B2D8C]" />
                Supplier
              </div>
              <p className="text-[13px] font-bold text-[#2A0E3F]">{order.supplier?.company_name || 'Verified Supplier'}</p>
              <p className="text-[11px] text-[#5B4A6E]">{order.supplier?.city || ''} {order.supplier?.state ? `, ${order.supplier.state}` : ''}</p>
            </div>
            <div className="bg-[#FDFBF7] rounded-2xl border border-[#E8DEEF] p-4 space-y-2">
              <div className="flex items-center gap-2 text-[11px] font-black text-[#7E6C96] uppercase tracking-wider">
                <MapPin className="w-4 h-4 text-[#6B2D8C]" />
                Delivery
              </div>
              <p className="text-[12px] font-bold text-[#2A0E3F]">{order.delivery_location}</p>
              <p className="text-[11px] text-[#5B4A6E]">{order.shipping_address}</p>
            </div>
          </div>

          {/* Line items (multi-line capable) */}
          <div className="rounded-2xl border border-[#E8DEEF] overflow-hidden">
            <div className="bg-[#F5EEF8] px-4 py-2.5 text-[11px] font-black text-[#6B2D8C] uppercase tracking-wider">
              Order Line {lineItems.length > 1 ? `(${lineItems.length} items)` : ''}
            </div>
            <div className="divide-y divide-[#F4F0E9]">
              {lineItems.map((item, idx) => (
                <div key={item.id || idx} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-[13px] font-bold text-[#2A0E3F]">{item.product}</p>
                    <p className="text-[11px] text-[#5B4A6E]">{idx === 0 ? formatDate(order.created_at) : ''} · Quote {order.quote_id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-bold text-[#2A0E3F]">{item.quantity} {item.quantity_unit} × {formatInr(item.unit_price, order.currency)}</p>
                    <p className="text-[11px] text-[#7E6C96]">{formatInr(item.subtotal, order.currency)} + GST {item.tax_rate}%</p>
                  </div>
                </div>
              ))}
              <div className="px-4 py-2.5 flex flex-wrap justify-between gap-2 text-[11px] text-[#5B4A6E] bg-[#FDFBF7]/60">
                <span>Advance required: <strong className="text-[#2A0E3F]">{order.advance_percent ? `${order.advance_percent}%` : 'Standard 50%'}</strong></span>
                <span>Seller GSTIN: <strong className="text-[#2A0E3F]">{getSellerGstin(order)}</strong></span>
                <span>Buyer GSTIN: <strong className="text-[#2A0E3F]">{getBuyerGstin(order)}</strong></span>
              </div>
              <div className="px-4 py-3 flex items-center justify-between bg-[#FDFBF7]">
                <span className="text-[12px] font-bold text-[#5B4A6E]">Total Payable</span>
                <span className="text-lg font-black text-[#6B2D8C]">{formatInr(order.total_amount, order.currency)}</span>
              </div>
            </div>
          </div>

          {/* Status stepper */}
          {!isCancelled ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[13px] font-black text-[#2A0E3F]">Order Status</h4>
                <span className="px-2.5 py-1 rounded-full bg-[#F5EEF8] text-[#6B2D8C] text-[10px] font-black uppercase tracking-wider">
                  {ORDER_STATUS_LABELS[order.status]}
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {ORDER_STATUS_STEPS.map((step, idx) => {
                  const reached = idx <= activeIndex;
                  const current = idx === activeIndex;
                  return (
                    <div key={step} className="flex flex-col items-center gap-1.5">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center border text-[11px] font-black ${
                        reached
                          ? 'bg-[#6B2D8C] border-[#6B2D8C] text-white'
                          : 'bg-white border-[#E8DEEF] text-[#7E6C96]'
                      } ${current ? 'ring-4 ring-[#F5EEF8]' : ''}`}>
                        {reached ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <span className="text-[9px] font-bold text-[#5B4A6E] text-center leading-tight">{ORDER_STATUS_LABELS[step]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-[12px] text-rose-700 font-bold">
              This order was cancelled.
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 border-t border-[#F4F0E9] grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={handleDownload}
              className="inline-flex items-center justify-center gap-2 bg-[#6B2D8C] hover:bg-[#4A2560] text-white text-[13px] font-black py-3 rounded-xl transition-all shadow-md cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{downloaded ? 'Invoice Downloaded' : 'Download PDF'}</span>
            </button>
            <button
              onClick={handleDownloadCsv}
              className="inline-flex items-center justify-center gap-2 bg-white border border-[#6B2D8C] hover:bg-[#FDFBF7] text-[#6B2D8C] text-[13px] font-bold py-3 rounded-xl transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Download CSV</span>
            </button>
            <button
              onClick={() => {
                onViewOrders?.();
                onClose();
              }}
              className="inline-flex items-center justify-center gap-2 bg-white border border-[#E8DEEF] hover:bg-[#FDFBF7] text-[#2A0E3F] text-[13px] font-bold py-3 rounded-xl transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-[#6B2D8C]" />
              <span>View Order Sheet</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
