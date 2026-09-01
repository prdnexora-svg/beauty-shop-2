import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check, ChevronLeft, ChevronRight, UploadCloud, X, ImagePlus, Trash2,
  Package, Tag, Info, Sparkles, CheckCircle2, ListPlus, Eye, Save,
  ArrowRight, Plus, Layers, Camera
} from 'lucide-react';
import { CATEGORIES_DATA, getSubcategoriesForCategoryName } from '../data/categories';

export interface ProductAttribute {
  label: string;
  value: string;
}

export interface CatalogProduct {
  id: string;
  name: string;
  price: string;
  mrp?: string;
  category: string;
  subcategory?: string;
  brand?: string;
  description?: string;
  stockQty: number;
  unit: string;
  taxRate: string;
  sku?: string;
  tags: string[];
  attributes: ProductAttribute[];
  images: string[];
  videoUrl?: string;
  status: 'Active' | 'Draft';
}

interface ProductCreationWizardProps {
  onPublish: (product: CatalogProduct) => void;
  onSaveDraft: (product: CatalogProduct) => void;
  onViewProductList: () => void;
  /** When set, the wizard prefills and updates this listing instead of creating a new one. */
  editingProduct?: CatalogProduct | null;
  onCancelEdit?: () => void;
}

const UNITS = ['Pcs', 'Kg', 'Pack', 'Carton', 'Liter', 'Dozen', 'Gram', 'ml'];
const TAX_RATES = ['0%', '5%', '12%', '18%', '28%'];
const STEPS = ['Basic Info', 'Pricing & Stock', 'Images & Media', 'Optional Specs'];

const EMPTY_FORM = {
  name: '',
  category: '',
  subcategory: '',
  brand: '',
  description: '',
  price: '',
  mrp: '',
  stockQty: 1,
  unit: 'Pcs',
  taxRate: '18%',
  sku: '',
  tags: '',
  attributes: [{ label: 'Size', value: '' }, { label: 'Color', value: '' }] as ProductAttribute[],
  images: [] as string[],
  videoUrl: '',
};

type FormState = typeof EMPTY_FORM;
type Errors = Partial<Record<'name' | 'category' | 'price', string>>;

const inputBase =
  'w-full bg-[#FDFBF7] border rounded-xl px-3.5 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-colors';

