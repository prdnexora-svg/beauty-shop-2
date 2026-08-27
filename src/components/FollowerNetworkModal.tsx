import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Users,
  ShieldCheck,
  MapPin,
  MessageSquare,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Check,
  UserPlus,
  Building2,
  Package,
  Award,
  Filter,
  CheckCircle2,
  Clock,
  Send,
  SlidersHorizontal,
  Flame
} from 'lucide-react';
import { VerifiedSupplier } from '../types';

export interface FollowerSupplier {
  id: string;
  name: string;
  shortCode: string;
  logo: string;
  type: string;
  category: string;
  location: string;
  city: string;
  state: string;
  isVerified: boolean;
  isGstVerified: boolean;
  trustScore: number;
  responseRate: string;
  mutualConnections: number;
  followersCount: string;
  connectedSince: string;
  specialties: string[];
  isFollowingBack: boolean;
  activeRFQsCount?: number;
}

const INITIAL_FOLLOWERS_LIST: FollowerSupplier[] = [
  {
    id: 'seller_aura_001',
    name: 'Aura Beauty Labs & Formulations',
    shortCode: 'AB',
    logo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=200&q=80',
    type: 'Manufacturer & OEM',
    category: 'Haircare Formulations',
    location: 'MIDC Taloja, Navi Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    isVerified: true,
    isGstVerified: true,
    trustScore: 98,
    responseRate: '< 2 hrs (98%)',
    mutualConnections: 34,
    followersCount: '4.2k',
    connectedSince: 'Jan 2024',
    specialties: ['Nano-Keratin Matrix', 'Cold-Process Hair Serums', 'Custom Fragrance'],
    isFollowingBack: true,
    activeRFQsCount: 3
  },
  {
    id: 'seller_dermaglow_002',
    name: 'Dermaglow India Cosmeceuticals',
    shortCode: 'DG',
    logo: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=200&q=80',
    type: 'OEM / Contract Manufacturer',
    category: 'Skincare & Actives',
    location: 'Changodar GIDC Industrial Zone',
    city: 'Ahmedabad',
    state: 'Gujarat',
    isVerified: true,
    isGstVerified: true,
    trustScore: 96,
    responseRate: '< 1 hr (99%)',
    mutualConnections: 28,
    followersCount: '3.8k',
    connectedSince: 'Feb 2024',
    specialties: ['Vitamin C 20% + E + Ferulic', 'Peptide Matrix 5%', 'Ceramide Barrier Complex'],
    isFollowingBack: true,
    activeRFQsCount: 2
  },
  {
    id: 'seller_luxeform_003',
    name: 'LuxeForm Cosmetic Packaging Ltd.',
    shortCode: 'LF',
    logo: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=200&q=80',
    type: 'Packaging & Tooling Supplier',
    category: 'Bottles, Jars & Droppers',
    location: 'Peenya Industrial Estate Phase-I',
    city: 'Bengaluru',
    state: 'Karnataka',
    isVerified: true,
    isGstVerified: true,
    trustScore: 95,
    responseRate: '< 3 hrs (95%)',
    mutualConnections: 19,
    followersCount: '2.9k',
    connectedSince: 'Mar 2024',
    specialties: ['Amber Glass Dropper 30ml', 'Airless Pump Dispensers 50ml', 'Frosted Jars'],
    isFollowingBack: false,
    activeRFQsCount: 1
  },
  {
    id: 'seller_radiant_004',
    name: 'Radiant Botanicals & Extracts',
    shortCode: 'RB',
    logo: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=200&q=80',
    type: 'Raw Materials & Botanicals',
    category: 'Active Botanical Extracts',
    location: 'Kakkanad Special Economic Zone',
    city: 'Kochi',
    state: 'Kerala',
    isVerified: true,
    isGstVerified: true,
    trustScore: 97,
    responseRate: '< 2 hrs (97%)',
    mutualConnections: 42,
    followersCount: '5.1k',
    connectedSince: 'Nov 2023',
    specialties: ['Gotu Kola Extract 95%', 'Bakuchiol Oil 99%', 'Cold-Pressed Moringa'],
    isFollowingBack: true
  },
  {
    id: 'seller_pureessence_005',
    name: 'PureEssence Essential Distillers',
    shortCode: 'PE',
    logo: 'https://images.unsplash.com/photo-1608248597359-52e1eb704179?auto=format&fit=crop&w=200&q=80',
    type: 'Essential Oil Distiller & OEM',
    category: 'Essential Oils & Fragrances',
    location: 'SIDCUL Haridwar Industrial Area',
    city: 'Haridwar',
    state: 'Uttarakhand',
    isVerified: true,
    isGstVerified: true,
    trustScore: 94,
    responseRate: '< 4 hrs (92%)',
    mutualConnections: 15,
    followersCount: '1.9k',
    connectedSince: 'Apr 2024',
    specialties: ['Steam-Distilled Rose Water', 'Organic Lavender Hydrosol', 'Therapeutic Oils'],
    isFollowingBack: false
  },
  {
    id: 'seller_glampack_006',
    name: 'GlamPack Sustainable Tooling Co.',
    shortCode: 'GP',
    logo: 'https://images.unsplash.com/photo-1556228722-d9b32f913d96?auto=format&fit=crop&w=200&q=80',
    type: 'Eco Packaging Manufacturer',
    category: 'Biodegradable Tubes & Jars',
    location: 'Okhla Industrial Area Phase-II',
    city: 'New Delhi',
    state: 'Delhi NCR',
    isVerified: true,
    isGstVerified: true,
    trustScore: 93,
    responseRate: '< 2 hrs (96%)',
    mutualConnections: 22,
    followersCount: '3.1k',
    connectedSince: 'May 2024',
    specialties: ['PCR Recycled Tubes', 'Bamboo Cap Closures', 'Aluminum Compacts'],
    isFollowingBack: true
  },
  {
    id: 'seller_novapharma_007',
    name: 'NovaPharma Clinical Cosmeceuticals',
    shortCode: 'NP',
    logo: 'https://images.unsplash.com/photo-1576426863848-c21f53c60b19?auto=format&fit=crop&w=200&q=80',
    type: 'Dermatological Formulator',
    category: 'Clinical Peels & Sunscreens',
    location: 'Genome Valley Bio-Park',
    city: 'Hyderabad',
    state: 'Telangana',
    isVerified: true,
    isGstVerified: true,
    trustScore: 99,
    responseRate: '< 1 hr (99%)',
    mutualConnections: 51,
    followersCount: '6.4k',
    connectedSince: 'Dec 2023',
    specialties: ['Encapsulated Retinal 0.2%', 'Invisible Broad Spectrum SPF 50+', 'Azelaic Acid 15%'],
    isFollowingBack: true,
    activeRFQsCount: 4
  },
  {
    id: 'seller_apex_008',
    name: 'Apex Salon Machines & Equipment',
    shortCode: 'AS',
    logo: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=200&q=80',
    type: 'Equipment Importer & Distributor',
    category: 'Salon Furniture & Lasers',
    location: 'Mayapuri Industrial Area',
    city: 'New Delhi',
    state: 'Delhi NCR',
    isVerified: true,
    isGstVerified: true,
    trustScore: 92,
    responseRate: '< 3 hrs (93%)',
    mutualConnections: 12,
    followersCount: '1.6k',
    connectedSince: 'Jun 2024',
    specialties: ['Hydra-Facial Workstations', 'Diode Laser Hair Removal', 'Styling Stations'],
    isFollowingBack: false
  }
];

