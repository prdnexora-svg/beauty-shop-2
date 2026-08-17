import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClipboardList, 
  MessageSquare, 
  Bookmark, 
  Users, 
  Plus, 
  Search, 
  ChevronRight, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  BarChart3,
  ExternalLink,
  Phone,
  Mail,
  History,
  TrendingUp,
  LayoutDashboard,
  Bell,
  UserCheck,
  FileText,
  LayoutGrid,
  ShoppingBag,
  Package,
  ShieldCheck,
  MessageCircle,
  MoreVertical,
  ArrowRight,
  Settings,
  Edit3,
  Building2,
  Check,
  Globe
} from 'lucide-react';
import { BuyerEnquiry, BuyerRFQ, VerifiedSupplier } from '../types';
import { BUYER_MOCK_ENQUIRIES, BUYER_MOCK_RFQS, VERIFIED_SUPPLIERS } from '../data/mockData';
import { EditProfileModal, BuyerProfileData } from './EditProfileModal';

interface BuyerDashboardProps {
  isLoggedIn: boolean;
  onNavigate: (screen: any, params?: any) => void;
  onPostRFQ: () => void;
  onCallSupplier: (name: string) => void;
  onWhatsAppSupplier: (name: string) => void;
  onOpenAuth: () => void;
  buyerProfile?: BuyerProfileData;
  onSaveProfile?: (updated: BuyerProfileData) => void;
  onOpenEditProfile?: () => void;
}

