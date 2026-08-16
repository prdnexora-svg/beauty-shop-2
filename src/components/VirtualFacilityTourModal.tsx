import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  Building2,
  ShieldCheck,
  Award,
  BadgeCheck,
  Send,
  Calendar,
  Sparkles,
  Clock,
  Video,
  Layers,
  Activity,
  Gauge,
  Zap,
  Download,
  CheckCircle2,
  Eye,
  Maximize2
} from 'lucide-react';
import { VerifiedSupplier } from '../types';

interface VirtualFacilityTourModalProps {
  supplier: VerifiedSupplier | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenEnquiryModal: (item: any) => void;
}

// Sample facility video clips & fallback simulated streams
const FACILITY_CHAPTERS = [
  {
    id: 'rd-lab',
    startTime: 0,
    endTime: 4,
    label: 'R&D & Synthesis Lab',
    desc: 'Cosmeceutical formulation, viscosity testing & batch development',
    cam: 'CAM-01 • R&D LEVEL 2',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-laboratory-worker-using-a-microscope-41584-large.mp4',
    metrics: { temp: '21.5°C', humidity: '45% RH', purity: '99.98%' }
  },
  {
    id: 'cleanroom',
    startTime: 4,
    endTime: 8,
    label: 'Class 10,000 Cleanroom',
    desc: 'Sterile vacuum homogenizing & monoblock aseptic filling',
    cam: 'CAM-02 • ISO 7 CLEANROOM',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-scientist-pipetting-samples-in-a-lab-41585-large.mp4',
    metrics: { temp: '19.2°C', pressure: '+25 Pa', particleCount: '<10,000/m³' }
  },
  {
    id: 'qc-testing',
    startTime: 8,
    endTime: 12,
    label: 'HPLC & Stability Testing',
    desc: 'Real-time active ingredient potency & micro-biological assaying',
    cam: 'CAM-03 • QA / QC DEPT',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-scientist-working-in-a-laboratory-41586-large.mp4',
    metrics: { hplcAccuracy: '99.9%', passRate: '100%', batchId: 'BAT-2026-9812' }
  },
  {
    id: 'bottling-logistics',
    startTime: 12,
    endTime: 15,
    label: 'Automated Bottling & Logistics',
    desc: '92% automated filling lines with robotic palletizing',
    cam: 'CAM-04 • DISPATCH HIGH-BAY',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-pharmacist-using-a-tablet-41587-large.mp4',
    metrics: { lineSpeed: '180 bpm', fillPrecision: '±0.1g', exportReady: 'YES' }
  }
];