interface FollowerNetworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateSupplier?: (supplierId: string) => void;
  onSendRFQ?: (supplierName?: string) => void;
  onSendMessage?: (supplierId: string) => void;
}

export const FollowerNetworkModal: React.FC<FollowerNetworkModalProps> = ({
  isOpen,
  onClose,
  onNavigateSupplier,
  onSendRFQ,
  onSendMessage
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<'all' | 'manufacturers' | 'oem' | 'packaging' | 'formulators'>('all');
  const [followersList, setFollowersList] = useState<FollowerSupplier[]>(INITIAL_FOLLOWERS_LIST);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleToggleFollow = (id: string, name: string) => {
    setFollowersList(prev =>
      prev.map(item => {
        if (item.id === id) {
          const nextState = !item.isFollowingBack;
          showToast(nextState ? `You are now following ${name}` : `Unfollowed ${name}`);
          return { ...item, isFollowingBack: nextState };
        }
        return item;
      })
    );
  };

  const filteredFollowers = followersList.filter(item => {
    // Search query matching
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      item.name.toLowerCase().includes(query) ||
      item.city.toLowerCase().includes(query) ||
      item.state.toLowerCase().includes(query) ||
      item.type.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.specialties.some(s => s.toLowerCase().includes(query));

    // Category tab filtering
    let matchesCategory = true;
    if (selectedCategoryTab === 'manufacturers') {
      matchesCategory = item.type.toLowerCase().includes('manufacturer') || item.type.toLowerCase().includes('distiller');
    } else if (selectedCategoryTab === 'oem') {
      matchesCategory = item.type.toLowerCase().includes('oem') || item.type.toLowerCase().includes('contract');
    } else if (selectedCategoryTab === 'packaging') {
      matchesCategory = item.type.toLowerCase().includes('packaging') || item.category.toLowerCase().includes('bottles');
    } else if (selectedCategoryTab === 'formulators') {
      matchesCategory = item.type.toLowerCase().includes('formulator') || item.type.toLowerCase().includes('raw materials') || item.category.toLowerCase().includes('skincare');
    }

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-60 bg-[#2A0E3F] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-2xl border border-stone-700 flex items-center gap-2 animate-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-[#8236A0]" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-[#E8DEEF] overflow-hidden flex flex-col max-h-[90vh] text-left animate-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-[#2A0E3F] via-[#2d121f] to-[#2A0E3F] text-white p-5 sm:p-6 relative shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6B2D8C] to-[#8236A0] text-white flex items-center justify-center shadow-lg shadow-[#6B2D8C]/30 shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">Connected Network & Followers</h2>
                  <span className="px-2 py-0.5 rounded-full bg-[#6B2D8C] text-white text-[10px] font-black uppercase tracking-wider">
                    1,481 Total
                  </span>
                </div>
                <p className="text-xs text-stone-300 font-medium mt-0.5">
                  Verified beauty manufacturers, OEM formulators & packaging suppliers connected with your profile.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              type="button"
              aria-label="Close modal"
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Metrics Bar inside Header */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-5 pt-4 border-t border-white/10 text-xs">
            <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
              <div className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">Verified Suppliers</div>
              <div className="text-sm sm:text-base font-extrabold text-white mt-0.5">1,240 <span className="text-[10px] text-emerald-400 font-normal">(84%)</span></div>
            </div>
            <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
              <div className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">Mutual Sourcing</div>
              <div className="text-sm sm:text-base font-extrabold text-white mt-0.5">342 Connections</div>
            </div>
            <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
              <div className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">Active RFQ Bids</div>
              <div className="text-sm sm:text-base font-extrabold text-[#8236A0] mt-0.5">48 Active Live</div>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTER CONTROLS */}
        <div className="p-4 sm:px-6 bg-[#FDFBF7] border-b border-[#E8DEEF] space-y-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-[#7E6C96] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search followers by company, city (Mumbai, Ahmedabad...), specialty or material..."
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#E8DEEF] focus:border-[#C9A961] rounded-xl text-xs text-[#2A0E3F] placeholder:text-[#B9A8C6] focus:outline-none transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1 cursor-pointer text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {[
              { id: 'all', label: 'All Followers (1,481)' },
              { id: 'manufacturers', label: 'Manufacturers (640)' },
              { id: 'oem', label: 'OEM & Private Label (420)' },
              { id: 'packaging', label: 'Packaging (280)' },
              { id: 'formulators', label: 'Labs & Actives (141)' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategoryTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategoryTab === tab.id
                    ? 'bg-[#6B2D8C] text-white shadow-xs'
                    : 'bg-white border border-[#E8DEEF] text-[#5B4A6E] hover:bg-[#F4F0E9] hover:text-[#2A0E3F]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* FOLLOWER LIST BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1 divide-y divide-[#F4F0E9]">
          {filteredFollowers.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#F5EEF8] text-[#6B2D8C] flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#2A0E3F]">No matching followers found</h4>
                <p className="text-xs text-[#7E6C96] mt-1 max-w-sm mx-auto">
                  Try adjusting your search keywords or filter tab to view more verified beauty suppliers.
                </p>
              </div>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategoryTab('all');
                }}
                className="px-4 py-2 bg-[#FDFBF7] border border-[#E8DEEF] hover:border-[#6B2D8C] text-xs font-bold text-[#6B2D8C] rounded-xl transition-all cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredFollowers.map((item, idx) => (
              <div
                key={item.id}
                className={`pt-3.5 first:pt-0 transition-all ${
                  idx > 0 ? 'mt-3.5' : ''
                }`}
              >
                <div className="bg-[#FDFBF7] hover:bg-white border border-[#E8DEEF] hover:border-[#6B2D8C]/40 hover:shadow-md rounded-2xl p-4 sm:p-5 transition-all space-y-3.5 group">
                  
                  {/* Top Row: Avatar, Name, Badges, Follow Toggle */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={item.logo}
                          alt={item.name}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border border-[#E8DEEF] shadow-xs"
                        />
                        {item.isVerified && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-emerald-200 flex items-center justify-center shadow-xs">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            onClick={() => onNavigateSupplier?.(item.id)}
                            className="text-xs sm:text-sm font-extrabold text-[#2A0E3F] hover:text-[#6B2D8C] transition-colors cursor-pointer truncate"
                          >
                            {item.name}
                          </h3>
                          {item.isGstVerified && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase">
                              GST Verified
                            </span>
                          )}
                          {item.trustScore >= 95 && (
                            <span className="px-1.5 py-0.2 rounded bg-purple-50 text-[#6B2D8C] border border-purple-200 text-[9px] font-black uppercase flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              {item.trustScore}% Score
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-xs text-[#5B4A6E] flex-wrap">
                          <span className="font-bold text-[#6B2D8C] text-[11px] uppercase tracking-wider">{item.type}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-[11px] text-[#7E6C96]">
                            <MapPin className="w-3 h-3 text-[#6B2D8C] shrink-0" />
                            <span>{item.location}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Follow Back Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleFollow(item.id, item.name)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 shrink-0 border ${
                        item.isFollowingBack
                          ? 'bg-[#F5EEF8] border-[#6B2D8C]/30 text-[#6B2D8C] hover:bg-[#fbc5e3]'
                          : 'bg-white border-[#E8DEEF] text-[#2A0E3F] hover:border-[#6B2D8C] hover:text-[#6B2D8C]'
                      }`}
                    >
                      {item.isFollowingBack ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#6B2D8C]" />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5 text-[#7E6C96]" />
                          <span>Follow Back</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Specialties Pills */}
                  {item.specialties && item.specialties.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] font-bold text-[#7E6C96] uppercase tracking-wider">Specialties:</span>
                      {item.specialties.map((spec, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2 py-0.5 bg-white border border-[#E8DEEF] rounded-lg text-[10px] font-semibold text-[#2A0E3F]"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Bottom Metas & Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#E8DEEF] text-xs flex-wrap gap-2">
                    <div className="flex items-center gap-3 text-[11px] text-[#7E6C96] flex-wrap">
                      <span className="font-semibold text-[#2A0E3F]">
                        {item.mutualConnections} mutual connections
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-emerald-700 font-bold">
                        <Clock className="w-3 h-3" />
                        <span>SLA: {item.responseRate}</span>
                      </span>
                      <span>•</span>
                      <span>Connected {item.connectedSince}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onSendMessage?.(item.id);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-white border border-[#E8DEEF] hover:border-[#6B2D8C] text-[#2A0E3F] hover:text-[#6B2D8C] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#6B2D8C]" />
                        <span>Chat</span>
                      </button>

                      <button
                        onClick={() => {
                          onSendRFQ?.(item.name);
                          onClose();
                        }}
                        className="px-3.5 py-1.5 bg-[#6B2D8C] hover:bg-[#4A2560] text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send RFQ</span>
                      </button>

                      <button
                        onClick={() => {
                          onNavigateSupplier?.(item.id);
                          onClose();
                        }}
                        className="p-1.5 text-[#7E6C96] hover:text-[#6B2D8C] hover:bg-[#F5EEF8] rounded-xl transition-all cursor-pointer"
                        title="View Full Profile"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            ))
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="bg-[#FDFBF7] p-4 sm:px-6 border-t border-[#E8DEEF] flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="text-[#7E6C96] font-medium text-[11px]">
            Showing <span className="font-bold text-[#2A0E3F]">{filteredFollowers.length}</span> of 1,481 connected beauty suppliers
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-[#E8DEEF] hover:bg-[#F4F0E9] text-[#2A0E3F] rounded-xl font-bold transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
