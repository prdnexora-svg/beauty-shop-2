import { jsPDF } from 'jspdf';
import type { DBOrderLineItem, PopulatedOrder } from '../db/types';

/**
 * Invoice generation utility.
 *
 * Generates a clean A4 commercial invoice and triggers a browser download so
 * the buyer/supplier can keep a PDF copy of the confirmed order. It is
 * deliberately dependency-light (jsPDF only) and data-driven from a
 * `PopulatedOrder`, so the same code path works for seed and live orders.
 *
 * Supports:
 *   - multi-line item breakdowns
 *   - configurable seller / buyer GSTIN
 *   - sequential order + invoice references
 *   - CSV export as a lightweight tabular fallback
 *
 * All exports are offline; no network call is made.
 */

export const DEFAULT_SELLER_GSTIN = '27ACBFA1234F1Z8';

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

export function getSellerGstin(order: PopulatedOrder): string {
  return order.seller_gstin || DEFAULT_SELLER_GSTIN;
}

export function getBuyerGstin(order: PopulatedOrder): string {
  return order.buyer_gstin || order.buyer?.gst_number || 'Not provided';
}

export function getOrderLineItems(order: PopulatedOrder): DBOrderLineItem[] {
  if (order.line_items && order.line_items.length > 0) return order.line_items;
  return [
    {
      id: `line-${order.id}`,
      product: order.product,
      quantity: order.quantity,
      quantity_unit: order.quantity_unit,
      unit_price: order.unit_price,
      tax_rate: order.tax_rate,
      subtotal: order.subtotal,
      tax_amount: order.tax_amount,
      total_amount: order.total_amount,
      notes: order.notes,
    },
  ];
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
  const lineItems = getOrderLineItems(order);

  // Header brand band
  doc.setFillColor(107, 45, 140);
  doc.rect(0, 0, pageWidth, 74, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('NEXORA LUXE', margin, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`B2B Beauty Marketplace · GSTIN: ${getSellerGstin(order)}`, margin, 58);

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
  const buyerName = order.buyer?.company_name || order.buyer?.contact_name || 'Nexora Registered Buyer';
  const buyerTax = getBuyerGstin(order);
  doc.text(buyerName, margin, y);
  doc.text(order.supplier?.company_name || 'Verified Supplier', pageWidth - margin - 180, y);
  y += 14;
  doc.setFontSize(9);
  doc.text(order.shipping_address || '', margin, y, { maxWidth: 170 });
  doc.text(order.delivery_location || 'India', pageWidth - margin - 180, y);
  y += 14;
  doc.text(`GSTIN: ${buyerTax}`, margin, y);
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
    ['Advance', order.advance_percent ? `${order.advance_percent}%` : 'Not set'],
    ['Reorder', order.is_reorder ? `Yes (from ${order.source_order_id || order.invoice_no})` : 'No'],
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
  lineItems.forEach((item) => {
    if (y > 720) {
      doc.addPage();
      y = 52;
      doc.setTextColor(45, 45, 45);
      doc.setFontSize(10);
    }
    doc.text(item.product || 'Beauty supply line item', margin, y, { maxWidth: 240 });
    doc.text(String(item.quantity), margin + 300, y, { align: 'right' });
    doc.text(item.quantity_unit, margin + 330, y);
    doc.text(formatInr(item.unit_price, order.currency), margin + 370, y, { align: 'right' });
    doc.text(`${item.tax_rate}%`, margin + 430, y, { align: 'right' });
    doc.text(formatInr(item.subtotal, order.currency), pageWidth - margin, y, { align: 'right' });
    y += 26;
  });

  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 22;

  // Totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.subtotal, 0);
  const taxTotal = lineItems.reduce((sum, item) => sum + item.tax_amount, 0);
  const totals: Array<[string, string]> = [
    ['Subtotal', formatInr(subtotal, order.currency)],
    [`GST (${order.tax_rate}%)`, formatInr(taxTotal, order.currency)],
    ['Total Payable', formatInr(order.total_amount || subtotal + taxTotal, order.currency)],
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
 * Export an order as a tabular CSV file. Useful for accounting imports and
 * buyer/supplier external workflows while remaining fully offline.
 */
export function downloadOrderInvoiceCsv(order: PopulatedOrder): string {
  const lineItems = getOrderLineItems(order);
  const rows: Array<Array<string | number>> = [
    ['Order No.', order.order_no],
    ['Invoice No.', order.invoice_no],
    ['Order Date', formatDate(order.created_at)],
    ['Expected Delivery', formatDate(order.expected_delivery)],
    ['Buyer', order.buyer?.company_name || order.buyer_id],
    ['Buyer GSTIN', getBuyerGstin(order)],
    ['Supplier', order.supplier?.company_name || order.supplier_id],
    ['Seller GSTIN', getSellerGstin(order)],
    ['Payment Status', order.payment_status],
    ['Advance %', order.advance_percent || ''],
    [],
    ['Product', 'Qty', 'Unit', 'Unit Price', 'Tax %', 'Subtotal', 'Tax Amount', 'Total'],
    ...lineItems.map((item) => [
      item.product,
      item.quantity,
      item.quantity_unit,
      item.unit_price,
      item.tax_rate,
      item.subtotal,
      item.tax_amount,
      item.total_amount,
    ]),
  ];

  const csv = rows
    .map((row) => row.map((cell) => {
      const value = String(cell ?? '');
      return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
    }).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${order.invoice_no || 'INVOICE'}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return link.download;
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
