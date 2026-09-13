import React, { useMemo, useState } from 'react';
import { Building2, Check, Phone, Save, Store, Target } from 'lucide-react';
import { db } from '../db/database';
import type { DBProfileSupplier, SupplierBusinessType } from '../db/types';

export const BEAUTY_INDUSTRY_SEGMENTS = [
  'Hair Salon',
  'Barber Shop',
  'Unisex Salon',
  'Beauty Parlour',
  'Nail Studio',
  'Hair Spa',
  'Facial & Aesthetic Clinic',
  'Makeup Studio',
  'Bridal Makeup',
  'Massage Centre',
  'Tattoo Studio',
  'Skincare Products',
  'Haircare Products',
  'Color Cosmetics',
  'Salon & Spa Equipment',
  'OEM / Private Label',
  'Beauty Packaging',
] as const;

const BUSINESS_TYPES: SupplierBusinessType[] = [
  'Manufacturer', 'Wholesaler', 'OEM', 'Private Label', 'Distributor', 'Contract Manufacturer'
];

interface SellerBusinessProfileProps {
  supplier: DBProfileSupplier;
  onSaved: (supplier: DBProfileSupplier) => void;
}

export const SellerBusinessProfile: React.FC<SellerBusinessProfileProps> = ({ supplier, onSaved }) => {
  const [form, setForm] = useState(() => ({
    companyName: supplier.company_name,
    businessType: supplier.business_type,
    phone: supplier.phone,
    whatsapp: supplier.whatsapp,
    city: supplier.city,
    state: supplier.state,
    address: supplier.address,
    about: supplier.about || '',
    serviceAreas: supplier.service_areas.join(', '),
    segments: supplier.categories,
  }));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const completion = useMemo(() => {
    const checks = [form.companyName, form.businessType, form.phone, form.city, form.state, form.address, form.about, form.serviceAreas, form.segments.length];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [form]);

  const toggleSegment = (segment: string) => {
    setForm((current) => ({
      ...current,
      segments: current.segments.includes(segment)
        ? current.segments.filter((item) => item !== segment)
        : [...current.segments, segment],
    }));
    setSaved(false);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.companyName.trim() || !form.city.trim() || !form.state.trim() || form.segments.length === 0) {
      setError('Company name, city, state and at least one beauty segment are required.');
      return;
    }
    const updated = db.upsertSupplierProfile({
      ...supplier,
      user_id: supplier.user_id,
      company_name: form.companyName.trim(),
      business_type: form.businessType,
      phone: form.phone.trim(),
      whatsapp: form.whatsapp.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      address: form.address.trim(),
      about: form.about.trim(),
      service_areas: form.serviceAreas.split(',').map((item) => item.trim()).filter(Boolean),
      categories: form.segments,
      category: form.segments[0],
      profile_completion_pct: completion,
    });
    setError('');
    setSaved(true);
    onSaved(updated);
  };

  const inputClass = 'w-full rounded-xl border border-[#E8DEEF] bg-[#FDFBF7] px-3.5 py-3 text-sm text-zinc-900 outline-none focus:border-[#6B2D8C]';
  const labelClass = 'mb-1.5 block text-[11px] font-black uppercase tracking-wider text-[#5B4A6E]';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-[#E8DEEF] bg-white p-5 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-black text-zinc-950"><Store className="h-5 w-5 text-[#6B2D8C]" /> Business Profile</h3>
            <p className="mt-1 text-xs text-[#5B4A6E]">This information appears on your public supplier profile and helps relevant beauty buyers find you.</p>
          </div>
          <div className="min-w-44">
            <div className="mb-1.5 flex justify-between text-[11px] font-bold"><span>Profile completion</span><span>{completion}%</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-[#EEE7F2]"><div className="h-full rounded-full bg-[#6B2D8C] transition-all" style={{ width: `${completion}%` }} /></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="space-y-4 rounded-2xl border border-[#E8DEEF] bg-white p-5">
          <h4 className="flex items-center gap-2 text-sm font-black text-zinc-950"><Building2 className="h-4 w-4 text-[#6B2D8C]" /> Business details</h4>
          <div><label className={labelClass}>Company / Brand Name *</label><input className={inputClass} value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></div>
          <div><label className={labelClass}>Business Type</label><select className={inputClass} value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value as SupplierBusinessType })}>{BUSINESS_TYPES.map((type) => <option key={type}>{type}</option>)}</select></div>
          <div><label className={labelClass}>About your business</label><textarea rows={4} className={inputClass} placeholder="What you manufacture or supply, your experience and capacity" value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} /></div>
        </section>

        <section className="space-y-4 rounded-2xl border border-[#E8DEEF] bg-white p-5">
          <h4 className="flex items-center gap-2 text-sm font-black text-zinc-950"><Phone className="h-4 w-4 text-[#6B2D8C]" /> Contact & service area</h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><div><label className={labelClass}>Phone</label><input className={inputClass} inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div><div><label className={labelClass}>WhatsApp</label><input className={inputClass} inputMode="tel" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></div></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><div><label className={labelClass}>City *</label><input className={inputClass} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div><div><label className={labelClass}>State *</label><input className={inputClass} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div></div>
          <div><label className={labelClass}>Business Address</label><input className={inputClass} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div><label className={labelClass}>Service Areas</label><input className={inputClass} placeholder="Pan India, Delhi NCR, Mumbai" value={form.serviceAreas} onChange={(e) => setForm({ ...form, serviceAreas: e.target.value })} /><p className="mt-1 text-[10px] text-[#7E6C96]">Separate multiple areas with commas.</p></div>
        </section>
      </div>

      <section className="rounded-2xl border border-[#E8DEEF] bg-white p-5">
        <h4 className="flex items-center gap-2 text-sm font-black text-zinc-950"><Target className="h-4 w-4 text-[#6B2D8C]" /> Beauty industry segments *</h4>
        <p className="mt-1 text-xs text-[#5B4A6E]">Select everything your business serves. These choices improve buyer and RFQ matching.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {BEAUTY_INDUSTRY_SEGMENTS.map((segment) => {
            const selected = form.segments.includes(segment);
            return <button key={segment} type="button" aria-pressed={selected} onClick={() => toggleSegment(segment)} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold transition-colors ${selected ? 'border-[#6B2D8C] bg-[#F5EEF8] text-[#6B2D8C]' : 'border-[#E8DEEF] bg-white text-[#5B4A6E] hover:border-[#C9A961]'}`}>{selected && <Check className="h-3.5 w-3.5" />}{segment}</button>;
          })}
        </div>
      </section>

      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">{error}</p>}
      <div className="flex flex-wrap items-center justify-end gap-3">
        {saved && <span role="status" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700"><Check className="h-4 w-4" /> Profile saved</span>}
        <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-[#6B2D8C] px-5 py-3 text-xs font-black text-white transition-colors hover:bg-[#4A2560]"><Save className="h-4 w-4" /> Save Business Profile</button>
      </div>
    </form>
  );
};
