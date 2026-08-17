import React, { useState } from 'react';
import { Search, MapPin, ShieldCheck, ArrowLeft, Star, ExternalLink, Calendar, Users, Award, Briefcase, Sparkles, Building2, ChevronRight, Check } from 'lucide-react';

interface BrandDirectoryDetailScreenProps {
  onOpenEnquiryModal: (productName: string, supplierName: string) => void;
  onOpenRFQModal: () => void;
  onOpenFacilityTour: (supplierName: string) => void;
  onNavigateToSuppliers: () => void;
}

const MOCK_BRANDS = [
  {
    id: 'b1',
    name: 'Aura Beauty Labs',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCJ-JsV4RQ8_6O3skDxu1yeXyZ1uDoVdkrXJrKEoc-REI6s2Ctt8DGBLz04mevk1QLqNmbiTD0JYu4S1KxBueueVl1mfIgwsQOPMwE_6mglJWbRg0UCnRp6beBhwek581NsXfBCDDSZ-hzcmoB9zopoUSnnjyKA6yrqFDum4CshWSOC_WC-zDmMRAfo4i-ak3zXm93SP089UxrNBZMum0V62zNazRMj6pH2GvlhXLjTN8AYAV8SWw6L',
    type: 'OEM & Contract Manufacturer',
    rating: 4.9,
    reviewsCount: 42,
    location: 'Mumbai, Maharashtra',
    established: '2012',
    employees: '150-200',
    capacity: '50,000 units / day',
    responseRate: '98%',
    gstVerified: true,
    certifications: ['ISO 22716', 'GMP', 'Cruelty-Free', 'Halal'],
    about: 'Aura Beauty Labs is a state-of-the-art beauty brand developer and contract manufacturer. We specialize in high-efficacy skincare, premium haircare formulations, and vegan cosmetics. Partnering with top-tier global beauty brands for private label execution.',
    categories: ['Skincare', 'Haircare', 'Cosmetics'],
    products: [
      { id: 'bp1', name: 'Peptide Skin Barrier Repair Cream', price: '₹145 - ₹180', moq: '2,000 Units', image: 'https://images.unsplash.com/photo-1608248597481-496100c8c836?w=400&auto=format&fit=crop&q=60' },
      { id: 'bp2', name: 'Clinical Vitamin C Infused Glow Serum', price: '₹190 - ₹220', moq: '3,000 Units', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&auto=format&fit=crop&q=60' },
      { id: 'bp3', name: 'Salicylic Acid Overnight Blemish Gel', price: '₹110 - ₹135', moq: '5,000 Units', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=60' }
    ],
    facilities: [
      { title: 'Quality Control Lab', desc: 'Rigorous batch testing and stability protocols' },
      { title: 'Class 10,000 Cleanroom', desc: 'ISO 7 certified packaging and automated filling lines' },
      { title: 'High-Shear Mixing Suite', desc: 'Undergoing strict molecular-emulsion quality controls' }
    ]
  },
  {
    id: 'b2',
    name: 'Dermaglow India Ltd',
    logo: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=200&auto=format&fit=crop&q=60',
    type: 'Derma-Cosmetic Supplier',
    rating: 4.8,
    reviewsCount: 31,
    location: 'Delhi NCR',
    established: '2008',
    employees: '100-150',
    capacity: '35,000 units / day',
    responseRate: '96%',
    gstVerified: true,
    certifications: ['GMP', 'ISO 9001', 'FDA Approved'],
    about: 'Dermaglow India manufactures medical-grade cosmetics and clinically tested skincare solutions. We work closely with clinical dermatologists to supply salons, spas, and premium dermo-cosmetic brands nationwide.',
    categories: ['Skincare', 'Professional Derma'],
    products: [
      { id: 'bp4', name: 'Dermatological Barrier Repair Fluid', price: '₹220 - ₹260', moq: '1,000 Units', image: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400&auto=format&fit=crop&q=60' },
      { id: 'bp5', name: 'Advanced Ceramide Hydrating Cleanser', price: '₹125 - ₹150', moq: '2,500 Units', image: 'https://images.unsplash.com/photo-1556229174-5e42a09e45af?w=400&auto=format&fit=crop&q=60' }
    ],
    facilities: [
      { title: 'Dermatological Testing Lab', desc: 'In-vitro efficacy testing & skin irritation profiling' },
      { title: 'High-Capacity Cold Storage', desc: 'Preserving active biological enzymes & botanical extracts' }
    ]
  },
  {
    id: 'b3',
    name: 'LuxeForm Organics',
    logo: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=200&auto=format&fit=crop&q=60',
    type: 'Eco-Luxe Private Labeler',
    rating: 4.7,
    reviewsCount: 19,
    location: 'Bengaluru, Karnataka',
    established: '2016',
    employees: '50-80',
    capacity: '20,000 units / day',
    responseRate: '94%',
    gstVerified: true,
    certifications: ['Ecocert Organic', 'ISO 22716', '100% Vegan'],
    about: 'LuxeForm Organics is dedicated to green chemistry and clean beauty. We offer turn-key solutions from botanical extraction to custom biodegradable packaging for organic beauty startups.',
    categories: ['Skincare', 'Bodycare', 'Haircare'],
    products: [
      { id: 'bp6', name: 'Cold-Pressed Marula Infused Facial Oil', price: '₹280 - ₹340', moq: '500 Units', image: 'https://images.unsplash.com/photo-1601049676099-e7ed07d825b0?w=400&auto=format&fit=crop&q=60' },
      { id: 'bp7', name: 'Organic Rosemary & Bamboo Volumizing Shampoo', price: '₹140 - ₹175', moq: '2,000 Units', image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&auto=format&fit=crop&q=60' }
    ],
    facilities: [
      { title: 'Supercritical CO2 Extraction Unit', desc: 'For high-purity natural and botanical oils' },
      { title: 'Post-Consumer Recycled Packaging Line', desc: 'Advanced zero-waste bottle design facility' }
    ]
  }
];

export const BrandDirectoryDetailScreen: React.FC<BrandDirectoryDetailScreenProps> = ({
  onOpenEnquiryModal,
  onOpenRFQModal,
  onOpenFacilityTour,
  onNavigateToSuppliers
}) => {
  const [selectedBrand, setSelectedBrand] = useState<typeof MOCK_BRANDS[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Filter logic
  const filteredBrands = MOCK_BRANDS.filter(brand => {
    const matchesSearch = brand.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          brand.about.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || brand.categories.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-[#fdf8f8] min-h-screen">
      
      {/* Banner / Navigation Header */}
      <div className="bg-white border-b border-[#e8e8e8] py-8 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#b90064] uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Nexora Partner Brands</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-[#1c1b1b] tracking-tight">
              {selectedBrand ? selectedBrand.name : 'Brand Directory & OEM Manufacturers'}
            </h1>
            <p className="text-xs text-[#594047] mt-1">
              {selectedBrand 
                ? `${selectedBrand.type} • GST Registered Manufacturer`
                : 'Directly connect with top beauty brands, contract formulators, and GMP factories in India.'
              }
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {selectedBrand ? (
              <button 
                onClick={() => setSelectedBrand(null)}
                className="flex items-center gap-1.5 px-4 py-2 border border-[#e8e8e8] hover:bg-neutral-50 rounded-lg text-xs font-bold text-zinc-800 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Directory</span>
              </button>
            ) : (
              <button
                onClick={onOpenRFQModal}
                className="bg-[#b90064] hover:bg-[#8e004b] text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                Post Custom Brand RFQ
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-8">
        {!selectedBrand ? (
          /* ================== DIRECTORY VIEW ================== */
          <div className="space-y-8">
            
            {/* Filters Bar */}
            <div className="bg-white p-4 border border-[#e8e8e8] rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search brands, formulators, active ingredients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#fcf9f8] border border-[#e8e8e8] focus:border-[#b90064] focus:outline-none rounded-lg pl-10 pr-4 py-2 text-xs text-[#1c1b1b]"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                {['All', 'Skincare', 'Haircare', 'Cosmetics', 'Professional Derma'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-[#b90064] text-white'
                        : 'bg-[#f7f2f2] text-[#594047] hover:bg-[#e8e8e8]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Brands Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {filteredBrands.map((brand) => (
                <div 
                  key={brand.id}
                  onClick={() => setSelectedBrand(brand)}
                  className="bg-white border border-[#e8e8e8] hover:border-[#b90064] hover:shadow-md rounded-xl p-5 transition-all flex flex-col justify-between cursor-pointer group"
                >
                  <div className="space-y-4">
                    {/* Brand Banner / Logo */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <img 
                          src={brand.logo} 
                          alt={brand.name} 
                          className="w-12 h-12 rounded-lg object-cover border border-[#e8e8e8]"
                        />
                        <div>
                          <h3 className="font-extrabold text-sm text-zinc-900 group-hover:text-[#b90064] transition-colors flex items-center gap-1">
                            {brand.name}
                            <ShieldCheck className="w-4 h-4 text-[#b90064] fill-[#fde7f3] shrink-0" />
                          </h3>
                          <span className="text-[11px] text-[#594047] font-medium">{brand.type}</span>
                        </div>
                      </div>
                      <span className="text-xs bg-[#fde7f3] text-[#b90064] px-2 py-0.5 rounded-md font-bold shrink-0">
                        GST Verified
                      </span>
                    </div>

                    <p className="text-xs text-[#594047] leading-relaxed line-clamp-3">
                      {brand.about}
                    </p>

                    {/* Meta stats */}
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#e8e8e8] text-[11px] text-[#594047]">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate font-semibold">{brand.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span>Est: <span className="font-semibold">{brand.established}</span></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span>Employees: <span className="font-semibold">{brand.employees}</span></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                        <span><span className="font-semibold">{brand.rating}</span> ({brand.reviewsCount})</span>
                      </div>
                    </div>

                    {/* Certification chips */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {brand.certifications.map((cert) => (
                        <span key={cert} className="text-[9.5px] bg-[#f7f2f2] text-zinc-700 px-2 py-0.5 rounded-md font-bold uppercase tracking-wide">
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#e8e8e8] flex items-center justify-between text-xs font-bold text-[#b90064]">
                    <span>View Formulations &amp; Facility</span>
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              ))}
            </div>

            {filteredBrands.length === 0 && (
              <div className="bg-white border border-[#e8e8e8] rounded-xl p-12 text-center max-w-md mx-auto">
                <Building2 className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                <h3 className="font-bold text-zinc-950 mb-1">No formulation brands found</h3>
                <p className="text-xs text-[#594047] mb-4">Try adjusting your category filter or search query to explore other top beauty contract formulators.</p>
                <button 
                  onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                  className="text-xs font-bold text-[#b90064] hover:underline cursor-pointer"
                >
                  Clear all search filters
                </button>
              </div>
            )}

          </div>
        ) : (
          /* ================== BRAND DETAIL VIEW ================== */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left: Brand Story & Manufacturing capacity (col-span-8) */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Cover Card */}
              <div className="bg-white border border-[#e8e8e8] rounded-2xl p-6 md:p-8 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <img 
                      src={selectedBrand.logo} 
                      alt={selectedBrand.name} 
                      className="w-16 h-16 rounded-xl object-cover border border-[#e8e8e8]"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h2 className="text-xl font-extrabold text-zinc-900">{selectedBrand.name}</h2>
                        <ShieldCheck className="w-5 h-5 text-[#b90064] fill-[#fde7f3]" />
                      </div>
                      <p className="text-xs text-[#594047] font-semibold">{selectedBrand.type}</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {selectedBrand.location}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {}}
                      className="border border-[#e8e8e8] text-[#594047] hover:border-[#b90064] hover:text-[#b90064] text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Audit Report</span>
                    </button>
                    <button
                      onClick={() => onOpenEnquiryModal('Custom Product Development', selectedBrand.name)}
                      className="bg-[#b90064] hover:bg-[#8e004b] text-white text-xs font-extrabold px-4 py-2 rounded-lg transition-all cursor-pointer"
                    >
                      Enquire Custom Batch
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-extrabold text-sm text-zinc-900">About Manufacturer / Brand Owner</h3>
                  <p className="text-xs text-[#594047] leading-relaxed">
                    {selectedBrand.about}
                  </p>
                </div>

                {/* Key specs grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-center">
                  <div>
                    <span className="block text-[10px] text-[#8c7077] uppercase font-bold tracking-wider">Established</span>
                    <span className="text-sm font-extrabold text-zinc-900 mt-1 block">{selectedBrand.established}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#8c7077] uppercase font-bold tracking-wider">Daily Capacity</span>
                    <span className="text-sm font-extrabold text-zinc-900 mt-1 block">{selectedBrand.capacity}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#8c7077] uppercase font-bold tracking-wider">Response Rate</span>
                    <span className="text-sm font-extrabold text-zinc-900 mt-1 block text-emerald-600">{selectedBrand.responseRate}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#8c7077] uppercase font-bold tracking-wider">GST Verified</span>
                    <span className="text-sm font-extrabold text-zinc-900 mt-1 block text-[#b90064]">Yes</span>
                  </div>
                </div>
              </div>

              {/* Private Label Showcase */}
              <div className="space-y-4">
                <h3 className="text-lg font-black text-[#1c1b1b] flex items-center gap-1.5">
                  <Briefcase className="w-5 h-5 text-[#b90064]" />
                  <span>Available Private Label Formulations</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedBrand.products.map((prod) => (
                    <div key={prod.id} className="bg-white border border-[#e8e8e8] rounded-xl overflow-hidden flex flex-col justify-between">
                      <div className="flex gap-4 p-4">
                        <img 
                          src={prod.image} 
                          alt={prod.name} 
                          className="w-20 h-20 rounded-lg object-cover border border-[#e8e8e8] shrink-0"
                        />
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-xs text-zinc-900 leading-tight">{prod.name}</h4>
                          <p className="text-[11px] text-[#b90064] font-bold">Estimated Cost: {prod.price} <span className="text-zinc-400 font-normal">/ unit</span></p>
                          <p className="text-[10px] text-[#594047] font-semibold">Min Order Qty: {prod.moq}</p>
                        </div>
                      </div>

                      <div className="px-4 py-2.5 bg-[#fcf9f8] border-t border-[#e8e8e8] flex items-center justify-between">
                        <span className="text-[9.5px] bg-[#fde7f3] text-[#b90064] px-1.5 py-0.5 rounded font-bold uppercase">Formulation Ready</span>
                        <button
                          onClick={() => onOpenEnquiryModal(prod.name, selectedBrand.name)}
                          className="text-xs font-bold text-[#b90064] hover:underline cursor-pointer"
                        >
                          Get Best Price Quote
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Facility & GMP Compliance details */}
              <div className="bg-white border border-[#e8e8e8] rounded-xl p-6 space-y-4">
                <h3 className="font-extrabold text-sm text-zinc-900 flex items-center gap-1.5">
                  <Award className="w-5 h-5 text-[#b90064]" />
                  <span>State of the Art Facilities &amp; Standards</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedBrand.facilities.map((fac, i) => (
                    <div key={i} className="p-4 bg-[#fcf9f8] border border-[#e8e8e8] rounded-lg">
                      <h4 className="font-bold text-xs text-zinc-900 flex items-center gap-1.5 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#b90064]" />
                        {fac.title}
                      </h4>
                      <p className="text-[11px] text-[#594047] leading-relaxed">{fac.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right: Supplier trust check sidebar (col-span-4) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Sourcing credentials check */}
              <div className="bg-white border border-[#e8e8e8] rounded-xl p-5 space-y-4">
                <h3 className="font-extrabold text-xs text-zinc-900 uppercase tracking-wider text-[#8c7077]">Trust &amp; Verification Signals</h3>
                
                <div className="space-y-3.5 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="block font-bold text-zinc-900">GST Registration Confirmed</span>
                      <span className="block text-[10.5px] text-[#594047]">Corporate tax filings fully checked &amp; active.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="block font-bold text-zinc-900">GMP &amp; ISO 22716 Audited</span>
                      <span className="block text-[10.5px] text-[#594047]">Maintains pristine hygienic and quality compliance standards.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="block font-bold text-zinc-900">Stable Response rate (98%)</span>
                      <span className="block text-[10.5px] text-[#594047]">Usually responds within 2-4 business hours.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Consultation contact widget */}
              <div className="bg-gradient-to-br from-[#b90064] to-[#8e004b] text-white rounded-xl p-6 space-y-4 shadow-sm text-center md:text-left">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#f5ced8]">Turn-Key Service</h3>
                <h4 className="font-black text-lg leading-tight">Need custom beauty formulation?</h4>
                <p className="text-xs text-[#f5ced8] leading-relaxed">
                  Let us connect you directly with Aura formulation specialists to build your private label brand catalogs from scratch.
                </p>
                <button
                  onClick={() => onOpenEnquiryModal('Beauty private label consulting', selectedBrand.name)}
                  className="w-full py-3 bg-white hover:bg-neutral-50 text-[#b90064] font-extrabold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  Request Consultation Call
                </button>
              </div>

            </div>

          </div>
        )}
      </div>

    </div>
  );
};