export const BuyerDashboard: React.FC<BuyerDashboardProps> = ({ 
  isLoggedIn,
  onNavigate, 
  onPostRFQ,
  onCallSupplier,
  onWhatsAppSupplier,
  onOpenAuth,
  buyerProfile: propBuyerProfile,
  onSaveProfile: propOnSaveProfile,
  onOpenEditProfile: propOnOpenEditProfile
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'rfqs' | 'enquiries' | 'saved'>('overview');
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileToast, setProfileToast] = useState<string | null>(null);

  const [localBuyerProfile, setLocalBuyerProfile] = useState<BuyerProfileData>({
    fullName: 'Priya Sharma',
    businessName: 'Radiant Beauty Solutions',
    businessType: 'Salon / Spa',
    designation: 'Head of Procurement',
    email: 'priya.procurement@radiantbeauty.in',
    phone: '+91 98201 54321',
    alternatePhone: '+91 22 2650 4321',
    gstin: '27AAACR1234F1Z5',
    pancard: 'AAACR1234F',
    address: 'Plot No. 42, Bandra-Kurla Complex',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400051',
    annualProcurementBudget: '₹25 Lakhs - ₹1 Crore',
    primaryCategories: ['Skincare & Serums', 'Haircare & Treatments'],
    preferredDeliveryTimeline: '3 - 7 Days',
    whatsappAlerts: true,
    emailAlerts: true,
    isGstVerified: true,
    isBusinessVerified: true
  });

  const buyerProfile = propBuyerProfile || localBuyerProfile;

  const handleTriggerEditProfile = () => {
    if (propOnOpenEditProfile) {
      propOnOpenEditProfile();
    } else {
      setIsEditProfileOpen(true);
    }
  };

  const handleSaveProfile = (updatedData: BuyerProfileData) => {
    if (propOnSaveProfile) {
      propOnSaveProfile(updatedData);
    } else {
      setLocalBuyerProfile(updatedData);
    }
    setProfileComplete(true);
    setProfileToast('Profile & Business Settings updated successfully!');
    setTimeout(() => setProfileToast(null), 3000);
  };

  useEffect(() => {
    // Simulate initial loading for premium feel
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Stats for the overview (KPI Cards)
  const stats = [
    { label: 'Active RFQs', value: '08', icon: ClipboardList, color: '#b90064', trend: '+2 this week' },
    { label: 'New Quotes', value: '03', icon: BarChart3, color: '#0050d6', badge: true, trend: 'Action needed' },
    { label: 'Sent Enquiries', value: '14', icon: MessageSquare, color: '#e6007e', trend: '4 pending reply' },
    { label: 'Unread Messages', value: '02', icon: MessageCircle, color: '#1c1b1b', badge: true, trend: 'Aura Labs, LuxeForm' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-50 text-green-700 border-green-100';
      case 'Responded': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Quote Received': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'Negotiating': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Converted': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'Closed': return 'bg-gray-50 text-gray-700 border-gray-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  const SkeletonCard = () => (
    <div className="bg-white p-6 rounded-2xl border border-[#e8e8e8] animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="w-10 h-10 bg-gray-100 rounded-xl" />
        <div className="w-12 h-4 bg-gray-50 rounded" />
      </div>
      <div className="w-16 h-8 bg-gray-100 rounded mb-2" />
      <div className="w-24 h-3 bg-gray-50 rounded" />
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#fdf8f8]">
      {/* Header Section with Profile Details & Edit Button */}
      <header className="bg-white/80 backdrop-blur-md sticky top-20 z-30 border-b border-[#e8e8e8] px-4 md:px-10 py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer" onClick={handleTriggerEditProfile}>
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#b90064] to-[#e6007e] flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-[#b90064]/20 group-hover:opacity-90 transition-opacity overflow-hidden">
                {buyerProfile.avatarUrl ? (
                  <img src={buyerProfile.avatarUrl} alt={buyerProfile.fullName} className="w-full h-full object-cover" />
                ) : (
                  buyerProfile.fullName ? buyerProfile.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'PR'
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full border border-[#e8e8e8] text-[#b90064] shadow-xs">
                <Edit3 className="w-3 h-3" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-[#1c1b1b]">Welcome back, {buyerProfile.fullName.split(' ')[0]}</h1>
                {buyerProfile.isGstVerified && (
                  <span className="px-2 py-0.5 rounded-md bg-green-50 border border-green-200 text-green-700 text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-600" /> GST Verified Buyer
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[#594047] text-xs font-medium mt-0.5 flex-wrap">
                <span className="flex items-center gap-1 font-semibold text-[#1c1b1b]">
                  <Building2 className="w-3.5 h-3.5 text-[#b90064]" /> {buyerProfile.businessName}
                </span>
                <span className="w-1 h-1 rounded-full bg-gray-300 hidden sm:inline" />
                <span className="text-[#594047] hidden sm:inline">{buyerProfile.city}, {buyerProfile.state}</span>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span className="text-[#0050d6] font-mono">ID: NEX-B-2041</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Edit Profile / Business Settings Button */}
            <button
              onClick={handleTriggerEditProfile}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-[#e8e8e8] hover:border-[#b90064] text-[#1c1b1b] hover:text-[#b90064] rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              <Settings className="w-4 h-4 text-[#b90064]" />
              <span>Edit Profile & Settings</span>
            </button>

            <div className="relative hidden md:block">
              <button 
                title="Notifications"
                className="p-2.5 rounded-xl bg-[#fcf9f8] border border-[#e8e8e8] text-[#594047] hover:bg-white transition-all relative cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#b90064] rounded-full border-2 border-white" />
              </button>
            </div>

            <button 
              onClick={onPostRFQ}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-[#b90064] text-white rounded-xl text-xs font-extrabold shadow-md shadow-[#b90064]/25 hover:bg-[#8e004b] transition-all active:scale-95 group cursor-pointer"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              Post Requirement
            </button>
          </div>
        </div>
      </header>

      {/* Global Toast */}
      {profileToast && (
        <div className="fixed top-24 right-6 z-50 bg-[#1c1b1b] text-white px-4 py-3 rounded-xl shadow-xl border border-[#333] flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <span>{profileToast}</span>
        </div>
      )}

      <main className="flex-1 p-4 md:p-8 lg:p-10">
        <div className="max-w-7xl mx-auto space-y-10">
          
          {/* Profile Notice */}
          {!profileComplete && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-[#b90064]/20 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden shadow-sm"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-[#b90064]" />
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#fde7f3] flex items-center justify-center text-[#b90064]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1c1b1b]">Complete Your Buyer Profile</h3>
                  <p className="text-xs text-[#594047] mt-0.5">Upload GST and Business Proof to gain "Nexora Trusted Buyer" status and get priority quotes.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditProfileOpen(true)}
                className="px-5 py-2.5 bg-[#1c1b1b] text-white rounded-xl text-xs font-bold hover:bg-black transition-all cursor-pointer shadow-xs"
              >
                Complete Verification
              </button>
            </motion.div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {isLoading ? (
              [1, 2, 3, 4].map((_, i) => <SkeletonCard key={i} />)
            ) : (
              stats.map((stat, idx) => (
                <motion.div 
                  key={idx}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className="bg-white p-6 rounded-2xl border border-[#e8e8e8] shadow-xs hover:shadow-md transition-all relative overflow-hidden group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-[#fcf9f8] group-hover:bg-[#fde7f3] transition-colors">
                      <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                    </div>
                    {stat.badge && (
                      <span className="flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-[#b90064] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#b90064]"></span>
                      </span>
                    )}
                  </div>
                  <div className="text-3xl font-black text-[#1c1b1b] tracking-tight">{stat.value}</div>
                  <div className="text-[11px] font-bold text-[#8c7077] uppercase tracking-widest mt-1">{stat.label}</div>
                  <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-green-600">
                    <TrendingUp className="w-3 h-3" />
                    {stat.trend}
                  </div>
                </motion.div>
              ))
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-10">
            {/* Primary Workflow Column */}
            <div className="lg:col-span-2 space-y-10">
              
              {/* Active RFQs Section */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-[#1c1b1b] tracking-tight">Active RFQs</h2>
                    <span className="px-2 py-0.5 rounded-full bg-[#fde7f3] text-[#b90064] text-[10px] font-black uppercase">Live</span>
                  </div>
                  <button className="text-xs font-bold text-[#b90064] hover:underline flex items-center gap-1">
                    Manage All <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-4">
                  {BUYER_MOCK_RFQS.slice(0, 2).map((rfq) => (
                    <motion.div 
                      key={rfq.id}
                      whileHover={{ scale: 1.01 }}
                      className="bg-white border border-[#e8e8e8] rounded-2xl p-6 shadow-xs hover:shadow-md transition-all"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${getStatusColor(rfq.status)}`}>
                              {rfq.status}
                            </span>
                            <span className="text-[10px] font-bold text-[#8c7077] uppercase tracking-widest">{rfq.category}</span>
                          </div>
                          <h3 className="text-lg font-bold text-[#1c1b1b]">{rfq.title}</h3>
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-bold text-[#594047]">
                            <div className="flex items-center gap-1.5">
                              <Package className="w-3.5 h-3.5 text-[#b90064]" />
                              Qty: {rfq.quantity}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-[#0050d6]" />
                              {rfq.responsesCount} Supplier Responses
                            </div>
                            <div className="flex items-center gap-1.5">
                              <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
                              03 Quotes Received
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-row md:flex-col gap-2 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-[#f0edec] md:pl-8 min-w-[140px]">
                          <button className="flex-1 py-2.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-[11px] font-black text-[#1c1b1b] hover:bg-white transition-all">
                            View RFQ
                          </button>
                          <button className="flex-1 py-2.5 bg-[#b90064] text-white rounded-xl text-[11px] font-black shadow-sm hover:bg-[#8e004b] transition-all">
                            Compare Quotes
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Recent Enquiries Section */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-[#1c1b1b] tracking-tight">Recent Enquiries</h2>
                  <button className="text-xs font-bold text-[#b90064] hover:underline flex items-center gap-1">
                    Enquiry Log <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="bg-white border border-[#e8e8e8] rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-[#fcf9f8] border-b border-[#e8e8e8]">
                          <th className="px-6 py-4 text-[10px] font-black text-[#8c7077] uppercase tracking-widest">Product / Supplier</th>
                          <th className="px-6 py-4 text-[10px] font-black text-[#8c7077] uppercase tracking-widest text-center">Status</th>
                          <th className="px-6 py-4 text-[10px] font-black text-[#8c7077] uppercase tracking-widest text-center">Last Reply</th>
                          <th className="px-6 py-4 text-[10px] font-black text-[#8c7077] uppercase tracking-widest">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f0edec]">
                        {BUYER_MOCK_ENQUIRIES.slice(0, 3).map((enq) => (
                          <tr key={enq.id} className="hover:bg-[#fcf9f8]/50 transition-colors group">
                            <td className="px-6 py-5">
                              <div className="font-bold text-[13px] text-[#1c1b1b]">{enq.productName}</div>
                              <div className="text-[11px] text-[#8c7077] font-medium mt-0.5">{enq.supplierName}</div>
                            </td>
                            <td className="px-6 py-5 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-[9px] font-black border uppercase tracking-wider ${getStatusColor(enq.status)}`}>
                                {enq.status}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-center text-[11px] font-medium text-[#594047]">
                              {enq.date}
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-2">
                                <button className="p-2 text-[#8c7077] hover:text-[#b90064] hover:bg-[#fde7f3] rounded-lg transition-all" title="Message">
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => onCallSupplier(enq.supplierName)}
                                  className="p-2 text-[#8c7077] hover:text-[#0050d6] hover:bg-[#eef4ff] rounded-lg transition-all" title="Call"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </button>
                                <button className="p-2 text-[#8c7077] hover:text-[#1c1b1b] hover:bg-[#f0edec] rounded-lg transition-all" title="View">
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

            </div>

            {/* Side Information Column */}
            <div className="space-y-10">
              
              {/* Quick Navigation Panel */}
              <section className="bg-white border border-[#e8e8e8] rounded-2xl p-6 shadow-xs">
                <h3 className="text-xs font-black text-[#8c7077] uppercase tracking-widest mb-6">Quick Navigation</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Post RFQ', icon: FileText, color: '#b90064', action: onPostRFQ },
                    { label: 'Find Supplier', icon: Users, color: '#0050d6', action: () => onNavigate('supplier-directory') },
                    { label: 'Browse App', icon: LayoutGrid, color: '#1c1b1b', action: () => onNavigate('explore') },
                    { label: 'Explore OEM', icon: ShoppingBag, color: '#e6007e', action: () => onNavigate('oem-hub') },
                  ].map((btn, i) => (
                    <button 
                      key={i}
                      onClick={btn.action}
                      className="flex flex-col items-center justify-center p-4 rounded-xl border border-[#f0edec] hover:border-[#b90064]/30 hover:bg-[#fde7f3]/20 transition-all group"
                    >
                      <btn.icon className="w-5 h-5 mb-2 group-hover:scale-110 transition-transform" style={{ color: btn.color }} />
                      <span className="text-[10px] font-black text-[#1c1b1b] uppercase tracking-wider text-center">{btn.label}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Recent Messages */}
              <section className="bg-white border border-[#e8e8e8] rounded-2xl overflow-hidden shadow-xs">
                <div className="p-6 border-b border-[#f0edec] flex items-center justify-between">
                  <h3 className="text-sm font-black text-[#1c1b1b] tracking-tight">Recent Messages</h3>
                  <div className="w-5 h-5 rounded-full bg-[#b90064] text-white text-[10px] font-bold flex items-center justify-center">2</div>
                </div>
                <div className="divide-y divide-[#f0edec]">
                  {BUYER_MOCK_ENQUIRIES.slice(0, 3).map((msg, i) => (
                    <button 
                      key={i}
                      className="w-full p-5 text-left hover:bg-[#fcf9f8] transition-all flex items-center gap-4 group"
                    >
                      <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-[#fde7f3] flex items-center justify-center text-[#b90064] font-bold text-sm">
                          {msg.supplierName.charAt(0)}
                        </div>
                        {i === 0 && <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#b90064] rounded-full border-2 border-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[13px] font-bold text-[#1c1b1b] truncate">{msg.supplierName}</span>
                          <span className="text-[9px] font-medium text-[#8c7077]">2h ago</span>
                        </div>
                        <p className="text-[11px] text-[#594047] truncate pr-4 group-hover:text-[#1c1b1b] transition-colors">{msg.lastMessage}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <button className="w-full py-4 bg-[#fcf9f8] text-[11px] font-black text-[#b90064] uppercase tracking-widest hover:bg-[#fde7f3] transition-all">
                  Open Messenger Hub
                </button>
              </section>

              {/* Saved Items Preview (Bento Section) */}
              <section className="space-y-4">
                <h3 className="text-sm font-black text-[#1c1b1b] tracking-tight">Personal Shortlist</h3>
                <div className="space-y-3">
                  {/* Saved Supplier Card */}
                  <div className="bg-white border border-[#e8e8e8] rounded-2xl p-4 shadow-xs hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-8 h-8 rounded-lg bg-[#f0f4ff] flex items-center justify-center text-[#0050d6]">
                        <Users className="w-4 h-4" />
                      </div>
                      <Bookmark className="w-3.5 h-3.5 text-[#b90064] fill-current" />
                    </div>
                    <h4 className="text-[13px] font-bold text-[#1c1b1b]">Aura Labs & Manufacturing</h4>
                    <p className="text-[10px] text-[#8c7077] mb-3 flex items-center gap-1 font-medium">
                      <MapPin className="w-3 h-3 opacity-60" /> Mumbai, Maharashtra
                    </p>
                    <button className="w-full py-2 bg-[#fcf9f8] rounded-lg text-[10px] font-black text-[#1c1b1b] uppercase tracking-wider hover:bg-[#f0edec] transition-all">
                      View Business Profile
                    </button>
                  </div>

                  {/* Saved Product Card */}
                  <div className="bg-white border border-[#e8e8e8] rounded-2xl p-4 shadow-xs hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-8 h-8 rounded-lg bg-[#fde7f3] flex items-center justify-center text-[#b90064]">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <Bookmark className="w-3.5 h-3.5 text-[#b90064] fill-current" />
                    </div>
                    <h4 className="text-[13px] font-bold text-[#1c1b1b]">Vitamin C Serum (Bulk)</h4>
                    <div className="flex items-center justify-between mt-1 mb-3">
                      <span className="text-[10px] font-black text-[#b90064]">From ₹145 / unit</span>
                      <span className="text-[9px] font-bold text-[#8c7077]">MOQ: 500 Units</span>
                    </div>
                    <button className="w-full py-2 bg-[#1c1b1b] text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-black transition-all">
                      View Product
                    </button>
                  </div>
                </div>
              </section>

            </div>
          </div>
        </div>
      </main>

      {/* Mobile Sticky CTA */}
      <div className="md:hidden sticky bottom-6 left-0 right-0 px-4 z-40">
        <button 
          onClick={onPostRFQ}
          className="w-full py-4 bg-[#b90064] text-white rounded-2xl font-black text-sm shadow-2xl shadow-[#b90064]/50 flex items-center justify-center gap-3 animate-bounce-subtle"
        >
          <Plus className="w-5 h-5" />
          Post Requirement
        </button>
      </div>

      {/* Edit Profile & Business Settings Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        initialData={buyerProfile}
        onSave={handleSaveProfile}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 3s infinite ease-in-out;
        }
      `}} />
    </div>
  );
};
