import { jsPDF } from 'jspdf';
import type { PopulatedOrder } from '../db/types';

/**
 * Invoice generation utility.
 *
 * Generates a clean A4 commercial invoice and triggers a browser download so
 * the buyer/supplier can keep a PDF copy of the confirmed order. It is
 * deliberately dependency-light (jsPDF only) and data-driven from a
 * `PopulatedOrder`, so the same code path works for seed and live orders.
 */

export function formatInr(amount: number, currency = 'INR'): string {
  if (currency !== 'INR') return `${amount.toLocaleString('en-IN')} ${currency}`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function invoiceFileName(order: { invoice_no: string }): string {
  return `${order.invoice_no || 'INVOICE'}.pdf`;
}

/**
 * Build the PDF and save it locally. Returns the file name so callers can show
 * a confirmation toast.
 */
export function downloadOrderInvoice(order: PopulatedOrder): string {
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 42;
  const contentWidth = pageWidth - margin * 2;

  // Header brand band
  doc.setFillColor(107, 45, 140);
  doc.rect(0, 0, pageWidth, 74, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('NEXORA LUXE', margin, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('B2B Beauty Marketplace · GSTIN: 27AAACR1234F1Z5', margin, 58);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('TAX INVOICE', pageWidth - margin, 42, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(order.invoice_no, pageWidth - margin, 58, { align: 'right' });

  let y = 104;

  // Invoice meta
  doc.setTextColor(45, 45, 45);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Bill To / Buyer', margin, y);
  doc.text('Supplier', pageWidth - margin - 180, y);
  y += 16;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const buyerName = order.buyer_id ? 'Nexora Registered Buyer' : order.buyer_id;
  doc.text(buyerName, margin, y);
  doc.text(order.supplier?.company_name || 'Verified Supplier', pageWidth - margin - 180, y);
  y += 14;
  doc.setFontSize(9);
  doc.text(order.shipping_address || '', margin, y, { maxWidth: 170 });
  doc.text(order.delivery_location || 'India', pageWidth - margin - 180, y);
  y += 18;

  // Divider
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;

  // Order summary rows
  const rows: Array<[string, string]> = [
    ['Order No.', order.order_no],
    ['Order Date', formatDate(order.created_at)],
    ['RFQ Reference', order.rfq_id],
    ['Quote Reference', order.quote_id],
    ['Expected Delivery', formatDate(order.expected_delivery)],
    ['Payment Status', order.payment_status.replace('_', ' ')],
  ];
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  rows.forEach(([label, value]) => {
    doc.setTextColor(110, 110, 110);
    doc.text(label, margin, y);
    doc.setTextColor(45, 45, 45);
    doc.text(String(value), margin + 150, y);
    y += 14;
  });

  y += 8;

  // Line item table header
  const lineTableTop = y;
  doc.setFillColor(246, 241, 250);
  doc.rect(margin, lineTableTop, contentWidth, 22, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(107, 45, 140);
  const cols = ['Item', 'Qty', 'Unit Price', 'Tax', 'Amount'];
  const colX = [margin, margin + 300, margin + 370, margin + 430, pageWidth - margin];
  const colAligns: Array<'left' | 'right' | 'right' | 'right' | 'right'> = ['left', 'right', 'right', 'right', 'right'];
  cols.forEach((c, i) => doc.text(c, colX[i], lineTableTop + 15, { align: colAligns[i] }));
  y = lineTableTop + 34;

  // Line items
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(45, 45, 45);
  doc.text(order.product || 'Beauty supply purchase order', margin, y, { maxWidth: 240 });
  doc.text(String(order.quantity), margin + 300, y, { align: 'right' });
  doc.text(`${order.quantity_unit}`, margin + 330, y);
  doc.text(formatInr(order.unit_price, order.currency), margin + 370, y, { align: 'right' });
  doc.text(`${order.tax_rate}%`, margin + 430, y, { align: 'right' });
  doc.text(formatInr(order.subtotal, order.currency), pageWidth - margin, y, { align: 'right' });
  y += 26;

  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 22;

  // Totals
  const totals: Array<[string, string]> = [
    ['Subtotal', formatInr(order.subtotal, order.currency)],
    [`GST (${order.tax_rate}%)`, formatInr(order.tax_amount, order.currency)],
    ['Total Payable', formatInr(order.total_amount, order.currency)],
  ];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  totals.forEach(([label, value], index) => {
    if (label === 'Total Payable') {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(107, 45, 140);
    } else {
      doc.setTextColor(90, 90, 90);
    }
    doc.text(label, pageWidth - margin - 180, y);
    doc.text(value, pageWidth - margin, y, { align: 'right' });
    y += 18;
  });

  y += 16;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;

  if (order.terms) {
    doc.setTextColor(90, 90, 90);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Terms: ${order.terms}`, margin, y, { maxWidth: contentWidth });
  }

  const fileName = invoiceFileName(order);
  doc.save(fileName);
  return fileName;
}

/**
 * Returns a human-readable status label for the order lifecycle stepper.
 */
export const ORDER_STATUS_LABELS: Record<PopulatedOrder['status'], string> = {
  order_confirmed: 'Confirmed',
  in_production: 'In Production',
  quality_check: 'Quality Check',
  ready_dispatch: 'Ready Dispatch',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const ORDER_STATUS_STEPS: PopulatedOrder['status'][] = [
  'order_confirmed',
  'in_production',
  'quality_check',
  'ready_dispatch',
  'shipped',
  'delivered',
];
