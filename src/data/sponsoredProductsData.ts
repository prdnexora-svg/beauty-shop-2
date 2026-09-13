import { SponsoredAdItem, ProductDetailData } from '../types';

export const SPONSORED_PRODUCTS_DB: Record<string, ProductDetailData> = {
  'product_vitc_101': {
    id: 'product_vitc_101',
    seller_id: 'seller_aura_001',
    advertiser_id: 'adv_aura_001',
    title: 'Professional 20% Vitamin C Glow Serum Base',
    supplierName: 'Aura Beauty Labs',
    supplierLocation: 'Mumbai, Maharashtra',
    supplierType: 'Verified Manufacturer & OEM',
    isGstVerified: true,
    isIsoCertified: true,
    isNexoraVerified: true,
    isBusinessVerified: true,
    isPublished: true,
    isSuspended: false,
    moq: '100 Units',
    priceRange: '₹380 — ₹450 / Unit',
    priceMin: 380,
    priceMax: 450,
    bulkTiers: [
      { quantityRange: '100 – 249 Units', unitPrice: '₹450 / Unit' },
      { quantityRange: '250 – 499 Units', unitPrice: '₹410 / Unit' },
      { quantityRange: '500+ Units', unitPrice: '₹380 / Unit' }
    ],
    category: 'Skincare',
    subcategory: 'Serums & Actives',
    description: 'Stabilized 20% Ethyl Ascorbic Acid enriched with Ferulic Acid and Hyaluronic Acid. Manufactured in WHO-GMP cleanrooms for premium salon retail and private label brands.',
    images: [
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1608248597359-052445bfa3d0?auto=format&fit=crop&w=800&q=80'
    ],
    stockAvailability: 'In-Stock',
    leadTimeText: 'Ready Batch (Dispatches in 24–48 Hours)',
    specs: {
      formulationBase: '20% Ethyl Ascorbic Acid + 1% Ferulic Acid + 2% HA',
      packagingType: 'UV Amber Glass Bottle with Gold Pipette',
      shelfLife: '24 Months',
      sampleLeadTime: '1 - 2 Days',
      productionCapacity: '150,000 Units / Month',
      certifications: ['WHO-GMP', 'ISO 22716', 'US-FDA Registered', 'COA Batch Certified']
    },
    sellerDetails: {
      phone: '+91 98201 55443',
      whatsapp: '919820155443',
      email: 'sales@aurabeautylabs.in',
      trustScore: 98,
      responseRate: '98% within 2 hrs',
      establishedYear: '2014 (12 yrs)',
      facilityArea: '32,000 sq.ft GMP Cleanroom'
    }
  },
  'product_barrier_102': {
    id: 'product_barrier_102',
    seller_id: 'seller_luxe_002',
    advertiser_id: 'adv_luxe_002',
    title: 'Hydrating Hyaluronic Barrier Repair Cream Base',
    supplierName: 'LuxeForm Cosmetics',
    supplierLocation: 'Ahmedabad, Gujarat',
    supplierType: 'OEM & Formulation Lab',
    isGstVerified: true,
    isIsoCertified: true,
    isNexoraVerified: true,
    isBusinessVerified: true,
    isPublished: true,
    isSuspended: false,
    moq: '50 kg / 200 Jars',
    priceRange: '₹220 — ₹290 / Jar',
    priceMin: 220,
    priceMax: 290,
    bulkTiers: [
      { quantityRange: '200 – 499 Jars', unitPrice: '₹290 / Jar' },
      { quantityRange: '500 – 999 Jars', unitPrice: '₹250 / Jar' },
      { quantityRange: '1000+ Jars', unitPrice: '₹220 / Jar' }
    ],
    category: 'Skincare',
    subcategory: 'Moisturizers & Creams',
    description: 'Multi-ceramide complex with 5 molecular weights of Hyaluronic Acid for deep epidermal barrier restoration. Ideal for clinical dermatology brands.',
    images: [
      'https://images.unsplash.com/photo-1608248597359-052445bfa3d0?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80'
    ],
    stockAvailability: 'Low Stock',
    leadTimeText: 'Only 350 Jars Left Ready (Fast 1–2 Day Dispatch)',
    specs: {
      formulationBase: 'Ceramide EOP/NS/NP + 5D Hyaluronic Acid Matrix',
      packagingType: 'Double-Wall Frosted Acrylic Jar (50g)',
      shelfLife: '30 Months',
      sampleLeadTime: '2 Days',
      productionCapacity: '100,000 Jars / Month',
      certifications: ['ISO 9001:2015', 'GMP Compliant', 'Cruelty-Free']
    },
    sellerDetails: {
      phone: '+91 98790 44556',
      whatsapp: '919879044556',
      email: 'b2b@luxeform.co.in',
      trustScore: 97,
      responseRate: '96% within 1 hr',
      establishedYear: '2012 (14 yrs)',
      facilityArea: '45,000 sq.ft Manufacturing Plant'
    }
  },
  'product_spa_103': {
    id: 'product_spa_103',
    seller_id: 'seller_derma_003',
    advertiser_id: 'adv_derma_003',
    title: 'Salon Hair Repair Spa Kits (5-Step Intensive Therapy)',
    supplierName: 'Dermaglow India',
    supplierLocation: 'Delhi NCR',
    supplierType: 'Wholesaler & Stockist',
    isGstVerified: true,
    isIsoCertified: true,
    isNexoraVerified: true,
    isBusinessVerified: true,
    isPublished: true,
    isSuspended: false,
    moq: '25 Complete Kits',
    priceRange: '₹850 — ₹1,100 / Kit',
    priceMin: 850,
    priceMax: 1100,
    bulkTiers: [
      { quantityRange: '25 – 49 Kits', unitPrice: '₹1,100 / Kit' },
      { quantityRange: '50 – 99 Kits', unitPrice: '₹950 / Kit' },
      { quantityRange: '100+ Kits', unitPrice: '₹850 / Kit' }
    ],
    category: 'Haircare',
    subcategory: 'Salon Treatments',
    description: 'Professional 5-step salon spa treatment kit containing Keratin Infusion, Clarifying Wash, Hydration Seal, Collagen Booster, and Argan Glossing Oil.',
    images: [
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=800&q=80'
    ],
    specs: {
      formulationBase: 'Nano-Keratin + Hydrolyzed Collagen + Macadamia Oil',
      packagingType: '5 x 250ml HDPE Bottled Salon Box Set',
      shelfLife: '36 Months',
      sampleLeadTime: '1 Day',
      productionCapacity: '20,000 Kits / Month',
      certifications: ['Dermatologist Approved', 'ISO 22716']
    },
    sellerDetails: {
      phone: '+91 98110 33221',
      whatsapp: '919811033221',
      email: 'orders@dermaglow.in',
      trustScore: 96,
      responseRate: '95% within 1 hr',
      establishedYear: '2017 (9 yrs)',
      facilityArea: '50,000 sq.ft Depot'
    }
  },
  'product_matte_104': {
    id: 'product_matte_104',
    seller_id: 'seller_pure_004',
    advertiser_id: 'adv_pure_004',
    title: 'Matte Liquid Lipstick Pigment Base Concentrate',
    supplierName: 'PureFormulations Pvt',
    supplierLocation: 'Pune, Maharashtra',
    supplierType: 'Raw Material & Active Producer',
    isGstVerified: true,
    isIsoCertified: true,
    isNexoraVerified: true,
    isBusinessVerified: true,
    isPublished: true,
    isSuspended: false,
    moq: '10 kg',
    priceRange: '₹1,200 — ₹1,650 / kg',
    priceMin: 1200,
    priceMax: 1650,
    bulkTiers: [
      { quantityRange: '10 – 24 kg', unitPrice: '₹1,650 / kg' },
      { quantityRange: '25 – 99 kg', unitPrice: '₹1,400 / kg' },
      { quantityRange: '100+ kg', unitPrice: '₹1,200 / kg' }
    ],
    category: 'OEM / Raw Materials',
    subcategory: 'Color Cosmetics Base',
    description: 'High-pigment, 12-hour transfer-proof liquid lipstick base. Ready for shade customization with cosmetic grade iron oxides and mica.',
    images: [
      'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80'
    ],
    specs: {
      formulationBase: 'Isododecane + Trimethylsiloxysilicate + Vitamin E',
      packagingType: '10kg Sealed Stainless Steel Drum',
      shelfLife: '36 Months',
      sampleLeadTime: '2 Days',
      productionCapacity: '15,000 kg / Month',
      certifications: ['Heavy Metal Free', 'FDA Color Safe Approved']
    },
    sellerDetails: {
      phone: '+91 98220 77889',
      whatsapp: '919822077889',
      email: 'tech@pureformulations.in',
      trustScore: 95,
      responseRate: '96% within 2 hrs',
      establishedYear: '2011 (15 yrs)',
      facilityArea: '28,000 sq.ft Eco Facility'
    }
  },
  'product_scalp_105': {
    id: 'product_scalp_105',
    seller_id: 'seller_biotech_005',
    advertiser_id: 'adv_biotech_005',
    title: 'Rosemary & Redensyl Scalp Revitalizing Tonic',
    supplierName: 'BioTech Derma Labs',
    supplierLocation: 'Ahmedabad, Gujarat',
    supplierType: 'Verified Manufacturer',
    isGstVerified: true,
    isIsoCertified: true,
    isNexoraVerified: true,
    isBusinessVerified: true,
    isPublished: true,
    isSuspended: false,
    moq: '100 Units',
    priceRange: '₹320 — ₹390 / Unit',
    priceMin: 320,
    priceMax: 390,
    bulkTiers: [
      { quantityRange: '100 – 249 Units', unitPrice: '₹390 / Unit' },
      { quantityRange: '250 – 499 Units', unitPrice: '₹350 / Unit' },
      { quantityRange: '500+ Units', unitPrice: '₹320 / Unit' }
    ],
    category: 'Haircare',
    subcategory: 'Hairfall & Scalp Actives',
    description: '3% Redensyl + 2% Anagain + Pure Steam-Distilled Rosemary Extract. Clinically tested for follicle stimulation and density enhancement.',
    images: [
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80'
    ],
    specs: {
      formulationBase: 'Redensyl 3% + Anagain 2% + Rosemary Extract 5%',
      packagingType: 'Matte Black Glass Dropper (50ml)',
      shelfLife: '24 Months',
      sampleLeadTime: '1 Day',
      productionCapacity: '75,000 Units / Month',
      certifications: ['AYUSH Approved', 'ISO 9001:2015', 'Dermat Tested']
    },
    sellerDetails: {
      phone: '+91 98791 22334',
      whatsapp: '919879122334',
      email: 'info@biotechderma.com',
      trustScore: 98,
      responseRate: '97% within 1 hr',
      establishedYear: '2015 (11 yrs)',
      facilityArea: '30,000 sq.ft Cleanroom'
    }
  },
  'product_dropper_106': {
    id: 'product_dropper_106',
    seller_id: 'seller_cosmo_006',
    advertiser_id: 'adv_cosmo_006',
    title: 'Frosted Amber Glass Dropper Bottles (30ml & 50ml)',
    supplierName: 'CosmoTech Packaging',
    supplierLocation: 'Thane, Maharashtra',
    supplierType: 'Packaging Manufacturer',
    isGstVerified: true,
    isIsoCertified: true,
    isNexoraVerified: true,
    isBusinessVerified: true,
    isPublished: true,
    isSuspended: false,
    moq: '500 Pieces',
    priceRange: '₹18 — ₹26 / Piece',
    priceMin: 18,
    priceMax: 26,
    bulkTiers: [
      { quantityRange: '500 – 1,999 Pcs', unitPrice: '₹26 / Piece' },
      { quantityRange: '2,000 – 4,999 Pcs', unitPrice: '₹22 / Piece' },
      { quantityRange: '5,000+ Pcs', unitPrice: '₹18 / Piece' }
    ],
    category: 'Packaging',
    subcategory: 'Cosmetic Glassware',
    description: 'UV-protective pharmaceutical-grade frosted glass dropper bottles with gold or silver metallic collars and precision silicone bulb pipettes.',
    images: [
      'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80'
    ],
    specs: {
      formulationBase: 'Type III USP Pharmaceutical Glass',
      packagingType: 'Export Corrugated Boxes with Molded Trays',
      shelfLife: 'Indefinite Storage Life',
      sampleLeadTime: '1 Day',
      productionCapacity: '500,000 Pcs / Month',
      certifications: ['US-FDA Food & Cosmetic Grade', 'RoHS Compliant']
    },
    sellerDetails: {
      phone: '+91 98205 88990',
      whatsapp: '919820588990',
      email: 'sales@cosmotechpack.in',
      trustScore: 99,
      responseRate: '99% within 30 mins',
      establishedYear: '2010 (16 yrs)',
      facilityArea: '60,000 sq.ft Glassware Unit'
    }
  },
  'product_niacinamide_107': {
    id: 'product_niacinamide_107',
    seller_id: 'seller_radiant_007',
    advertiser_id: 'adv_radiant_007',
    title: 'Brightening 10% Niacinamide Gel Cleanser Base',
    supplierName: 'Radiant Cosmeceuticals',
    supplierLocation: 'Delhi NCR',
    supplierType: 'Private Label Manufacturer',
    isGstVerified: true,
    isIsoCertified: true,
    isNexoraVerified: true,
    isBusinessVerified: true,
    isPublished: true,
    isSuspended: false,
    moq: '150 Units',
    priceRange: '₹180 — ₹240 / Unit',
    priceMin: 180,
    priceMax: 240,
    bulkTiers: [
      { quantityRange: '150 – 499 Units', unitPrice: '₹240 / Unit' },
      { quantityRange: '500 – 999 Units', unitPrice: '₹210 / Unit' },
      { quantityRange: '1000+ Units', unitPrice: '₹180 / Unit' }
    ],
    category: 'Skincare',
    subcategory: 'Cleansers & Face Wash',
    description: 'Sulfate-free pH balanced gel cleanser formulated with 10% pure Niacinamide, Zinc PCA, and Cica Extract to clarify skin tone and reduce sebum.',
    images: [
      'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80'
    ],
    specs: {
      formulationBase: '10% Niacinamide + 1% Zinc PCA + Centella Asiatica',
      packagingType: 'Airless Pump Bottle (150ml)',
      shelfLife: '24 Months',
      sampleLeadTime: '2 Days',
      productionCapacity: '80,000 Units / Month',
      certifications: ['ISO 22716 GMP', 'Dermatologist Tested']
    },
    sellerDetails: {
      phone: '+91 98118 99887',
      whatsapp: '919811899887',
      email: 'contact@radiantcosmo.in',
      trustScore: 96,
      responseRate: '97% within 1 hr',
      establishedYear: '2016 (10 yrs)',
      facilityArea: '25,000 sq.ft Plant'
    }
  },
  'product_rosewater_108': {
    id: 'product_rosewater_108',
    seller_id: 'seller_velvet_008',
    advertiser_id: 'adv_velvet_008',
    title: 'Organic Pure Rosewater Hydrosol Mist (Bulk 50L / 100L)',
    supplierName: 'VelvetTouch Botanical',
    supplierLocation: 'Kannauj / Lucknow, UP',
    supplierType: 'Distiller & Wholesaler',
    isGstVerified: true,
    isIsoCertified: true,
    isNexoraVerified: true,
    isBusinessVerified: true,
    isPublished: true,
    isSuspended: false,
    moq: '50 Liters',
    priceRange: '₹450 — ₹600 / Liter',
    priceMin: 450,
    priceMax: 600,
    bulkTiers: [
      { quantityRange: '50 – 99 Liters', unitPrice: '₹600 / L' },
      { quantityRange: '100 – 499 Liters', unitPrice: '₹520 / L' },
      { quantityRange: '500+ Liters', unitPrice: '₹450 / L' }
    ],
    category: 'Skincare',
    subcategory: 'Toner & Mists',
    description: '100% steam-distilled Damask rose hydrosol without artificial fragrance or added alcohol. Ideal for premium organic skincare bottling.',
    images: [
      'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=800&q=80'
    ],
    specs: {
      formulationBase: '100% Rosa Damascena Flower Distillate Water',
      packagingType: 'Food-Grade 50L HDPE Carboys with Bung Seal',
      shelfLife: '18 Months',
      sampleLeadTime: '1 Day',
      productionCapacity: '10,000 Liters / Month',
      certifications: ['ECOCERT Organic Equivalent', 'Ayush License']
    },
    sellerDetails: {
      phone: '+91 98390 11223',
      whatsapp: '919839011223',
      email: 'sales@velvettouch.co.in',
      trustScore: 95,
      responseRate: '94% within 2 hrs',
      establishedYear: '2008 (18 yrs)',
      facilityArea: '40,000 sq.ft Distillation Yard'
    }
  },
  'product_microderm_109': {
    id: 'product_microderm_109',
    seller_id: 'seller_apex_009',
    advertiser_id: 'adv_apex_009',
    title: 'Professional Micro-Dermabrasion Aesthetic Device',
    supplierName: 'Apex Beauty Equipment',
    supplierLocation: 'Bengaluru, Karnataka',
    supplierType: 'ISO Equipment Manufacturer',
    isGstVerified: true,
    isIsoCertified: true,
    isNexoraVerified: true,
    isBusinessVerified: true,
    isPublished: true,
    isSuspended: false,
    moq: '2 Units',
    priceRange: '₹22,000 — ₹28,000 / Unit',
    priceMin: 22000,
    priceMax: 28000,
    bulkTiers: [
      { quantityRange: '2 – 4 Units', unitPrice: '₹28,000 / Unit' },
      { quantityRange: '5 – 9 Units', unitPrice: '₹25,000 / Unit' },
      { quantityRange: '10+ Units', unitPrice: '₹22,000 / Unit' }
    ],
    category: 'Salon Equipment',
    subcategory: 'Aesthetic Machines',
    description: 'Medical-grade diamond head micro-dermabrasion exfoliation console with high-vacuum pressure pump for aesthetic clinics and luxury spas.',
    images: [
      'https://images.unsplash.com/photo-1512290900676-26c2a4d4b57b?auto=format&fit=crop&w=800&q=80'
    ],
    specs: {
      formulationBase: 'Medical Grade Stainless Wands + Diamond Tip Set (9 Tips)',
      packagingType: 'Heavy Duty Wooden Flight Crate',
      shelfLife: '10 Year Service Life (1 Yr Onsite Warranty)',
      sampleLeadTime: 'Demo Available',
      productionCapacity: '150 Units / Month',
      certifications: ['CE Certified', 'ISO 13485 Medical Device Quality']
    },
    sellerDetails: {
      phone: '+91 98450 11992',
      whatsapp: '919845011992',
      email: 'support@apexbeautydevice.in',
      trustScore: 98,
      responseRate: '98% within 1 hr',
      establishedYear: '2013 (13 yrs)',
      facilityArea: '35,000 sq.ft Equipment Unit'
    }
  },
  'product_keratin_110': {
    id: 'product_keratin_110',
    seller_id: 'seller_silk_010',
    advertiser_id: 'adv_silk_010',
    title: 'Keratin Infused Hair Treatment & Shine Oil',
    supplierName: 'Silk&Shine Manufacturing',
    supplierLocation: 'Surat, Gujarat',
    supplierType: 'OEM Haircare Specialist',
    isGstVerified: true,
    isIsoCertified: true,
    isNexoraVerified: true,
    isBusinessVerified: true,
    isPublished: true,
    isSuspended: false,
    moq: '100 Units',
    priceRange: '₹290 — ₹360 / Unit',
    priceMin: 290,
    priceMax: 360,
    bulkTiers: [
      { quantityRange: '100 – 249 Units', unitPrice: '₹360 / Unit' },
      { quantityRange: '250 – 499 Units', unitPrice: '₹320 / Unit' },
      { quantityRange: '500+ Units', unitPrice: '₹290 / Unit' }
    ],
    category: 'Haircare',
    subcategory: 'Hair Oils & Serums',
    description: 'Hydrolyzed keratin oil infused with Camellia seed and Marula oil for thermal protection and frizz elimination. Exported to 12 countries.',
    images: [
      'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=800&q=80'
    ],
    specs: {
      formulationBase: 'Hydrolyzed Keratin Protein + Camellia & Argan Oil',
      packagingType: 'Glass Pump Bottle (100ml)',
      shelfLife: '36 Months',
      sampleLeadTime: '2 Days',
      productionCapacity: '120,000 Units / Month',
      certifications: ['GMP Certified', 'ISO 9001:2015']
    },
    sellerDetails: {
      phone: '+91 98251 44332',
      whatsapp: '919825144332',
      email: 'export@silkshinehair.com',
      trustScore: 97,
      responseRate: '96% within 1 hr',
      establishedYear: '2014 (12 yrs)',
      facilityArea: '38,000 sq.ft Plant'
    }
  },
  'product_salon_comb_111': {
    id: 'product_salon_comb_111',
    seller_id: 'seller_aura_001',
    advertiser_id: 'adv_aura_001',
    title: 'Professional Carbon Cutting & Styling Comb Set',
    supplierName: 'Aura Beauty Labs',
    supplierLocation: 'Mumbai, Maharashtra',
    supplierType: 'Verified Salon Supplies Manufacturer',
    isGstVerified: true,
    isIsoCertified: true,
    isNexoraVerified: true,
    isBusinessVerified: true,
    isPublished: true,
    isSuspended: false,
    moq: '100 Sets',
    priceRange: '₹165 — ₹240 / Set',
    priceMin: 165,
    priceMax: 240,
    bulkTiers: [
      { quantityRange: '100 – 249 Sets', unitPrice: '₹240 / Set' },
      { quantityRange: '250 – 499 Sets', unitPrice: '₹195 / Set' },
      { quantityRange: '500+ Sets', unitPrice: '₹165 / Set' }
    ],
    category: 'Salon Equipment',
    subcategory: 'Professional Tool Kits',
    description: 'Heat-resistant, anti-static carbon comb kit for professional haircutting, sectioning and chemical services. Supplied in a reusable salon pouch.',
    images: ['https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=800&q=80'],
    stockAvailability: 'In-Stock',
    leadTimeText: 'Mumbai stock — dispatch in 24 hours',
    specs: {
      formulationBase: 'High-strength anti-static carbon fibre',
      packagingType: '10-piece salon pouch set',
      shelfLife: '5+ Year Service Life',
      sampleLeadTime: 'Same-day sample dispatch',
      productionCapacity: '25,000 Sets / Month',
      certifications: ['GST Verified', 'Salon Tested', 'Quality Checked']
    },
    sellerDetails: {
      phone: '+91 98201 55443', whatsapp: '919820155443', email: 'sales@aurabeautylabs.in',
      trustScore: 98, responseRate: '98% within 2 hrs', establishedYear: '2014 (12 yrs)', facilityArea: '32,000 sq.ft Mumbai Unit'
    }
  },
  'product_salon_clips_112': {
    id: 'product_salon_clips_112',
    seller_id: 'seller_aura_001',
    advertiser_id: 'adv_aura_001',
    title: 'Stainless Steel Salon Sectioning Clips — 24 Pack',
    supplierName: 'Aura Beauty Labs',
    supplierLocation: 'Mumbai, Maharashtra',
    supplierType: 'Verified Salon Supplies Manufacturer',
    isGstVerified: true,
    isIsoCertified: true,
    isNexoraVerified: true,
    isBusinessVerified: true,
    isPublished: true,
    isSuspended: false,
    moq: '120 Packs',
    priceRange: '₹210 — ₹295 / Pack',
    priceMin: 210,
    priceMax: 295,
    bulkTiers: [
      { quantityRange: '120 – 249 Packs', unitPrice: '₹295 / Pack' },
      { quantityRange: '250 – 499 Packs', unitPrice: '₹245 / Pack' },
      { quantityRange: '500+ Packs', unitPrice: '₹210 / Pack' }
    ],
    category: 'Salon Equipment',
    subcategory: 'Professional Tool Kits',
    description: 'Non-slip stainless section clips for haircutting, coloring, styling and bridal makeup studios. Rust-resistant and suitable for repeated sanitization.',
    images: ['https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80'],
    stockAvailability: 'In-Stock',
    leadTimeText: 'Ready stock in Mumbai — 1–2 day dispatch',
    specs: {
      formulationBase: 'Salon-grade stainless steel with anti-slip grip',
      packagingType: '24 clips per retail-ready pack',
      shelfLife: 'Reusable professional equipment',
      sampleLeadTime: '1 Business Day',
      productionCapacity: '40,000 Packs / Month',
      certifications: ['GST Verified', 'Rust Resistance Tested', 'Quality Checked']
    },
    sellerDetails: {
      phone: '+91 98201 55443', whatsapp: '919820155443', email: 'sales@aurabeautylabs.in',
      trustScore: 98, responseRate: '98% within 2 hrs', establishedYear: '2014 (12 yrs)', facilityArea: '32,000 sq.ft Mumbai Unit'
    }
  },
  'product_nail_lamp_113': {
    id: 'product_nail_lamp_113',
    seller_id: 'seller_aura_001',
    advertiser_id: 'adv_aura_001',
    title: 'Portable UV LED Nail Curing Lamp for Studios',
    supplierName: 'Aura Beauty Labs',
    supplierLocation: 'Mumbai, Maharashtra',
    supplierType: 'Verified Salon Supplies Manufacturer',
    isGstVerified: true,
    isIsoCertified: true,
    isNexoraVerified: true,
    isBusinessVerified: true,
    isPublished: true,
    isSuspended: false,
    moq: '100 Units',
    priceRange: '₹890 — ₹1,150 / Unit',
    priceMin: 890,
    priceMax: 1150,
    bulkTiers: [
      { quantityRange: '100 – 199 Units', unitPrice: '₹1,150 / Unit' },
      { quantityRange: '200 – 499 Units', unitPrice: '₹990 / Unit' },
      { quantityRange: '500+ Units', unitPrice: '₹890 / Unit' }
    ],
    category: 'Salon Equipment',
    subcategory: 'Nail Studio Equipment',
    description: 'Compact dual-light UV LED curing lamp with 30, 60 and 90 second timers for nail studios, beauty parlours and mobile nail artists.',
    images: ['https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80'],
    stockAvailability: 'In-Stock',
    leadTimeText: 'Ready stock in Mumbai — dispatch in 48 hours',
    specs: {
      formulationBase: '48W dual UV/LED professional curing system',
      packagingType: 'Protective retail box with adapter',
      shelfLife: '30,000 Hour Rated LED Life',
      sampleLeadTime: 'Demo unit available',
      productionCapacity: '8,000 Units / Month',
      certifications: ['CE Certified', 'Electrical Safety Tested', '1-Year Warranty']
    },
    sellerDetails: {
      phone: '+91 98201 55443', whatsapp: '919820155443', email: 'sales@aurabeautylabs.in',
      trustScore: 98, responseRate: '98% within 2 hrs', establishedYear: '2014 (12 yrs)', facilityArea: '32,000 sq.ft Mumbai Unit'
    }
  }
};

export function validateSponsoredAd(ad: SponsoredAdItem): boolean {
  if (ad.status !== 'active') return false;
  const product = SPONSORED_PRODUCTS_DB[ad.product_id];
  if (!product) return false;
  // Verify ownership
  if (product.seller_id !== ad.seller_id) return false;
  // Verify product publication status
  if (!product.isPublished) return false;
  if (product.isSuspended) return false;
  return true;
}
