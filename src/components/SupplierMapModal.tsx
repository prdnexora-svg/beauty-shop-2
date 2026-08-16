import React, { useState, useMemo } from 'react';
import {
  X,
  MapPin,
  Anchor,
  Plane,
  Building2,
  FlaskConical,
  Package,
  Train,
  Navigation,
  Compass,
  Check,
  Copy,
  Send,
  ShieldCheck,
  Zap,
  Clock,
  ThermometerSnowflake,
  FileCheck2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VerifiedSupplier, SearchSupplier, LogisticsHub } from '../types';

interface SupplierMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: VerifiedSupplier | SearchSupplier | null;
  onOpenEnquiry?: (supplier: any) => void;
}

export const SupplierMapModal: React.FC<SupplierMapModalProps> = ({
  isOpen,
  onClose,
  supplier,
  onOpenEnquiry
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'shipping' | 'raw_materials' | 'corridors'>('all');
  const [selectedHub, setSelectedHub] = useState<LogisticsHub | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [copiedCoords, setCopiedCoords] = useState(false);

  if (!isOpen || !supplier) return null;

  const location = supplier.locationDetails || {
    industrialZone: `${supplier.city} Manufacturing Zone`,
    fullAddress: `Plot Industrial Area, ${supplier.city}, ${supplier.state || 'India'}`,
    city: supplier.city,
    state: supplier.state || 'India',
    lat: 19.076,
    lng: 72.8777,
    shippingHubs: [
      {
        id: 'def-hub-1',
        name: `${supplier.city} Sea Cargo Terminal`,
        type: 'Port',
        distanceKm: 28,
        transitTime: '1.5 hrs direct freight',
        description: 'Direct maritime export container terminal',
        coords: { x: 35, y: 70 }
      },
      {
        id: 'def-hub-2',
        name: `${supplier.city} International Air Cargo`,
        type: 'Airport',
        distanceKm: 32,
        transitTime: '45 mins express transit',
        description: 'Bonded temperature-controlled air freight terminal',
        coords: { x: 65, y: 30 }
      }
    ],
    rawMaterialSources: [
      {
        id: 'def-mat-1',
        name: `${supplier.city} Bio-Active Ingredient Cluster`,
        type: 'Chemical Hub',
        distanceKm: 12,
        transitTime: '25 mins',
        category: 'Bio-Actives & Base Oils',
        description: 'Chemical & cosmetic active raw material producers',
        coords: { x: 45, y: 35 }
      }
    ],
    customsStatus: 'AEO Certified • Direct Port Delivery (DPD) Enabled',
    dispatchTurnaround: 'Same-day container dispatch to port gateway',
    coldChainAvailable: true,
    transitAdvantage: 'High-speed industrial belt with streamlined export terminal access'
  };

  const allHubs = useMemo(() => {
    return [...location.shippingHubs, ...location.rawMaterialSources];
  }, [location]);

  const filteredHubs = useMemo(() => {
    if (activeFilter === 'shipping') {
      return location.shippingHubs.filter((h) => h.type === 'Port' || h.type === 'Airport');
    }
    if (activeFilter === 'raw_materials') {
      return location.rawMaterialSources;
    }
    if (activeFilter === 'corridors') {
      return location.shippingHubs.filter((h) => h.type === 'Corridor' || h.type === 'Dry Port / ICD');
    }
    return allHubs;
  }, [activeFilter, location, allHubs]);

  const handleCopyCoordinates = () => {
    const textToCopy = `${location.fullAddress} [Coordinates: ${location.lat.toFixed(4)}° N, ${location.lng.toFixed(4)}° E]`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2200);
  };

  const getNodeIcon = (type: LogisticsHub['type']) => {
    switch (type) {
      case 'Port':
        return <Anchor className="w-3.5 h-3.5" />;
      case 'Airport':
        return <Plane className="w-3.5 h-3.5" />;
      case 'Dry Port / ICD':
        return <Train className="w-3.5 h-3.5" />;
      case 'Corridor':
        return <Navigation className="w-3.5 h-3.5" />;
      case 'Chemical Hub':
        return <FlaskConical className="w-3.5 h-3.5" />;
      case 'Packaging Cluster':
        return <Package className="w-3.5 h-3.5" />;
      default:
        return <MapPin className="w-3.5 h-3.5" />;
    }
  };

  const getNodeColor = (type: LogisticsHub['type'], isSelected: boolean) => {
    if (isSelected) {
      return 'bg-[#b90064] text-white border-white ring-4 ring-[#b90064]/30 shadow-lg';
    }
    switch (type) {
      case 'Port':
        return 'bg-[#0050d6] text-white border-white shadow-md hover:bg-[#003bb5]';
      case 'Airport':
        return 'bg-[#4f46e5] text-white border-white shadow-md hover:bg-[#4338ca]';
      case 'Dry Port / ICD':
        return 'bg-[#0284c7] text-white border-white shadow-md hover:bg-[#0369a1]';
      case 'Corridor':
        return 'bg-[#334155] text-white border-white shadow-md hover:bg-[#1e293b]';
      case 'Chemical Hub':
        return 'bg-[#d97706] text-white border-white shadow-md hover:bg-[#b45309]';
      case 'Packaging Cluster':
        return 'bg-[#059669] text-white border-white shadow-md hover:bg-[#047857]';
      default:
        return 'bg-[#594047] text-white border-white shadow-md';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="bg-white rounded-2xl border border-[#e8e8e8] w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#e8e8e8] bg-[#fcf9f8] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#b90064] text-white font-bold flex items-center justify-center text-base shadow-sm shrink-0">
              {supplier.shortCode || 'NL'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-[#1c1b1b] flex items-center gap-1.5">
                  {supplier.name}
                  <ShieldCheck className="w-4 h-4 text-[#b90064]" />
                </h3>
                <span className="text-[11px] font-bold bg-[#dbe1ff] text-[#0050d6] px-2 py-0.5 rounded-full">
                  Verified Manufacturing Facility
                </span>
              </div>
              <p className="text-[12px] text-[#594047] flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-[#b90064] shrink-0" />
                <span className="font-semibold text-[#1c1b1b]">{location.industrialZone}</span>
                <span className="text-[#8c7077]">•</span>
                <span className="text-[#8c7077] font-mono text-[11px]">
                  {location.lat.toFixed(4)}°N, {location.lng.toFixed(4)}°E
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCoordinates}
              className="hidden sm:flex items-center gap-1.5 text-[11.5px] font-semibold text-[#594047] hover:text-[#b90064] bg-white hover:bg-[#f7f2f2] px-3 py-1.5 rounded-lg border border-[#e8e8e8] transition-colors cursor-pointer"
              title="Copy GPS coordinates and full dispatch address"
            >
              {copiedCoords ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Address Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#8c7077]" />
                  <span>Copy GPS &amp; Address</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-[#8c7077] hover:text-[#1c1b1b] hover:bg-[#f0edec] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Body (Interactive Grid: Map + Sidebar) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto min-h-0 bg-[#f7f2f2]">
          
          {/* LEFT: Interactive Map Canvas (7 Cols) */}
          <div className="lg:col-span-7 p-4 sm:p-5 flex flex-col gap-3 relative border-b lg:border-b-0 lg:border-r border-[#e8e8e8]">
            
            {/* Map Layer Filter Tabs */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-[#e8e8e8] shadow-2xs">
                <button
                  onClick={() => {
                    setActiveFilter('all');
                    setSelectedHub(null);
                  }}
                  className={`text-[11.5px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    activeFilter === 'all'
                      ? 'bg-[#b90064] text-white shadow-2xs'
                      : 'text-[#594047] hover:text-[#1c1b1b] hover:bg-[#f7f2f2]'
                  }`}
                >
                  All Nodes ({allHubs.length + 1})
                </button>
                <button
                  onClick={() => {
                    setActiveFilter('shipping');
                    setSelectedHub(null);
                  }}
                  className={`text-[11.5px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    activeFilter === 'shipping'
                      ? 'bg-[#0050d6] text-white shadow-2xs'
                      : 'text-[#594047] hover:text-[#1c1b1b] hover:bg-[#f7f2f2]'
                  }`}
                >
                  <Anchor className="w-3 h-3" />
                  <span>Ports &amp; Air</span>
                </button>
                <button
                  onClick={() => {
                    setActiveFilter('raw_materials');
                    setSelectedHub(null);
                  }}
                  className={`text-[11.5px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    activeFilter === 'raw_materials'
                      ? 'bg-[#d97706] text-white shadow-2xs'
                      : 'text-[#594047] hover:text-[#1c1b1b] hover:bg-[#f7f2f2]'
                  }`}
                >
                  <FlaskConical className="w-3 h-3" />
                  <span>Raw Actives</span>
                </button>
                <button
                  onClick={() => {
                    setActiveFilter('corridors');
                    setSelectedHub(null);
                  }}
                  className={`text-[11.5px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    activeFilter === 'corridors'
                      ? 'bg-[#334155] text-white shadow-2xs'
                      : 'text-[#594047] hover:text-[#1c1b1b] hover:bg-[#f7f2f2]'
                  }`}
                >
                  <Train className="w-3 h-3" />
                  <span>ICDs &amp; Freight</span>
                </button>
              </div>

              {/* Map Zoom Controls */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#e8e8e8] shadow-2xs">
                <button
                  onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 1.45))}
                  className="p-1 rounded-lg hover:bg-[#f7f2f2] text-[#594047] hover:text-[#1c1b1b] transition-colors cursor-pointer"
                  title="Zoom in map"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.85))}
                  className="p-1 rounded-lg hover:bg-[#f7f2f2] text-[#594047] hover:text-[#1c1b1b] transition-colors cursor-pointer"
                  title="Zoom out map"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setZoomLevel(1);
                    setSelectedHub(null);
                  }}
                  className="p-1 rounded-lg hover:bg-[#f7f2f2] text-[#594047] hover:text-[#1c1b1b] transition-colors cursor-pointer"
                  title="Reset viewport"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Interactive Schematic Radar Map Area */}
            <div className="flex-1 min-h-[360px] sm:min-h-[420px] bg-[#1c1b1b] rounded-2xl relative overflow-hidden border border-[#332e30] shadow-inner select-none flex items-center justify-center">
              
              {/* Compass Rose Indicator */}
              <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[10px] text-white/80 font-mono">
                <Compass className="w-3.5 h-3.5 text-[#b90064]" />
                <span>N 0° LAT / ELEV 14m</span>
              </div>

              {/* Proximity Scale Indicator */}
              <div className="absolute bottom-3 left-3 z-20 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[10.5px] text-white/90 font-mono flex items-center gap-2">
                <span className="w-8 h-0.5 bg-[#b90064] block"></span>
                <span>Concentric Rings: 15km / 35km / 75km</span>
              </div>

              {/* Scaled Visual Surface */}
              <motion.div
                animate={{ scale: zoomLevel }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="w-full h-full absolute inset-0 flex items-center justify-center origin-center"
              >
                {/* Background Grid Pattern */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, #443c3e 1px, transparent 1px),
                      linear-gradient(to bottom, #443c3e 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px'
                  }}
                />

                {/* Concentric Distance Rings */}
                <div className="absolute w-[180px] h-[180px] rounded-full border border-dashed border-[#b90064]/30 pointer-events-none flex items-center justify-center">
                  <span className="absolute top-1 text-[9px] text-[#b90064]/60 font-mono tracking-widest uppercase">
                    15 KM Inner Hub
                  </span>
                </div>
                <div className="absolute w-[320px] h-[320px] rounded-full border border-dashed border-white/15 pointer-events-none flex items-center justify-center">
                  <span className="absolute top-1 text-[9px] text-white/40 font-mono tracking-widest uppercase">
                    35 KM Freight Belt
                  </span>
                </div>
                <div className="absolute w-[460px] h-[460px] rounded-full border border-dashed border-white/10 pointer-events-none flex items-center justify-center">
                  <span className="absolute top-1 text-[9px] text-white/30 font-mono tracking-widest uppercase">
                    75 KM Port Corridor
                  </span>
                </div>

                {/* SVG Connecting Transit Vectors (Dashed Lines from Factory to Nodes) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                  {filteredHubs.map((hub) => {
                    const isSelected = selectedHub?.id === hub.id;
                    return (
                      <g key={`vector-${hub.id}`}>
                        <line
                          x1="50%"
                          y1="50%"
                          x2={`${hub.coords.x}%`}
                          y2={`${hub.coords.y}%`}
                          stroke={isSelected ? '#b90064' : '#594047'}
                          strokeWidth={isSelected ? '2.5' : '1.2'}
                          strokeDasharray={isSelected ? '4 2' : '3 3'}
                          strokeOpacity={isSelected ? 1 : 0.6}
                          className="transition-all duration-300"
                        />
                        {isSelected && (
                          <circle
                            cx={`${(50 + hub.coords.x) / 2}%`}
                            cy={`${(50 + hub.coords.y) / 2}%`}
                            r="3"
                            fill="#b90064"
                            className="animate-ping"
                          />
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* CENTRAL PIN: Manufacturer Factory Cleanroom */}
                <div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center group cursor-pointer"
                  onClick={() => setSelectedHub(null)}
                >
                  {/* Expanding Radar Wave */}
                  <div className="absolute -inset-4 rounded-full bg-[#b90064]/20 animate-ping opacity-75 pointer-events-none" />
                  
                  {/* Factory Badge Pin */}
                  <div className="w-11 h-11 rounded-2xl bg-[#b90064] text-white border-2 border-white shadow-xl flex items-center justify-center font-bold text-xs relative z-10 transition-transform group-hover:scale-110">
                    <Building2 className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
                  </div>

                  {/* Label */}
                  <div className="mt-1.5 px-2.5 py-0.8 bg-black/80 backdrop-blur-md rounded-md border border-white/20 text-white text-[10.5px] font-bold tracking-tight shadow-md text-center whitespace-nowrap">
                    <span>{supplier.shortCode} Factory Cleanroom</span>
                    <span className="block text-[9px] font-normal text-white/70">Origin Dispatch Point</span>
                  </div>
                </div>

                {/* SURROUNDING LOGISTICS HUB PINS */}
                {filteredHubs.map((hub) => {
                  const isSelected = selectedHub?.id === hub.id;
                  return (
                    <motion.div
                      key={hub.id}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                      style={{
                        left: `${hub.coords.x}%`,
                        top: `${hub.coords.y}%`
                      }}
                      onClick={() => setSelectedHub(hub)}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center group cursor-pointer"
                    >
                      {/* Pin Button */}
                      <button
                        className={`w-9 h-9 rounded-xl border-2 transition-all flex items-center justify-center cursor-pointer ${getNodeColor(
                          hub.type,
                          isSelected
                        )}`}
                        title={`${hub.name} (${hub.distanceKm} km)`}
                      >
                        {getNodeIcon(hub.type)}
                      </button>

                      {/* Distance Pill & Name Label */}
                      <div
                        className={`mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-tight shadow-md whitespace-nowrap transition-all ${
                          isSelected
                            ? 'bg-[#b90064] text-white ring-1 ring-white/50'
                            : 'bg-black/80 text-white/90 group-hover:bg-black group-hover:text-white border border-white/20'
                        }`}
                      >
                        <span>{hub.distanceKm} km</span>
                        <span className="hidden sm:inline text-white/70 font-normal ml-1">
                          • {hub.name.split(' ')[0]}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Selected Node Floating Details Bar (Inside Canvas) */}
              <AnimatePresence>
                {selectedHub && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute bottom-3 inset-x-3 sm:inset-x-6 z-30 bg-white/95 backdrop-blur-md rounded-xl p-3.5 border border-[#e8e8e8] shadow-xl text-[#1c1b1b]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#b90064] text-white flex items-center justify-center shrink-0 mt-0.5">
                          {getNodeIcon(selectedHub.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-[13px] text-[#1c1b1b]">{selectedHub.name}</h4>
                            <span className="bg-[#fde7f3] text-[#b90064] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                              {selectedHub.distanceKm} km from Plant
                            </span>
                            <span className="bg-[#f0edec] text-[#594047] text-[10px] font-semibold px-2 py-0.5 rounded-full">
                              ⏱️ {selectedHub.transitTime}
                            </span>
                          </div>
                          <p className="text-[11.5px] text-[#594047] mt-0.5">
                            {selectedHub.description}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedHub(null)}
                        className="text-[#8c7077] hover:text-[#1c1b1b] p-1 rounded-md hover:bg-[#f0edec] transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Map Legend */}
            <div className="flex items-center justify-between text-[11px] text-[#594047] bg-white p-2.5 rounded-xl border border-[#e8e8e8] flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#b90064]"></span>
                <span className="font-semibold text-[#1c1b1b]">Factory Cleanroom</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0050d6]"></span>
                <span>Deep Sea Port</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4f46e5]"></span>
                <span>Air Cargo Terminal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#d97706]"></span>
                <span>Raw Chemical/Active Belt</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]"></span>
                <span>Inland Container ICD</span>
              </div>
            </div>

          </div>

          {/* RIGHT: Logistics & Proximity Intelligence Panel (5 Cols) */}
          <div className="lg:col-span-5 p-4 sm:p-5 flex flex-col justify-between gap-4 bg-white">
            
            <div className="space-y-4">
              
              {/* Primary Transit Advantage Card */}
              <div className="bg-[#fcf9f8] p-4 rounded-xl border border-[#e8e8e8] relative overflow-hidden">
                <div className="flex items-start gap-2.5 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-[#b90064] text-white flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#b90064] block">
                      Dispatch &amp; Supply Chain SLA
                    </span>
                    <h4 className="text-[13px] font-bold text-[#1c1b1b] leading-snug">
                      {location.transitAdvantage}
                    </h4>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#e8e8e8] text-[11.5px]">
                  <div>
                    <span className="text-[#8c7077] block text-[10px] uppercase">Turnaround</span>
                    <strong className="text-[#1c1b1b]">{location.dispatchTurnaround}</strong>
                  </div>
                  <div>
                    <span className="text-[#8c7077] block text-[10px] uppercase">Customs Clearance</span>
                    <strong className="text-[#0050d6]">{location.customsStatus.split('•')[0]}</strong>
                  </div>
                </div>
              </div>

              {/* Infrastructure Trust Metrics */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-[#f7f2f2] p-3 rounded-xl border border-[#e8e8e8]">
                  <div className="flex items-center gap-1.5 text-[#0050d6] font-bold text-[12px] mb-1">
                    <FileCheck2 className="w-3.5 h-3.5" />
                    <span>AEO / DPD Status</span>
                  </div>
                  <p className="text-[11px] text-[#594047] leading-tight">
                    Direct Port Delivery green-channel gate authorization enabled.
                  </p>
                </div>

                <div className="bg-[#f7f2f2] p-3 rounded-xl border border-[#e8e8e8]">
                  <div className="flex items-center gap-1.5 text-[#b90064] font-bold text-[12px] mb-1">
                    <ThermometerSnowflake className="w-3.5 h-3.5" />
                    <span>Cold Chain Storage</span>
                  </div>
                  <p className="text-[11px] text-[#594047] leading-tight">
                    2°C - 8°C active peptide refrigeration &amp; reefer truck fleet.
                  </p>
                </div>
              </div>

              {/* Categorized Proximity Breakdown List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#594047] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#b90064]" />
                    <span>Connected Nodes &amp; Distance</span>
                  </h4>
                  <span className="text-[11px] text-[#8c7077]">Click to highlight on map</span>
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {filteredHubs.map((hub) => {
                    const isSelected = selectedHub?.id === hub.id;
                    return (
                      <div
                        key={hub.id}
                        onClick={() => setSelectedHub(hub)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-[#fde7f3] border-[#b90064] shadow-xs'
                            : 'bg-[#fcf9f8] hover:bg-[#f7f2f2] border-[#e8e8e8]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${getNodeColor(hub.type, isSelected)}`}>
                            {getNodeIcon(hub.type)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12px] font-bold text-[#1c1b1b] truncate">
                              {hub.name}
                            </p>
                            <p className="text-[10.5px] text-[#594047] truncate">
                              {hub.category || hub.description}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[12px] font-bold text-[#b90064] block">
                            {hub.distanceKm} km
                          </span>
                          <span className="text-[10px] text-[#8c7077] block">
                            {hub.transitTime.split(' ')[0]} {hub.transitTime.split(' ')[1]}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Bottom Actions Bar */}
            <div className="pt-3 border-t border-[#e8e8e8] flex items-center gap-2.5">
              <button
                onClick={() => {
                  onClose();
                  if (onOpenEnquiry) {
                    onOpenEnquiry(supplier);
                  }
                }}
                className="flex-1 bg-[#b90064] hover:bg-[#8e004b] text-white font-bold text-[13px] py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Contact Facility / Dispatch RFQ</span>
              </button>

              <button
                onClick={handleCopyCoordinates}
                className="p-2.5 bg-white hover:bg-[#f7f2f2] border border-[#e8e8e8] rounded-xl text-[#594047] hover:text-[#b90064] transition-colors cursor-pointer shrink-0"
                title="Copy GPS coordinates"
              >
                {copiedCoords ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

          </div>

        </div>

      </motion.div>
    </div>
  );
};
