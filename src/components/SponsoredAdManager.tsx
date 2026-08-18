import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, Plus, Play, Pause, Edit3, Trash2, Eye, DollarSign, TrendingUp, 
  Target, Calendar, Image as ImageIcon, Upload, Check, AlertCircle, RefreshCw, 
  Layers, Tag, CheckCircle2, Search, ArrowRight, ShieldCheck, Wallet, ChevronRight, X, Film, Video, Link
} from 'lucide-react';
import { 
  AdCampaignItem, 
  getStoredCampaigns, 
  saveSingleCampaign, 
  toggleCampaignStatus, 
  deleteCampaignFromStore, 
  getAdAccountBalance, 
  addAdAccountBalance 
} from '../data/sponsoredCampaignsStore';
import { SPONSORED_PRODUCTS_DB } from '../data/sponsoredProductsData';
import { SponsoredVideoItem, VideoPlatform } from '../types';
import { saveSponsoredReel, saveSponsoredFullVideo, detectPlatformFromUrl } from '../data/sponsoredReelsData';

interface SponsoredAdManagerProps {
  supplierId?: string;
  supplierName?: string;
  onNavigateToProduct?: (productId: string) => void;
}

const PRESET_SAMPLE_IMAGES = [
  { label: 'Vitamin C Glow Serum', url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80' },
  { label: 'Hyaluronic Barrier Cream', url: 'https://images.unsplash.com/photo-1608248597359-052445bfa3d0?auto=format&fit=crop&w=800&q=80' },
  { label: 'Salon Spa Hair Kit', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80' },
  { label: 'Dermatology Scalp Tonic', url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80' },
  { label: 'Amber Glass Dropper Packaging', url: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80' },
  { label: 'Organic Rosewater Mist', url: 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=800&q=80' }
];

export const SponsoredAdManager: React.FC<SponsoredAdManagerProps> = ({
  supplierId = 'seller_aura_001',
  supplierName = 'Aura Beauty Labs',
  onNavigateToProduct
}) => {
  const [campaigns, setCampaigns] = useState<AdCampaignItem[]>([]);
  const [balance, setBalance] = useState<number>(12450);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused' | 'draft'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [previewModalCampaign, setPreviewModalCampaign] = useState<AdCampaignItem | null>(null);
  const [previewTab, setPreviewTab] = useState<'homepage' | 'search_results' | 'category_page'>('homepage');

  // Top up state
  const [topUpAmount, setTopUpAmount] = useState<number>(2500);

  // Campaign Form State
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formObjective, setFormObjective] = useState<AdCampaignItem['objective']>('Boost Product Sales');
  const [formTargetType, setFormTargetType] = useState<'product' | 'profile'>('product');
  const [formProductId, setFormProductId] = useState('product_vitc_101');
  const [formHeadline, setFormHeadline] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formImageUrl, setFormImageUrl] = useState(PRESET_SAMPLE_IMAGES[0].url);
  const [formCtaText, setFormCtaText] = useState<AdCampaignItem['ctaText']>('Get Quote');
  const [formCategories, setFormCategories] = useState<string[]>(['Skincare']);
  const [formKeywordsInput, setFormKeywordsInput] = useState('serum, vitamin c, bulk, oem');
  const [formDailyBudget, setFormDailyBudget] = useState<number>(500);
  const [formTotalBudget, setFormTotalBudget] = useState<number>(5000);
  const [formIsContinuous, setFormIsContinuous] = useState(true);
  const [formStartDate, setFormStartDate] = useState('2026-08-18');
  const [formEndDate, setFormEndDate] = useState('2026-09-18');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);

  // Video Publishing State (Reels & Full Videos)
  const [showReelModal, setShowReelModal] = useState(false);
  const [reelMediaType, setReelMediaType] = useState<'reel_or_short' | 'full_video'>('reel_or_short');
  const [selectedVideoProductId, setSelectedVideoProductId] = useState<string>('product_vitc_101');
  const [reelUrlInput, setReelUrlInput] = useState('');
  const [reelPlatform, setReelPlatform] = useState<VideoPlatform>('YouTube');
  const [reelTitle, setReelTitle] = useState('');
  const [reelDescription, setReelDescription] = useState('');
  const [reelPosterUrl, setReelPosterUrl] = useState(PRESET_SAMPLE_IMAGES[0].url);
  const [reelDuration, setReelDuration] = useState('0:30');
  const [reelNotice, setReelNotice] = useState<string | null>(null);
  const [reelManualMode, setReelManualMode] = useState(false);

  const handleUrlPasteChange = (url: string) => {
    setReelUrlInput(url);
    if (!url.trim()) {
      setReelNotice(null);
      return;
    }

    const detected = detectPlatformFromUrl(url);
    setReelPlatform(detected.platform);

    if (detected.platform === 'YouTube' && detected.videoId) {
      const ytPoster = `https://img.youtube.com/vi/${detected.videoId}/hqdefault.jpg`;
      setReelPosterUrl(ytPoster);
      setReelTitle(`YouTube Video — ${supplierName}`);
      setReelDescription('Verified supplier product showcase video.');
      setReelNotice('Auto-imported video details from YouTube!');
      setReelManualMode(false);
    } else {
      setReelManualMode(true);
      setReelNotice("We couldn't automatically import all video details. Add the missing details manually.");
      if (!reelTitle) setReelTitle(`${detected.platform} Video — ${supplierName}`);
    }
  };

  const handlePublishReel = () => {
    if (!reelUrlInput.trim()) {
      alert('Please enter a valid social video URL.');
      return;
    }
    if (!reelTitle.trim()) {
      alert('Please enter a video title.');
      return;
    }

    const detected = detectPlatformFromUrl(reelUrlInput);

    const newVideoItem: SponsoredVideoItem = {
      video_ad_id: `vid-user-${Date.now()}`,
      advertiser_id: `adv_${supplierId}`,
      seller_id: supplierId,
      product_id: selectedVideoProductId || undefined,
      supplierName: supplierName,
      platform: detected.platform,
      source_url: reelUrlInput.trim(),
      embed_url: detected.embedUrl,
      media_type: reelMediaType,
      poster_url: reelPosterUrl,
      display_title: reelTitle,
      display_description: reelDescription,
      duration: reelDuration,
      status: 'active'
    };

    if (reelMediaType === 'full_video') {
      saveSponsoredFullVideo(newVideoItem);
      alert(`🎉 16:9 Full Video Ad published successfully! It is now live on the Homepage "Sponsored Supplier Videos" section.`);
    } else {
      saveSponsoredReel(newVideoItem);
      alert(`🎉 9:16 Reel / Short Video Ad published successfully! It is now live on the Homepage "Reels & Shorts" section.`);
    }

    setShowReelModal(false);
    setReelUrlInput('');
    setReelTitle('');
    setReelDescription('');
    setReelNotice(null);
  };

  // Load store on mount
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setCampaigns(getStoredCampaigns());
    setBalance(getAdAccountBalance());
  };

  // Filtered campaigns list
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
      const matchesQuery = c.campaignName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           c.adTitle.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesQuery;
    });
  }, [campaigns, filterStatus, searchQuery]);

  // Overall Stats
  const totalImpressions = useMemo(() => campaigns.reduce((acc, c) => acc + c.impressions, 0), [campaigns]);
  const totalClicks = useMemo(() => campaigns.reduce((acc, c) => acc + c.clicks, 0), [campaigns]);
  const totalSpent = useMemo(() => campaigns.reduce((acc, c) => acc + c.spentBudget, 0), [campaigns]);
  const activeCount = useMemo(() => campaigns.filter(c => c.status === 'active').length, [campaigns]);
  const overallCtr = useMemo(() => totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00', [totalImpressions, totalClicks]);

  // Handle open create form
  const handleOpenCreateModal = (campaignToEdit?: AdCampaignItem) => {
    if (campaignToEdit) {
      setEditingCampaignId(campaignToEdit.id);
      setFormName(campaignToEdit.campaignName);
      setFormObjective(campaignToEdit.objective);
      setFormTargetType(campaignToEdit.targetType);
      setFormProductId(campaignToEdit.product_id);
      setFormHeadline(campaignToEdit.adTitle);
      setFormSubtitle(campaignToEdit.subtitle);
      setFormImageUrl(campaignToEdit.imageUrl);
      setFormCtaText(campaignToEdit.ctaText);
      setFormCategories(campaignToEdit.targetCategories);
      setFormKeywordsInput(campaignToEdit.keywords.join(', '));
      setFormDailyBudget(campaignToEdit.dailyBudget);
      setFormTotalBudget(campaignToEdit.totalBudget);
      setFormIsContinuous(campaignToEdit.isContinuous);
      setFormStartDate(campaignToEdit.startDate);
      setFormEndDate(campaignToEdit.endDate);
    } else {
      setEditingCampaignId(null);
      setFormName('New Summer Beauty Promotion');
      setFormObjective('Boost Product Sales');
      setFormTargetType('product');
      setFormProductId('product_vitc_101');
      setFormHeadline('Clinical 20% Vitamin C Glow Serum Base');
      setFormSubtitle('WHO-GMP Manufactured Bulk Supply for Salon Chains & Distributors');
      setFormImageUrl(PRESET_SAMPLE_IMAGES[0].url);
      setFormCtaText('Get Quote');
      setFormCategories(['Skincare', 'OEM / Private Label']);
      setFormKeywordsInput('vitamin c, serum, bulk, oem, salon supply');
      setFormDailyBudget(500);
      setFormTotalBudget(5000);
      setFormIsContinuous(true);
      setFormStartDate('2026-08-18');
      setFormEndDate('2026-09-18');
    }
    setUploadedFileName(null);
    setFileUploadError(null);
    setShowCreateModal(true);
  };

  // Handle Image Upload simulation with auto-crop & validation (< 5MB)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFileUploadError('File size exceeds 5MB limit. Please upload an image under 5MB.');
      return;
    }

    setFileUploadError(null);
    setUploadedFileName(file.name);

    // Read file as object URL
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Toggle category pill in form
  const toggleCategory = (cat: string) => {
    if (formCategories.includes(cat)) {
      setFormCategories(formCategories.filter(c => c !== cat));
    } else {
      setFormCategories([...formCategories, cat]);
    }
  };

  // Save campaign (Draft or Launch)
  const handleSaveCampaign = (launchNow: boolean) => {
    if (!formName.trim() || !formHeadline.trim() || !formSubtitle.trim()) {
      alert('Please fill in Campaign Name, Headline, and Subtitle.');
      return;
    }

    const keywordsArray = formKeywordsInput
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    const newCampaign: AdCampaignItem = {
      id: editingCampaignId || `camp-${Date.now()}`,
      advertiser_id: `adv_${supplierId}`,
      seller_id: supplierId,
      product_id: formProductId,
      supplierName: supplierName,
      campaignName: formName,
      objective: formObjective,
      targetType: formTargetType,
      adTitle: formHeadline,
      subtitle: formSubtitle,
      imageUrl: formImageUrl,
      targetCategories: formCategories,
      keywords: keywordsArray,
      ctaText: formCtaText,
      dailyBudget: formDailyBudget,
      totalBudget: formTotalBudget,
      spentBudget: editingCampaignId ? (campaigns.find(c => c.id === editingCampaignId)?.spentBudget || 0) : 0,
      remainingBalance: formTotalBudget,
      impressions: editingCampaignId ? (campaigns.find(c => c.id === editingCampaignId)?.impressions || 0) : 0,
      clicks: editingCampaignId ? (campaigns.find(c => c.id === editingCampaignId)?.clicks || 0) : 0,
      ctr: editingCampaignId ? (campaigns.find(c => c.id === editingCampaignId)?.ctr || 0) : 0,
      startDate: formStartDate,
      endDate: formEndDate,
      isContinuous: formIsContinuous,
      status: launchNow ? 'active' : 'draft',
      createdAt: new Date().toISOString(),
      placements: ['homepage', 'search_results', 'category_page']
    };

    saveSingleCampaign(newCampaign);
    refreshData();
    setShowCreateModal(false);

    if (launchNow) {
      alert(`🎉 Campaign "${formName}" launched successfully! Your sponsored ad is now active across Nexora Luxe.`);
    } else {
      alert(`💾 Campaign draft "${formName}" saved.`);
    }
  };

  // Handle Status Toggle
  const handleToggleStatus = (id: string) => {
    toggleCampaignStatus(id);
    refreshData();
  };

  // Handle Delete
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this sponsored ad campaign?')) {
      deleteCampaignFromStore(id);
      refreshData();
    }
  };

  // Handle Top Up
  const handleConfirmTopUp = () => {
    addAdAccountBalance(topUpAmount);
    refreshData();
    setShowTopUpModal(false);
    alert(`Success! Added ₹${topUpAmount.toLocaleString('en-IN')} to your Ad Account Balance.`);
  };

  // Reach Estimations
  const estimatedImpressionsDaily = Math.round(formDailyBudget * 25);
  const estimatedClicksDaily = Math.round(formDailyBudget * 0.8);
  const estimatedRfqsWeekly = Math.round(formDailyBudget * 0.04);

  return (
    <div className="space-y-6 text-[#1c1b1b]">
      
      {/* HEADER BANNER WITH WALLET BALANCE */}
      <div className="bg-gradient-to-r from-stone-900 via-zinc-900 to-stone-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 max-w-2xl z-10">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#b90064]/20 border border-[#b90064]/40 text-[#f7c5e0]">
              <Sparkles className="w-4 h-4 text-[#f7c5e0]" />
            </span>
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#f7c5e0]">
              Nexora Luxe Sponsored Network
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight">
            Sponsored Ad Campaign Manager
          </h2>
          <p className="text-xs text-stone-300 leading-relaxed">
            Reach high-intent B2B salon chains, cosmetic brand buyers, and wholesale distributors with targeted sponsored product showcases across the homepage, search results, and category pages.
          </p>
        </div>

        {/* WALLET BALANCE & CTA */}
        <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-xl flex flex-col items-end gap-2 shrink-0 z-10 w-full md:w-auto">
          <div className="text-right w-full md:w-auto">
            <span className="text-[10px] uppercase font-bold text-stone-300 tracking-wider block">
              Ad Account Credit Balance
            </span>
            <span className="text-2xl font-black text-white block tracking-tight">
              ₹{balance.toLocaleString('en-IN')}.00
            </span>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setShowTopUpModal(true)}
              className="flex-1 md:flex-none bg-white text-[#1c1b1b] hover:bg-stone-100 font-bold text-xs px-3.5 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Wallet className="w-3.5 h-3.5 text-[#b90064]" />
              <span>Top Up Balance</span>
            </button>

            <button
              onClick={() => handleOpenCreateModal()}
              className="flex-1 md:flex-none bg-[#b90064] hover:bg-[#a00056] text-white font-bold text-xs px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>New Banner Ad</span>
            </button>

            <button
              onClick={() => {
                setReelMediaType('reel_or_short');
                setShowReelModal(true);
              }}
              className="flex-1 md:flex-none bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <Film className="w-4 h-4" />
              <span>Promote Reel (9:16)</span>
            </button>

            <button
              onClick={() => {
                setReelMediaType('full_video');
                setShowReelModal(true);
              }}
              className="flex-1 md:flex-none bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <Video className="w-4 h-4" />
              <span>Promote Full Video (16:9)</span>
            </button>
          </div>
        </div>
      </div>

      {/* OVERALL METRICS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 bg-white border border-[#e8e8e8] rounded-xl space-y-1">
          <span className="text-[10px] text-[#594047] font-bold uppercase tracking-wider block">
            Active Campaigns
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-950">{activeCount}</span>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
              Live Network
            </span>
          </div>
        </div>

        <div className="p-4 bg-white border border-[#e8e8e8] rounded-xl space-y-1">
          <span className="text-[10px] text-[#594047] font-bold uppercase tracking-wider block">
            Total Impressions
          </span>
          <span className="text-2xl font-black text-zinc-950">
            {totalImpressions.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="p-4 bg-white border border-[#e8e8e8] rounded-xl space-y-1">
          <span className="text-[10px] text-[#594047] font-bold uppercase tracking-wider block">
            Total Clicks
          </span>
          <span className="text-2xl font-black text-[#b90064]">
            {totalClicks.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="p-4 bg-white border border-[#e8e8e8] rounded-xl space-y-1">
          <span className="text-[10px] text-[#594047] font-bold uppercase tracking-wider block">
            Average CTR
          </span>
          <span className="text-2xl font-black text-emerald-600">
            {overallCtr}%
          </span>
        </div>

        <div className="p-4 bg-white border border-[#e8e8e8] rounded-xl space-y-1 col-span-2 lg:col-span-1">
          <span className="text-[10px] text-[#594047] font-bold uppercase tracking-wider block">
            Spent Budget
          </span>
          <span className="text-2xl font-black text-zinc-950">
            ₹{totalSpent.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white border border-[#e8e8e8] p-4 rounded-xl flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['all', 'active', 'paused', 'draft'] as const).map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap ${
                filterStatus === st
                  ? 'bg-[#b90064] text-white shadow-sm'
                  : 'bg-stone-100 text-[#594047] hover:bg-stone-200'
              }`}
            >
              {st === 'all' ? 'All Campaigns' : st}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#594047] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search campaign name or ad title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#fdf8f8] border border-[#e8e8e8] rounded-lg focus:outline-none focus:border-[#b90064]"
          />
        </div>
      </div>

      {/* CAMPAIGNS TABLE */}
      <div className="bg-white border border-[#e8e8e8] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-[#e8e8e8] text-[11px] font-bold uppercase tracking-wider text-[#594047]">
                <th className="p-3.5">Campaign Details</th>
                <th className="p-3.5">Objective</th>
                <th className="p-3.5">Daily / Total</th>
                <th className="p-3.5">Impressions</th>
                <th className="p-3.5">Clicks</th>
                <th className="p-3.5">CTR</th>
                <th className="p-3.5">Spent / Remaining</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-[#594047]">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Sparkles className="w-8 h-8 text-stone-300 mx-auto" />
                      <p className="font-bold text-sm text-zinc-800">No ad campaigns found</p>
                      <p className="text-xs text-[#594047]">Create a new sponsored ad campaign to start driving buyer RFQs and product inquiries.</p>
                      <button
                        onClick={() => handleOpenCreateModal()}
                        className="mt-2 bg-[#b90064] text-white font-bold text-xs px-4 py-2 rounded-lg"
                      >
                        Create First Campaign
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map(c => (
                  <tr key={c.id} className="hover:bg-stone-50/80 transition-colors">
                    
                    {/* Campaign Name & Banner Preview */}
                    <td className="p-3.5 max-w-xs">
                      <div className="flex items-center gap-3">
                        <img
                          src={c.imageUrl}
                          alt={c.adTitle}
                          className="w-12 h-10 object-cover rounded-lg border border-stone-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-zinc-900 truncate text-xs">{c.campaignName}</p>
                          <p className="text-[11px] text-[#594047] truncate">{c.adTitle}</p>
                        </div>
                      </div>
                    </td>

                    {/* Objective */}
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                        {c.objective}
                      </span>
                    </td>

                    {/* Budget */}
                    <td className="p-3.5 font-medium whitespace-nowrap">
                      <div>₹{c.dailyBudget}/day</div>
                      <div className="text-[10px] text-[#594047]">Total: ₹{c.totalBudget}</div>
                    </td>

                    {/* Impressions */}
                    <td className="p-3.5 font-bold text-zinc-900 whitespace-nowrap">
                      {c.impressions.toLocaleString('en-IN')}
                    </td>

                    {/* Clicks */}
                    <td className="p-3.5 font-bold text-[#b90064] whitespace-nowrap">
                      {c.clicks.toLocaleString('en-IN')}
                    </td>

                    {/* CTR */}
                    <td className="p-3.5 font-bold text-emerald-600 whitespace-nowrap">
                      {c.ctr}%
                    </td>

                    {/* Spent / Remaining */}
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-bold text-zinc-900">₹{c.spentBudget}</div>
                      <div className="text-[10px] text-[#594047]">Bal: ₹{c.remainingBalance}</div>
                    </td>

                    {/* Status */}
                    <td className="p-3.5 whitespace-nowrap">
                      {c.status === 'active' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Active
                        </span>
                      )}
                      {c.status === 'paused' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase">
                          Paused
                        </span>
                      )}
                      {c.status === 'paused_product_unavailable' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold uppercase" title="Linked product is unpublished, suspended, or missing">
                          Paused — Linked Product Unavailable
                        </span>
                      )}
                      {c.status === 'draft' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200 text-[10px] font-bold uppercase">
                          Draft
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Preview */}
                        <button
                          onClick={() => setPreviewModalCampaign(c)}
                          title="Preview Ad"
                          className="p-1.5 text-stone-600 hover:text-[#b90064] hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenCreateModal(c)}
                          title="Edit Campaign"
                          className="p-1.5 text-stone-600 hover:text-blue-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Pause / Play */}
                        {c.status !== 'draft' && (
                          <button
                            onClick={() => handleToggleStatus(c.id)}
                            title={c.status === 'active' ? 'Pause Campaign' : 'Resume Campaign'}
                            className="p-1.5 text-stone-600 hover:text-amber-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                          >
                            {c.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(c.id)}
                          title="Delete Campaign"
                          className="p-1.5 text-stone-600 hover:text-red-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* AD CREATOR & EDIT MODAL WITH LIVE INTERACTIVE MULTI-PLACEMENT PREVIEW */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
            
            {/* Modal Header */}
            <div className="p-4 md:p-5 border-b border-[#e8e8e8] flex items-center justify-between bg-stone-50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#fde7f3] border border-[#f7c5e0] flex items-center justify-center text-[#b90064]">
                  <Sparkles className="w-4 h-4 text-[#b90064]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-zinc-900">
                    {editingCampaignId ? 'Edit Sponsored Ad Campaign' : 'Create New Sponsored Ad Campaign'}
                  </h3>
                  <p className="text-xs text-[#594047]">Configure headline, visual assets, targeting, and live multi-placement preview.</p>
                </div>
              </div>

              <button
                onClick={() => setShowCreateModal(false)}
                className="text-stone-400 hover:text-zinc-800 p-1.5 rounded-lg hover:bg-stone-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Split 2-Column Layout (Form Left, Live Preview Right) */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* LEFT COLUMN: INPUT FORM (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* 1. Campaign Basics */}
                <div className="space-y-3 bg-[#fdf8f8] p-4 rounded-xl border border-[#e8e8e8]">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#b90064] flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    <span>1. Campaign Basics & Objective</span>
                  </h4>

                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1">Campaign Name</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Monsoon Vitamin C Serum Bulk Promotion"
                      className="w-full bg-white border border-[#e8e8e8] focus:border-[#b90064] focus:outline-none p-2.5 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1">Campaign Objective</label>
                    <select
                      value={formObjective}
                      onChange={(e) => setFormObjective(e.target.value as AdCampaignItem['objective'])}
                      className="w-full bg-white border border-[#e8e8e8] focus:border-[#b90064] focus:outline-none p-2.5 rounded-lg text-xs font-medium"
                    >
                      <option value="Boost Product Sales">Boost Product Sales & Bulk Orders</option>
                      <option value="Brand Awareness">Brand Awareness & Trust Building</option>
                      <option value="Lead Generation">Lead Generation for Contract Manufacturing</option>
                      <option value="OEM Sourcing Enquiries">OEM & Private Label Enquiries</option>
                    </select>
                  </div>
                </div>

                {/* 2. Destination Link Selection */}
                <div className="space-y-3 bg-[#fdf8f8] p-4 rounded-xl border border-[#e8e8e8]">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#b90064] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>2. Target Link & Product Destination</span>
                  </h4>

                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs font-bold text-zinc-800 cursor-pointer">
                      <input
                        type="radio"
                        name="targetType"
                        value="product"
                        checked={formTargetType === 'product'}
                        onChange={() => setFormTargetType('product')}
                        className="accent-[#b90064]"
                      />
                      <span>Specific Product Detail Page</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-bold text-zinc-800 cursor-pointer">
                      <input
                        type="radio"
                        name="targetType"
                        value="profile"
                        checked={formTargetType === 'profile'}
                        onChange={() => setFormTargetType('profile')}
                        className="accent-[#b90064]"
                      />
                      <span>Supplier Profile Page</span>
                    </label>
                  </div>

                  {formTargetType === 'product' && (
                    <div>
                      <label className="block text-xs font-bold text-zinc-800 mb-1">Select Product from Catalog</label>
                      <select
                        value={formProductId}
                        onChange={(e) => setFormProductId(e.target.value)}
                        className="w-full bg-white border border-[#e8e8e8] focus:border-[#b90064] focus:outline-none p-2.5 rounded-lg text-xs font-medium"
                      >
                        {Object.values(SPONSORED_PRODUCTS_DB).map(prod => (
                          <option key={prod.id} value={prod.id}>
                            {prod.title} ({prod.category} • {prod.priceRange})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* 3. Visual Banner Asset & Ad Copy */}
                <div className="space-y-3 bg-[#fdf8f8] p-4 rounded-xl border border-[#e8e8e8]">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#b90064] flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>3. Visual Banner & Ad Copy</span>
                  </h4>

                  {/* Drag and Drop File Picker */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1">Banner Image Asset</label>
                    
                    <div className="border-2 border-dashed border-stone-300 hover:border-[#b90064] bg-white rounded-xl p-4 text-center transition-colors relative cursor-pointer group">
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Upload className="w-6 h-6 text-stone-400 group-hover:text-[#b90064] mx-auto mb-1 transition-colors" />
                      <p className="text-xs font-bold text-zinc-800">
                        {uploadedFileName ? `Selected: ${uploadedFileName}` : 'Click or Drag & Drop Banner Asset'}
                      </p>
                      <p className="text-[10px] text-[#594047] mt-0.5">
                        Supports PNG, JPG, WebP up to 5MB (Auto-cropped & resized to 800x500px)
                      </p>
                    </div>

                    {fileUploadError && (
                      <p className="text-[11px] text-red-600 font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{fileUploadError}</span>
                      </p>
                    )}
                  </div>

                  {/* Preset Library or URL Paste */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#594047] mb-1">Or choose high-res asset preset:</label>
                    <div className="grid grid-cols-3 gap-2">
                      {PRESET_SAMPLE_IMAGES.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setFormImageUrl(img.url);
                            setUploadedFileName(null);
                          }}
                          className={`relative h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                            formImageUrl === img.url ? 'border-[#b90064] ring-2 ring-[#b90064]/20' : 'border-stone-200'
                          }`}
                        >
                          <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                          <span className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[9px] font-bold truncate px-1 py-0.5 text-center">
                            {img.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Headline & Subtitle */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1">Main Headline Title</label>
                    <input
                      type="text"
                      value={formHeadline}
                      onChange={(e) => setFormHeadline(e.target.value)}
                      placeholder="e.g. Professional 20% Vitamin C Glow Serum Base"
                      className="w-full bg-white border border-[#e8e8e8] focus:border-[#b90064] focus:outline-none p-2.5 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1">Short Description / Subtitle</label>
                    <input
                      type="text"
                      value={formSubtitle}
                      onChange={(e) => setFormSubtitle(e.target.value)}
                      placeholder="e.g. Bulk sourcing for salon chains & cosmetic brand distributors"
                      className="w-full bg-white border border-[#e8e8e8] focus:border-[#b90064] focus:outline-none p-2.5 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1">CTA Button Text</label>
                    <select
                      value={formCtaText}
                      onChange={(e) => setFormCtaText(e.target.value as AdCampaignItem['ctaText'])}
                      className="w-full bg-white border border-[#e8e8e8] focus:border-[#b90064] focus:outline-none p-2.5 rounded-lg text-xs font-medium"
                    >
                      <option value="Get Quote">Get Quote</option>
                      <option value="View Product">View Product</option>
                      <option value="Explore Brand">Explore Brand</option>
                      <option value="Request Sample">Request Sample</option>
                      <option value="Contact Supplier">Contact Supplier</option>
                    </select>
                  </div>
                </div>

                {/* 4. Target Categories & Keywords */}
                <div className="space-y-3 bg-[#fdf8f8] p-4 rounded-xl border border-[#e8e8e8]">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#b90064] flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    <span>4. Target Categories & Keywords</span>
                  </h4>

                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1.5">Target Buyer Categories</label>
                    <div className="flex flex-wrap gap-1.5">
                      {['Skincare', 'Haircare', 'OEM / Private Label', 'Color Cosmetics', 'Packaging', 'Salon Equipment'].map(cat => {
                        const isSelected = formCategories.includes(cat);
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => toggleCategory(cat)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#b90064] text-white shadow-xs'
                                : 'bg-white text-[#594047] border border-stone-200 hover:bg-stone-100'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1">Target Keywords (Comma Separated)</label>
                    <input
                      type="text"
                      value={formKeywordsInput}
                      onChange={(e) => setFormKeywordsInput(e.target.value)}
                      placeholder="e.g. vitamin c, serum base, bulk formulation, salon supply"
                      className="w-full bg-white border border-[#e8e8e8] focus:border-[#b90064] focus:outline-none p-2.5 rounded-lg text-xs"
                    />
                  </div>
                </div>

                {/* 5. Budget & Duration */}
                <div className="space-y-3 bg-[#fdf8f8] p-4 rounded-xl border border-[#e8e8e8]">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#b90064] flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>5. Budget Controls & Duration</span>
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-800 mb-1">Daily Budget (₹)</label>
                      <input
                        type="number"
                        step="50"
                        min="100"
                        value={formDailyBudget}
                        onChange={(e) => setFormDailyBudget(Number(e.target.value))}
                        className="w-full bg-white border border-[#e8e8e8] focus:border-[#b90064] focus:outline-none p-2.5 rounded-lg text-xs font-bold text-zinc-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-800 mb-1">Total Budget Cap (₹)</label>
                      <input
                        type="number"
                        step="500"
                        min="500"
                        value={formTotalBudget}
                        onChange={(e) => setFormTotalBudget(Number(e.target.value))}
                        className="w-full bg-white border border-[#e8e8e8] focus:border-[#b90064] focus:outline-none p-2.5 rounded-lg text-xs font-bold text-zinc-900"
                      />
                    </div>
                  </div>

                  {/* Reach Calculator Widget */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 space-y-1">
                    <span className="font-extrabold uppercase tracking-wider text-[10px] text-emerald-700 block">
                      Estimated Daily Buyer Reach
                    </span>
                    <div className="flex items-center justify-between font-bold">
                      <span>Est. Daily Impressions: ~{estimatedImpressionsDaily.toLocaleString('en-IN')}</span>
                      <span>Est. Daily Clicks: ~{estimatedClicksDaily}</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 italic">
                      Projected ~{estimatedRfqsWeekly} direct buyer RFQ inquiries per week.
                    </p>
                  </div>

                  {/* Duration */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-zinc-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formIsContinuous}
                        onChange={(e) => setFormIsContinuous(e.target.checked)}
                        className="accent-[#b90064]"
                      />
                      <span>Continuous Run (Run until total budget cap is exhausted)</span>
                    </label>

                    {!formIsContinuous && (
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-bold text-[#594047]">Start Date</label>
                          <input
                            type="date"
                            value={formStartDate}
                            onChange={(e) => setFormStartDate(e.target.value)}
                            className="w-full bg-white border border-[#e8e8e8] p-2 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[#594047]">End Date</label>
                          <input
                            type="date"
                            value={formEndDate}
                            onChange={(e) => setFormEndDate(e.target.value)}
                            className="w-full bg-white border border-[#e8e8e8] p-2 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: LIVE INTERACTIVE MULTI-PLACEMENT PREVIEW (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="sticky top-0 bg-[#fdf8f8] text-[#1c1b1b] rounded-2xl p-4 shadow-sm border border-[#e8dfe3] space-y-4">
                  
                  {/* Preview Header & Tabs */}
                  <div className="flex items-center justify-between border-b border-[#e8dfe3] pb-3">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#b90064]">
                      <Eye className="w-4 h-4 text-[#b90064]" />
                      <span>Live Multi-Placement Preview</span>
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                      Real-time
                    </span>
                  </div>

                  {/* Placement Switcher Tabs */}
                  <div className="grid grid-cols-3 gap-1 bg-stone-100 p-1 rounded-xl text-[11px] font-bold border border-stone-200">
                    <button
                      type="button"
                      onClick={() => setPreviewTab('homepage')}
                      className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                        previewTab === 'homepage' ? 'bg-[#b90064] text-white shadow-sm' : 'text-[#594047] hover:text-[#1c1b1b]'
                      }`}
                    >
                      Homepage
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab('search_results')}
                      className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                        previewTab === 'search_results' ? 'bg-[#b90064] text-white shadow-sm' : 'text-[#594047] hover:text-[#1c1b1b]'
                      }`}
                    >
                      Search Result
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab('category_page')}
                      className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                        previewTab === 'category_page' ? 'bg-[#b90064] text-white shadow-sm' : 'text-[#594047] hover:text-[#1c1b1b]'
                      }`}
                    >
                      Category Page
                    </button>
                  </div>

                  {/* PREVIEW CONTAINER BASED ON TAB */}
                  <div className="bg-stone-100 p-3 rounded-xl border border-stone-200 min-h-[220px] flex items-center justify-center">
                    
                    {/* 1. HOMEPAGE MARQUEE CARD PREVIEW */}
                    {previewTab === 'homepage' && (
                      <div className="w-full max-w-[320px] h-[200px] bg-white rounded-2xl overflow-hidden relative shadow-lg flex flex-col justify-between border border-[#e8e8e8]">
                        <img
                          src={formImageUrl}
                          alt={formHeadline}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

                        {/* Top Badge */}
                        <div className="relative z-10 p-3 flex justify-between items-start">
                          <span className="bg-[#b90064] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs tracking-wider">
                            Sponsored
                          </span>
                        </div>

                        {/* Bottom Text & CTA */}
                        <div className="relative z-10 p-3.5 text-white space-y-1">
                          <p className="text-[10px] font-bold text-[#f7c5e0] uppercase tracking-wide">
                            {supplierName}
                          </p>
                          <h5 className="text-xs font-extrabold text-white leading-tight truncate">
                            {formHeadline || 'Ad Headline Title'}
                          </h5>
                          <p className="text-[10px] text-stone-200 truncate">
                            {formSubtitle || 'Ad Short Description / Subtitle'}
                          </p>
                          <div className="pt-1.5">
                            <span className="inline-block bg-[#b90064] text-white text-[10px] font-bold px-3 py-1 rounded-lg">
                              {formCtaText}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2. SEARCH RESULTS BANNER PREVIEW */}
                    {previewTab === 'search_results' && (
                      <div className="w-full bg-white rounded-xl p-3 border border-stone-200 text-[#1c1b1b] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded uppercase">
                            Sponsored In-Feed Ad
                          </span>
                          <span className="text-[10px] font-bold text-[#b90064]">{supplierName}</span>
                        </div>

                        <div className="flex gap-3 items-center">
                          <img
                            src={formImageUrl}
                            alt="preview"
                            className="w-16 h-16 object-cover rounded-lg border border-stone-200 shrink-0"
                          />
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <h5 className="text-xs font-bold text-zinc-900 truncate">
                              {formHeadline || 'Ad Headline Title'}
                            </h5>
                            <p className="text-[10px] text-[#594047] line-clamp-2">
                              {formSubtitle || 'Ad Short Description'}
                            </p>
                            <div className="pt-1 flex items-center justify-between">
                              <span className="text-[10px] font-bold text-emerald-700">GST Verified Manufacturer</span>
                              <span className="bg-[#b90064] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                                {formCtaText}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3. CATEGORY PAGE PLACEMENT PREVIEW */}
                    {previewTab === 'category_page' && (
                      <div className="w-full max-w-[240px] bg-white rounded-xl p-3 border border-stone-200 text-[#1c1b1b] space-y-2 text-center">
                        <span className="inline-block text-[9px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full uppercase">
                          Featured Category Sponsor
                        </span>
                        <img
                          src={formImageUrl}
                          alt="preview"
                          className="w-full h-24 object-cover rounded-lg border border-stone-100"
                        />
                        <h5 className="text-xs font-bold text-zinc-900 truncate">
                          {formHeadline || 'Ad Headline Title'}
                        </h5>
                        <p className="text-[10px] text-[#594047] truncate">
                          {supplierName}
                        </p>
                        <button className="w-full bg-[#b90064] text-white font-bold text-[10px] py-1.5 rounded-lg">
                          {formCtaText}
                        </button>
                      </div>
                    )}

                  </div>

                  {/* Summary Notes */}
                  <div className="text-[11px] text-[#594047] space-y-1 border-t border-[#e8dfe3] pt-3">
                    <p className="flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Linked Destination: <strong className="text-[#1c1b1b]">{formTargetType === 'product' ? 'Product Detail Page' : 'Supplier Profile'}</strong></span>
                    </p>
                    <p className="flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Target Categories: <strong className="text-[#1c1b1b]">{formCategories.join(', ')}</strong></span>
                    </p>
                  </div>

                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#e8e8e8] bg-stone-50 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
              <span className="text-xs text-[#594047] font-medium">
                Campaign will undergo instant validation before going live across the network.
              </span>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleSaveCampaign(false)}
                  className="flex-1 sm:flex-none bg-stone-100 hover:bg-stone-200 text-[#1c1b1b] font-bold text-xs px-4 py-2.5 rounded-xl border border-stone-300 transition-colors cursor-pointer"
                >
                  Save Draft
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveCampaign(true)}
                  className="flex-1 sm:flex-none bg-[#b90064] hover:bg-[#a00056] text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Launch Campaign</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOP UP BALANCE MODAL */}
      {/* ========================================================================= */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-[#b90064]" />
                <h3 className="font-extrabold text-base text-zinc-900">Top Up Ad Account Balance</h3>
              </div>
              <button onClick={() => setShowTopUpModal(false)} className="text-stone-400 hover:text-zinc-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-zinc-800">Select Top Up Amount (₹)</label>
              <div className="grid grid-cols-3 gap-2">
                {[1000, 2500, 5000, 10000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTopUpAmount(amt)}
                    className={`py-2.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      topUpAmount === amt
                        ? 'bg-[#b90064] text-white border-[#b90064] shadow-sm'
                        : 'bg-stone-50 text-zinc-800 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    + ₹{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Custom Amount (₹)</label>
                <input
                  type="number"
                  step="500"
                  min="500"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(Number(e.target.value))}
                  className="w-full bg-[#fdf8f8] border border-[#e8e8e8] focus:border-[#b90064] focus:outline-none p-2.5 rounded-lg text-sm font-bold text-zinc-900"
                />
              </div>

              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs text-[#594047] space-y-1">
                <p className="flex justify-between">
                  <span>Current Balance:</span>
                  <strong className="text-zinc-900">₹{balance.toLocaleString('en-IN')}</strong>
                </p>
                <p className="flex justify-between font-bold text-zinc-900 border-t border-stone-200 pt-1">
                  <span>New Balance After Top Up:</span>
                  <strong className="text-[#b90064]">₹{(balance + topUpAmount).toLocaleString('en-IN')}</strong>
                </p>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowTopUpModal(false)}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-[#1c1b1b] font-bold text-xs py-2.5 rounded-xl border border-stone-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTopUp}
                className="flex-1 bg-[#b90064] hover:bg-[#a00056] text-white font-extrabold text-xs py-2.5 rounded-xl shadow-md"
              >
                Confirm Payment &amp; Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULL PREVIEW LIGHTBOX MODAL */}
      {/* ========================================================================= */}
      {previewModalCampaign && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-2xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#b90064]" />
                <h3 className="font-extrabold text-base text-zinc-900">Ad Campaign Live Preview</h3>
              </div>
              <button onClick={() => setPreviewModalCampaign(null)} className="text-stone-400 hover:text-zinc-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="w-full h-52 bg-white rounded-2xl overflow-hidden relative shadow-lg flex flex-col justify-between border border-[#e8e8e8]">
                <img
                  src={previewModalCampaign.imageUrl}
                  alt={previewModalCampaign.adTitle}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

                <div className="relative z-10 p-3.5 flex justify-between items-start">
                  <span className="bg-[#b90064] text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                    Sponsored
                  </span>
                </div>

                <div className="relative z-10 p-4 text-white space-y-1">
                  <p className="text-xs font-bold text-[#f7c5e0] uppercase tracking-wide">
                    {previewModalCampaign.supplierName}
                  </p>
                  <h4 className="text-sm font-black text-white leading-tight">
                    {previewModalCampaign.adTitle}
                  </h4>
                  <p className="text-xs text-stone-200">
                    {previewModalCampaign.subtitle}
                  </p>
                  <div className="pt-2">
                    <span className="inline-block bg-[#b90064] text-white text-xs font-bold px-4 py-1.5 rounded-lg">
                      {previewModalCampaign.ctaText}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 text-xs space-y-1.5">
                <div className="flex justify-between text-[#594047]">
                  <span>Campaign Name:</span>
                  <strong className="text-zinc-900">{previewModalCampaign.campaignName}</strong>
                </div>
                <div className="flex justify-between text-[#594047]">
                  <span>Objective:</span>
                  <strong className="text-purple-700">{previewModalCampaign.objective}</strong>
                </div>
                <div className="flex justify-between text-[#594047]">
                  <span>Target Categories:</span>
                  <strong className="text-zinc-900">{previewModalCampaign.targetCategories.join(', ')}</strong>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setPreviewModalCampaign(null)}
                className="bg-stone-100 text-zinc-900 font-bold text-xs px-5 py-2 rounded-xl border border-stone-200"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REEL / FULL VIDEO PUBLISHING MODAL */}
      {showReelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 space-y-5 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                  reelMediaType === 'full_video' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                }`}>
                  {reelMediaType === 'full_video' ? <Video className="w-5 h-5" /> : <Film className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-stone-900">
                    {reelMediaType === 'full_video' ? 'Publish 16:9 Full Video Ad' : 'Publish 9:16 Reel / Short Video Ad'}
                  </h3>
                  <p className="text-xs text-stone-500 font-medium">
                    Import or paste video link from YouTube, Instagram, Facebook, X, or LinkedIn
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReelModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Paste Social Video URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-900 flex items-center justify-between">
                <span>Social Video / Reel URL <span className="text-red-500">*</span></span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                  {reelPlatform}
                </span>
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={reelUrlInput}
                  onChange={(e) => handleUrlPasteChange(e.target.value)}
                  placeholder="https://www.youtube.com/shorts/3P_YJ7rV2cE or Instagram, FB, X, LinkedIn"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#b90064] outline-none"
                />
              </div>
              <p className="text-[11px] text-stone-500">
                Supported platforms: YouTube Shorts, Instagram Reels, Facebook Reels, X video posts, LinkedIn video posts.
              </p>
            </div>

            {/* Auto-Fetch Notice Banner */}
            {reelNotice && (
              <div className={`p-3 rounded-xl border text-xs font-semibold flex items-start gap-2.5 ${
                reelManualMode 
                  ? 'bg-amber-50 border-amber-200 text-amber-900' 
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}>
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span>{reelNotice}</span>
                </div>
              </div>
            )}

            {/* Manual Edit / Metadata Fields */}
            <div className="space-y-4 pt-2 border-t border-stone-200">
              <h4 className="text-xs font-extrabold uppercase text-stone-500 tracking-wider">
                Display Metadata & Poster
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-800">Media Format</label>
                  <select
                    value={reelMediaType}
                    onChange={(e) => setReelMediaType(e.target.value as 'reel_or_short' | 'full_video')}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-800"
                  >
                    <option value="reel_or_short">9:16 Reel / Short</option>
                    <option value="full_video">16:9 Full Video</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-800">Linked Product</label>
                  <select
                    value={selectedVideoProductId}
                    onChange={(e) => setSelectedVideoProductId(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-800"
                  >
                    <option value="">Supplier-Level (No Product)</option>
                    {Object.values(SPONSORED_PRODUCTS_DB).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-800">Platform</label>
                  <select
                    value={reelPlatform}
                    onChange={(e) => setReelPlatform(e.target.value as VideoPlatform)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-800"
                  >
                    <option value="YouTube">YouTube</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Facebook">Facebook</option>
                    <option value="X">X (Twitter)</option>
                    <option value="LinkedIn">LinkedIn</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-800">
                  Video Display Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={reelTitle}
                  onChange={(e) => setReelTitle(e.target.value)}
                  placeholder="e.g. 20% Vitamin C Serum Lab Production Line"
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#b90064] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-800">Short Description</label>
                <textarea
                  rows={2}
                  value={reelDescription}
                  onChange={(e) => setReelDescription(e.target.value)}
                  placeholder="Short details about this formulation or factory tour..."
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#b90064] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-800">Poster Image URL (9:16)</label>
                  <input
                    type="url"
                    value={reelPosterUrl}
                    onChange={(e) => setReelPosterUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-800">Duration (optional)</label>
                  <input
                    type="text"
                    value={reelDuration}
                    onChange={(e) => setReelDuration(e.target.value)}
                    placeholder="e.g. 0:45"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              {/* Sample Poster Presets */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-600">Or Select Preset Poster:</label>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_SAMPLE_IMAGES.slice(0, 3).map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setReelPosterUrl(img.url)}
                      className={`relative h-16 rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                        reelPosterUrl === img.url ? 'border-[#b90064] ring-2 ring-[#b90064]/20' : 'border-stone-200'
                      }`}
                    >
                      <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] font-bold p-0.5 truncate text-center">
                        {img.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setShowReelModal(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePublishReel}
                className="px-5 py-2 bg-[#b90064] hover:bg-[#a00056] text-white text-xs font-extrabold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{reelMediaType === 'full_video' ? 'Publish Full Video Ad' : 'Publish Reel Ad'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