export const VirtualFacilityTourModal: React.FC<VirtualFacilityTourModalProps> = ({
  supplier,
  isOpen,
  onClose,
  onOpenEnquiryModal
}) => {
  if (!isOpen || !supplier) return null;

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeCameraIdx, setActiveCameraIdx] = useState(0);
  const [auditRequested, setAuditRequested] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Timer simulation for 15s walkthrough loop
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= 15) {
            return 0; // Restart 15s loop
          }
          return Math.min(15, prev + 0.25);
        });
      }, 250);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  // Update active chapter based on time
  useEffect(() => {
    if (currentTime >= 0 && currentTime < 4) setActiveCameraIdx(0);
    else if (currentTime >= 4 && currentTime < 8) setActiveCameraIdx(1);
    else if (currentTime >= 8 && currentTime < 12) setActiveCameraIdx(2);
    else if (currentTime >= 12 && currentTime <= 15) setActiveCameraIdx(3);
  }, [currentTime]);

  const activeChapter = FACILITY_CHAPTERS[activeCameraIdx];

  const handleSeek = (timeSec: number, camIdx: number) => {
    setCurrentTime(timeSec);
    setActiveCameraIdx(camIdx);
    if (videoRef.current) {
      try {
        videoRef.current.currentTime = timeSec % 4; // Video clip offset
      } catch (e) {
        // Safe fallback
      }
    }
  };

  const handleRequestAudit = () => {
    setAuditRequested(true);
    setToastMessage(`Audit appointment requested with ${supplier.name}. Compliance manager will confirm within 2 hours.`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleDownloadAuditReport = () => {
    const text = `NEXORA LUXE - VIRTUAL FACILITY AUDIT REPORT\n=========================================\nSupplier: ${supplier.name}\nType: ${supplier.type}\nLocation: ${supplier.city}, ${supplier.state || ''}\nCleanroom Status: ISO Class 7/8 Certified\nMonthly Capacity: ${supplier.monthlyCapacity || '250,000 units/month'}\nGMP Status: VERIFIED & COMPLIANT\nAudit ID: NX-AUDIT-2026-8812\n`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${supplier.name.replace(/\s+/g, '_')}_Facility_Audit_Dossier.txt`;
    a.click();
    URL.revokeObjectURL(url);

    setToastMessage('Facility Audit Dossier & Compliance Floorplan downloaded!');
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-60 bg-[#1c1b1b] text-white px-5 py-3 rounded-xl shadow-2xl border border-white/20 flex items-center gap-2.5 text-xs font-bold animate-slideDown max-w-md text-center">
          <Sparkles className="w-4 h-4 text-[#ffcbd9] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="bg-[#141213] text-white w-full max-w-5xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-white/10 bg-[#1c1819] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#b90064] text-white flex items-center justify-center font-extrabold text-sm shadow-sm shrink-0">
              {supplier.shortCode}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white">{supplier.name}</h2>
                <span className="bg-[#b90064]/20 text-[#ff80be] border border-[#b90064]/40 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider">
                  <Video className="w-3 h-3 text-[#ff80be]" />
                  15s Virtual Facility Tour
                </span>
              </div>
              <p className="text-[12px] text-[#b8a2a8] font-medium flex items-center gap-2 mt-0.5">
                <span>{supplier.type} • {supplier.city}, {supplier.state || 'India'}</span>
                <span>•</span>
                <span className="text-[#00c882] font-semibold flex items-center gap-1">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  Cleanroom ISO Class 7/8
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Close Virtual Facility Tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-0">
          
          {/* Main Video Stage (Left 8 Cols) */}
          <div className="lg:col-span-8 bg-black relative flex flex-col justify-between min-h-[340px] sm:min-h-[420px] p-4">
            
            {/* Real Video or High-Tech Simulated Inspection View */}
            <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-black/60 via-black/20 to-black/90">
              <video
                ref={videoRef}
                key={activeChapter.id}
                src={activeChapter.videoUrl}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                className="w-full h-full object-cover opacity-60 filter contrast-105"
                onError={(e) => {
                  // Fallback if network restricts video
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            {/* Top HUD Overlay Info */}
            <div className="relative z-10 flex items-center justify-between text-xs font-mono">
              
              {/* Camera & Location Badge */}
              <div className="bg-black/70 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span className="text-[#ff94c2] font-bold">{activeChapter.cam}</span>
                <span className="text-white/40">|</span>
                <span className="text-white/80 font-medium">1080p HD LIVE</span>
              </div>

              {/* 15s Countdown Timer */}
              <div className="bg-[#b90064] text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 text-xs shadow-md">
                <Clock className="w-3.5 h-3.5" />
                <span>{currentTime.toFixed(1)}s / 15.0s</span>
              </div>
            </div>

            {/* AI Quality Inspection Overlay Bounding Boxes */}
            <div className="relative z-10 my-auto pointer-events-none p-4">
              <div className="max-w-xs border border-dashed border-[#00e699]/60 bg-[#00e699]/10 rounded-lg p-2.5 backdrop-blur-xs animate-pulse">
                <div className="flex items-center justify-between text-[10px] font-mono text-[#00e699] font-bold mb-1">
                  <span>AI IN-LINE INSPECTION</span>
                  <span>PASSED 99.98%</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-white/90">
                  <div>Fill Vol: <span className="font-bold text-white">50.0 ml ±0.02</span></div>
                  <div>Cap Seal: <span className="font-bold text-[#00e699]">VERIFIED</span></div>
                </div>
              </div>
            </div>

            {/* Video Controls & Chapter Navigation */}
            <div className="relative z-10 space-y-3">
              
              {/* Time Scrubber / Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-white/90">
                  <span className="flex items-center gap-1.5 text-[#ff80be] font-bold">
                    <Activity className="w-3.5 h-3.5" />
                    <span>{activeChapter.label}</span>
                  </span>
                  <span className="text-white/60 font-mono text-[10px]">
                    Phase {activeCameraIdx + 1} of 4
                  </span>
                </div>

                {/* 15s Timeline Bar with Chapter Ticks */}
                <div className="relative h-2.5 bg-white/20 rounded-full overflow-hidden cursor-pointer">
                  <div
                    className="h-full bg-gradient-to-r from-[#b90064] via-[#e6007e] to-[#ff66b2] rounded-full transition-all duration-200"
                    style={{ width: `${(currentTime / 15) * 100}%` }}
                  ></div>
                  
                  {/* Chapter tick dividers */}
                  <div className="absolute inset-0 grid grid-cols-4 pointer-events-none divide-x divide-black/50">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                </div>
              </div>

              {/* Chapter Buttons Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {FACILITY_CHAPTERS.map((ch, idx) => {
                  const isActive = activeCameraIdx === idx;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => handleSeek(ch.startTime, idx)}
                      className={`px-2.5 py-1.5 rounded-lg border text-[10.5px] font-bold text-left transition-all flex flex-col justify-between cursor-pointer ${
                        isActive
                          ? 'bg-[#b90064] text-white border-[#ff80be] shadow-md ring-1 ring-[#ff80be]/50'
                          : 'bg-white/10 hover:bg-white/20 text-white/80 border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate">{ch.label.split(' ')[0]} {ch.label.split(' ')[1] || ''}</span>
                        <span className="text-[9px] font-mono opacity-80">{ch.startTime}s</span>
                      </div>
                      <span className="text-[9px] opacity-70 truncate mt-0.5">{ch.desc}</span>
                    </button>
                  );
                })}
              </div>

              {/* Bottom Video Action Bar */}
              <div className="flex items-center justify-between pt-1 border-t border-white/10 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    title={isMuted ? 'Unmute Ambient Sound' : 'Mute'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => handleSeek(0, 0)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    title="Restart 15s Tour"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-[11px] text-white/70 font-medium">
                  <span>Audited by </span>
                  <span className="font-bold text-white">Bureau Veritas & Intertek</span>
                </div>
              </div>

            </div>

          </div>

          {/* Right Panel: Technical Specifications & Direct Business CTAs (Right 4 Cols) */}
          <div className="lg:col-span-4 bg-[#1a1718] p-5 border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col justify-between gap-5 overflow-y-auto">
            
            <div>
              
              {/* Facility Overview Header */}
              <div className="mb-4 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2 text-xs font-bold text-[#ff80be] uppercase tracking-wider mb-1">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Facility Infrastructure</span>
                </div>
                <h3 className="text-lg font-extrabold text-white">Manufacturing Plant</h3>
                <p className="text-xs text-white/70 mt-1 leading-relaxed">
                  State-of-the-art cGMP certified manufacturing campus featuring automated homogenizers, high-speed bottling, and dedicated micro-labs.
                </p>
              </div>

              {/* Technical Specifications Grid */}
              <div className="space-y-2.5 mb-5">
                
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-white/80 font-medium">
                    <Layers className="w-4 h-4 text-[#ff80be]" />
                    <span>Total Area</span>
                  </div>
                  <span className="font-extrabold text-white">{supplier.facilityArea || '120,000 sq. ft'}</span>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-white/80 font-medium">
                    <Gauge className="w-4 h-4 text-[#00e699]" />
                    <span>Daily Capacity</span>
                  </div>
                  <span className="font-extrabold text-[#00e699]">{supplier.monthlyCapacity || '250,000 Units/Day'}</span>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-white/80 font-medium">
                    <Zap className="w-4 h-4 text-[#ffc107]" />
                    <span>Automation Level</span>
                  </div>
                  <span className="font-extrabold text-white">92% Fully Automated</span>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-white/80 font-medium">
                    <ShieldCheck className="w-4 h-4 text-[#66a3ff]" />
                    <span>Air Filtration</span>
                  </div>
                  <span className="font-extrabold text-white">HEPA H14 (99.995%)</span>
                </div>

              </div>

              {/* Verified Compliance Badges */}
              <div className="mb-5">
                <span className="text-[11px] font-bold text-white/60 uppercase tracking-wider block mb-2">
                  Verified Certifications
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-1 bg-[#00875a]/20 text-[#00c882] border border-[#00875a]/40 text-[11px] font-bold rounded-md flex items-center gap-1">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    GMP Certified
                  </span>
                  <span className="px-2.5 py-1 bg-[#b90064]/20 text-[#ff80be] border border-[#b90064]/40 text-[11px] font-bold rounded-md flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    ISO 22716
                  </span>
                  <span className="px-2.5 py-1 bg-[#0050d6]/20 text-[#66a3ff] border border-[#0050d6]/40 text-[11px] font-bold rounded-md flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    FDA Registered
                  </span>
                </div>
              </div>

            </div>

            {/* Direct Action CTAs */}
            <div className="space-y-2 pt-3 border-t border-white/10">
              
              <button
                onClick={() => {
                  onClose();
                  onOpenEnquiryModal({
                    title: `${supplier.name} Facility Sourcing Enquiry`,
                    supplierName: supplier.name,
                    city: supplier.city,
                    state: supplier.state
                  });
                }}
                className="w-full bg-[#b90064] hover:bg-[#8e004b] text-white font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-98"
              >
                <Send className="w-4 h-4" />
                <span>Send Direct Enquiry to {supplier.name}</span>
              </button>

              <button
                onClick={handleRequestAudit}
                disabled={auditRequested}
                className={`w-full font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                  auditRequested
                    ? 'bg-[#00875a]/20 text-[#00c882] border-[#00875a]/40'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                }`}
              >
                {auditRequested ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#00c882]" />
                    <span>In-Person Audit Requested</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 text-[#ff80be]" />
                    <span>Request In-Person Plant Audit</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadAuditReport}
                className="w-full text-white/70 hover:text-white font-semibold py-2 px-3 rounded-lg text-[11.5px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#ff80be]" />
                <span>Download Audit Dossier & Floorplan</span>
              </button>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