export const ProductCreationWizard: React.FC<ProductCreationWizardProps> = ({
  onPublish,
  onSaveDraft,
  onViewProductList,
  editingProduct = null,
  onCancelEdit,
}) => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [success, setSuccess] = useState<'publish' | 'draft' | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit mode: prefill the wizard with the listing being edited
  useEffect(() => {
    if (!editingProduct) return;
    setForm({
      name: editingProduct.name,
      category: editingProduct.category,
      subcategory: editingProduct.subcategory || '',
      brand: editingProduct.brand || '',
      description: editingProduct.description || '',
      price: editingProduct.price,
      mrp: editingProduct.mrp || '',
      stockQty: editingProduct.stockQty,
      unit: editingProduct.unit,
      taxRate: editingProduct.taxRate,
      sku: editingProduct.sku || '',
      tags: editingProduct.tags.join(', '),
      attributes: editingProduct.attributes.length > 0
        ? editingProduct.attributes
        : [{ label: 'Size', value: '' }, { label: 'Color', value: '' }],
      images: editingProduct.images,
      videoUrl: editingProduct.videoUrl || '',
    });
    setErrors({});
    setTouched({});
    setSuccess(null);
    setStep(0);
  }, [editingProduct?.id]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === 'name' || key === 'category' || key === 'price') {
      validateField(key, value as string);
    }
  };

  const validateField = (key: 'name' | 'category' | 'price', value: string) => {
    setTouched((t) => ({ ...t, [key]: true }));
    let message = '';
    if (key === 'name' && !value.trim()) message = 'Please enter the product name.';
    if (key === 'category' && !value.trim()) message = 'Please select a category.';
    if (key === 'price' && !value.trim()) message = 'Please enter the selling price.';
    setErrors((prev) => ({ ...prev, [key]: message }));
    return !message;
  };

  const requiredValid = useMemo(
    () => !errors.name && !errors.category && !errors.price,
    [errors]
  );

  const requiredCompleted = useMemo(
    () =>
      (form.name.trim() ? 1 : 0) +
      (form.category.trim() ? 1 : 0) +
      (form.price.trim() ? 1 : 0),
    [form.name, form.category, form.price]
  );

  const stepValid = (s: number) => {
    if (s === 0) {
      return validateField('name', form.name) && validateField('category', form.category);
    }
    if (s === 1) {
      return validateField('price', form.price);
    }
    return true;
  };

  const handleNext = () => {
    if (!stepValid(step)) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleCategoryChange = (name: string) => {
    update('category', name);
    const subs = getSubcategoriesForCategoryName(name);
    update('subcategory', subs[0] || '');
  };

  const handleImages = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        setForm((prev) => ({
          ...prev,
          images: [...prev.images, reader.result as string].slice(0, 6),
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({ images: prev.images.filter((_, i) => i !== index) }));
  };

  const buildProduct = (status: 'Active' | 'Draft'): CatalogProduct => ({
    id: editingProduct ? editingProduct.id : `sp-${Date.now()}`,
    name: form.name.trim(),
    price: form.price.trim(),
    mrp: form.mrp.trim() || undefined,
    category: form.category,
    subcategory: form.subcategory || undefined,
    brand: form.brand.trim() || undefined,
    description: form.description.trim() || undefined,
    stockQty: form.stockQty || 1,
    unit: form.unit,
    taxRate: form.taxRate,
    sku: form.sku.trim() || undefined,
    tags: form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    attributes: form.attributes.filter((a) => a.value.trim()),
    images: form.images,
    videoUrl: form.videoUrl.trim() || undefined,
    status,
  });

  const handlePublish = () => {
    if (!validateField('name', form.name)) return setStep(0);
    if (!validateField('category', form.category)) return setStep(0);
    if (!validateField('price', form.price)) return setStep(1);
    onPublish(buildProduct('Active'));
    setSuccess('publish');
  };

  const handleDraft = () => {
    if (!form.name.trim()) {
      validateField('name', form.name);
      setStep(0);
      return;
    }
    onSaveDraft(buildProduct('Draft'));
    setSuccess('draft');
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setTouched({});
    setStep(0);
    setSuccess(null);
  };

  const fieldError = (key: 'name' | 'category' | 'price') =>
    touched[key] ? errors[key] : undefined;

  const label = (text: string, optional = false) => (
    <span className="block font-bold text-[#5B4A6E] uppercase tracking-wider mb-1.5 text-[11px]">
      {text}
      {optional && <span className="text-zinc-400 font-semibold normal-case ml-1">(Optional)</span>}
    </span>
  );

  const errorText = (msg?: string) =>
    msg ? (
      <p className="text-[11px] text-red-600 font-semibold mt-1.5 flex items-center gap-1">
        <Info className="w-3.5 h-3.5" /> {msg}
      </p>
    ) : null;

  return (
    <div className="bg-white border border-[#E8DEEF] rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 pt-6 pb-5 border-b border-[#E8DEEF] bg-gradient-to-r from-[#FDFBF7] to-[#F5EEF8]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-black text-base text-zinc-950 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#6B2D8C]" />
              {editingProduct ? `Edit Product — ${editingProduct.name}` : 'Add New Product'}
            </h3>
            <p className="text-xs text-[#5B4A6E] mt-1">
              {editingProduct
                ? 'Update any field, then re-publish or save as draft.'
                : "Just 3 required fields — fill the rest whenever you're ready."}
            </p>
            {editingProduct && onCancelEdit && (
              <button
                type="button"
                onClick={() => { onCancelEdit(); setForm(EMPTY_FORM); setErrors({}); setTouched({}); setStep(0); }}
                className="mt-1.5 text-[11px] font-bold text-[#6B2D8C] hover:underline"
              >
                Cancel editing — switch back to Add New Product
              </button>
            )}
          </div>
          <div className="shrink-0 text-right">
            <div className="flex items-center gap-2 justify-end">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i < requiredCompleted ? 'bg-emerald-500' : 'bg-zinc-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[11px] font-bold text-[#5B4A6E]">
                {requiredCompleted}/3 required
              </span>
            </div>
          </div>
        </div>

        {/* Step progress indicator */}
        <div className="mt-5 flex items-center">
          {STEPS.map((labelText, i) => {
            const isActive = i === step;
            const isDone = i < step;
            return (
              <React.Fragment key={labelText}>
                <button
                  onClick={() => i < step && setStep(i)}
                  className={`flex items-center gap-2 group ${i <= step ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all shrink-0 ${
                      isDone
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : isActive
                        ? 'bg-[#6B2D8C] border-[#6B2D8C] text-white'
                        : 'bg-white border-zinc-200 text-zinc-400'
                    }`}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </span>
                  <span
                    className={`hidden sm:block text-[11px] font-bold whitespace-nowrap ${
                      isActive ? 'text-[#6B2D8C]' : isDone ? 'text-emerald-700' : 'text-zinc-400'
                    }`}
                  >
                    {labelText}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 rounded-full ${
                      i < step ? 'bg-emerald-500' : 'bg-zinc-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        {/* STEP 1 — Basic Info */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              {label('Product Title')}
              <input
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                onBlur={() => validateField('name', form.name)}
                placeholder="e.g. Ceramide Eye Gel Base"
                className={`${inputBase} ${
                  fieldError('name') ? 'border-red-300 focus:border-red-400' : 'border-[#E8DEEF] focus:border-[#C9A961]'
                }`}
              />
              {errorText(fieldError('name'))}
              <p className="text-[11px] text-zinc-400 mt-1">This is how buyers will find your product.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                {label('Category')}
                <select
                  value={form.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  onBlur={() => validateField('category', form.category)}
                  className={`${inputBase} cursor-pointer ${
                    fieldError('category') ? 'border-red-300 focus:border-red-400' : 'border-[#E8DEEF] focus:border-[#C9A961]'
                  } ${!form.category ? 'text-zinc-400' : ''}`}
                >
                  <option value="" disabled>
                    Select a category…
                  </option>
                  {CATEGORIES_DATA.map((catNode) => (
                    <option key={catNode.id} value={catNode.name}>
                      {catNode.name}
                    </option>
                  ))}
                </select>
                {errorText(fieldError('category'))}
              </div>

              <div>
                {label('Subcategory', true)}
                <select
                  value={form.subcategory}
                  onChange={(e) => update('subcategory', e.target.value)}
                  disabled={!form.category}
                  className={`${inputBase} cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-[#E8DEEF] focus:border-[#C9A961]`}
                >
                  {(getSubcategoriesForCategoryName(form.category) || ['Select category first']).map(
                    (sName) => (
                      <option key={sName} value={sName}>
                        {sName}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div>
              {label('Brand', true)}
              <input
                type="text"
                value={form.brand}
                onChange={(e) => update('brand', e.target.value)}
                placeholder="e.g. Aura Beauty Labs"
                className={`${inputBase} border-[#E8DEEF] focus:border-[#C9A961]`}
              />
            </div>

            <div>
              {label('Brief Description', true)}
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                rows={3}
                placeholder="A short, compelling summary of the product…"
                className={`${inputBase} border-[#E8DEEF] focus:border-[#C9A961] resize-none`}
              />
            </div>
          </div>
        )}

        {/* STEP 2 — Pricing & Stock */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                {label('Selling Price (INR)')}
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#6B2D8C]">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(e) => update('price', e.target.value)}
                    onBlur={() => validateField('price', form.price)}
                    placeholder="0.00"
                    className={`${inputBase} pl-8 ${
                      fieldError('price') ? 'border-red-300 focus:border-red-400' : 'border-[#E8DEEF] focus:border-[#C9A961]'
                    }`}
                  />
                </div>
                {errorText(fieldError('price'))}
                <p className="text-[11px] text-zinc-400 mt-1">Per unit price buyers will see.</p>
              </div>

              <div>
                {label('MRP / Original Price (INR)', true)}
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={form.mrp}
                    onChange={(e) => update('mrp', e.target.value)}
                    placeholder="0.00"
                    className={`${inputBase} pl-8 border-[#E8DEEF] focus:border-[#C9A961]`}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <div>
                {label('Stock Quantity', true)}
                <input
                  type="number"
                  min="1"
                  value={form.stockQty}
                  onChange={(e) => update('stockQty', Number(e.target.value) || 1)}
                  className={`${inputBase} border-[#E8DEEF] focus:border-[#C9A961]`}
                />
              </div>

              <div>
                {label('Unit', true)}
                <select
                  value={form.unit}
                  onChange={(e) => update('unit', e.target.value)}
                  className={`${inputBase} cursor-pointer border-[#E8DEEF] focus:border-[#C9A961]`}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                {label('Tax Rate', true)}
                <select
                  value={form.taxRate}
                  onChange={(e) => update('taxRate', e.target.value)}
                  className={`${inputBase} cursor-pointer border-[#E8DEEF] focus:border-[#C9A961]`}
                >
                  {TAX_RATES.map((t) => (
                    <option key={t} value={t}>
                      {t} GST
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-zinc-400 mt-1">Default 18% applied.</p>
              </div>

              <div className="flex items-end">
                <div className="w-full bg-[#F5EEF8] border border-[#E8DEEF] rounded-xl px-3.5 py-3 text-center">
                  <span className="text-[10px] text-[#7E6C96] uppercase font-bold block">MoQ</span>
                  <span className="text-sm font-black text-[#6B2D8C]">1 {form.unit}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 — Images & Media */}
        {step === 2 && (
          <div className="space-y-5">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleImages(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                dragOver
                  ? 'border-[#6B2D8C] bg-[#F5EEF8]'
                  : 'border-[#D9C3E8] hover:bg-neutral-50'
              }`}
            >
              <UploadCloud className="w-10 h-10 text-[#6B2D8C] mx-auto mb-3" />
              <p className="text-sm font-bold text-zinc-900">
                Drag &amp; drop product images here
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                or <span className="text-[#6B2D8C] font-bold underline">browse files</span> — JPG, PNG or WEBP (up to 6)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleImages(e.target.files)}
              />
            </div>

            {form.images.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {form.images.map((img, i) => (
                  <div
                    key={i}
                    className="relative group aspect-square rounded-xl overflow-hidden border border-[#E8DEEF] bg-zinc-50"
                  >
                    <img src={img} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                    {i === 0 && (
                      <span className="absolute top-1.5 left-1.5 bg-[#6B2D8C] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <ImagePlus className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                <p className="text-xs text-zinc-400">
                  No images yet — this step is optional, but products with photos get{' '}
                  <span className="font-bold text-[#6B2D8C]">3× more enquiries</span>.
                </p>
              </div>
            )}

            <div>
              {label('Product Video URL', true)}
              <input
                value={form.videoUrl}
                onChange={(e) => update('videoUrl', e.target.value)}
                placeholder="e.g. https://youtube.com/watch?v=... (demo, walkthrough or facility video)"
                className={`${inputBase} border-[#E8DEEF] focus:border-[#C9A961]`}
                type="url"
                inputMode="url"
              />
              <p className="text-[11px] text-zinc-400 mt-1.5">
                Optional — a YouTube/Instagram product video shows on your listing and boosts buyer trust.
              </p>
            </div>
          </div>
        )}

        {/* STEP 4 — Optional Specs */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="bg-[#F5EEF8] border border-[#E8DEEF] rounded-xl p-3.5 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-[#6B2D8C] shrink-0 mt-0.5" />
              <p className="text-xs text-[#5B4A6E]">
                Everything on this page is <b>optional</b> — you can publish right now or add specs later.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                {label('SKU', true)}
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => update('sku', e.target.value)}
                  placeholder="e.g. SKU-AURA-001"
                  className={`${inputBase} border-[#E8DEEF] focus:border-[#C9A961] font-mono`}
                />
              </div>
              <div>
                {label('Tags', true)}
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => update('tags', e.target.value)}
                  placeholder="e.g. serum, anti-aging, organic"
                  className={`${inputBase} border-[#E8DEEF] focus:border-[#C9A961]`}
                />
                <p className="text-[11px] text-zinc-400 mt-1">Separate tags with commas.</p>
              </div>
            </div>

            <div>
              {label('Attributes (Size / Color)', true)}
              <div className="space-y-3">
                {form.attributes.map((attr, i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <input
                      type="text"
                      value={attr.label}
                      onChange={(e) => {
                        const next = [...form.attributes];
                        next[i] = { ...next[i], label: e.target.value };
                        update('attributes', next);
                      }}
                      placeholder="Attribute"
                      className={`${inputBase} !w-28 shrink-0 border-[#E8DEEF] focus:border-[#C9A961] font-bold text-[#5B4A6E]`}
                    />
                    <input
                      type="text"
                      value={attr.value}
                      onChange={(e) => {
                        const next = [...form.attributes];
                        next[i] = { ...next[i], value: e.target.value };
                        update('attributes', next);
                      }}
                      placeholder="Value (e.g. 50ml, Rose Gold)"
                      className={`${inputBase} border-[#E8DEEF] focus:border-[#C9A961]`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        update('attributes', form.attributes.filter((_, idx) => idx !== i))
                      }
                      className="text-zinc-300 hover:text-red-500 transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    update('attributes', [...form.attributes, { label: '', value: '' }])
                  }
                  className="text-xs font-bold text-[#6B2D8C] flex items-center gap-1.5 hover:text-[#4A2560]"
                >
                  <Plus className="w-3.5 h-3.5" /> Add attribute
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="mt-7 pt-5 border-t border-[#E8DEEF] flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl border border-[#E8DEEF] text-zinc-700 font-bold text-sm hover:bg-neutral-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDraft}
              className="flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl border border-[#E8DEEF] text-zinc-700 font-bold text-sm hover:bg-neutral-50 transition-colors"
            >
              <Save className="w-4 h-4" /> Save as Draft
            </button>
          )}

          <div className="flex-1" />

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center justify-center gap-1.5 px-6 py-3 rounded-xl bg-[#6B2D8C] text-white font-extrabold text-sm hover:bg-[#4A2560] transition-colors shadow-sm"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleDraft}
                className="flex items-center justify-center gap-1.5 px-6 py-3 rounded-xl border border-[#E8DEEF] text-zinc-700 font-bold text-sm hover:bg-neutral-50 transition-colors"
              >
                <Save className="w-4 h-4" /> Save as Draft
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={!requiredValid}
                className={`flex items-center justify-center gap-1.5 px-6 py-3 rounded-xl text-white font-extrabold text-sm transition-all shadow-sm ${
                  requiredValid
                    ? 'bg-[#6B2D8C] hover:bg-[#4A2560]'
                    : 'bg-zinc-300 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" /> Save &amp; Publish
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Success modal */}
      {success && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8DEEF] rounded-2xl w-full max-w-sm p-7 text-center shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
              <Check className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="font-black text-lg text-zinc-950 mt-4">
              {success === 'publish' ? 'Product Published! 🎉' : 'Draft Saved!'}
            </h3>
            <p className="text-sm text-[#5B4A6E] mt-1.5">
              {success === 'publish'
                ? `“${form.name || 'Your product'}” is now live in your catalog and visible to buyers.`
                : `“${form.name || 'Your product'}” was saved as a draft — publish it anytime.`}
            </p>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={resetForm}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#6B2D8C] text-white font-extrabold text-sm hover:bg-[#4A2560] transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Another Product
              </button>
              <button
                type="button"
                onClick={() => {
                  setSuccess(null);
                  resetForm();
                  onViewProductList();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-[#E8DEEF] text-zinc-700 font-bold text-sm hover:bg-neutral-50 transition-colors"
              >
                <ListPlus className="w-4 h-4" /> View Product List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
