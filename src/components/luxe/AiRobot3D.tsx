import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Bot, Zap, ShieldCheck, Activity, RotateCcw, Cpu } from 'lucide-react';

interface AiRobot3DProps {
  className?: string;
  onRobotClick?: () => void;
}

const AI_MESSAGES = [
  "✦ AI Procurement Bot: 99.4% Match for Bio-Peptides!",
  "✦ Scanning 48+ Verified OEM Labs in Mumbai & Delhi...",
  "✦ Instant Quote Generated: ₹340/unit (MOQ 100 pcs)",
  "✦ Drag or Hover to rotate 3D AI Assistant!",
  "✦ Automated RFQ Broadcast active via WhatsApp & Email"
];

export const AiRobot3D: React.FC<AiRobot3DProps> = ({ className = '', onRobotClick }) => {
  const [rotation, setRotation] = useState({ x: -5, y: 15, z: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [activeMessageIndex, setActiveMessageIndex] = useState(0);
  const [pulseCore, setPulseCore] = useState(false);
  const [clickSpin, setClickSpin] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto idle rotation & floating
  useEffect(() => {
    if (isDragging || isHovered) return;
    const interval = setInterval(() => {
      setRotation(prev => ({
        x: Math.sin(Date.now() / 1500) * 8 - 4,
        y: (prev.y + 0.4) % 360,
        z: Math.cos(Date.now() / 2000) * 4
      }));
    }, 30);
    return () => clearInterval(interval);
  }, [isDragging, isHovered]);

  // Cycle messages
  useEffect(() => {
    const msgInterval = setInterval(() => {
      setActiveMessageIndex((prev) => (prev + 1) % AI_MESSAGES.length);
      setPulseCore(true);
      setTimeout(() => setPulseCore(false), 800);
    }, 4500);
    return () => clearInterval(msgInterval);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      setRotation(prev => ({
        x: Math.max(-45, Math.min(45, prev.x - deltaY * 0.5)),
        y: prev.y + deltaX * 0.5,
        z: prev.z
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
    } else if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const tiltY = ((e.clientX - centerX) / (rect.width / 2)) * 25;
      const tiltX = -((e.clientY - centerY) / (rect.height / 2)) * 20;
      setRotation({ x: tiltX, y: tiltY, z: tiltY * 0.2 });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    setClickSpin(true);
    setPulseCore(true);
    setActiveMessageIndex((prev) => (prev + 1) % AI_MESSAGES.length);
    setTimeout(() => setClickSpin(false), 900);
    setTimeout(() => setPulseCore(false), 600);
    if (onRobotClick) onRobotClick();
  };

  const resetRotation = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRotation({ x: -5, y: 15, z: 0 });
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsDragging(false);
      }}
      className={`relative flex flex-col items-center justify-center select-none cursor-grab active:cursor-grabbing ${className}`}
      style={{ perspective: '1200px' }}
    >
      {/* Interactive Speech / AI Status Bubble above Robot */}
      <div 
        onClick={handleClick}
        className="mb-3 transition-all duration-300 transform hover:scale-105 cursor-pointer z-30"
      >
        <div className="glass-card-dark bg-[#2A0E3F]/85 backdrop-blur-md rounded-2xl px-4 py-2 border border-[#C9A961]/50 shadow-[0_10px_25px_rgba(42,14,63,0.5)] flex items-center gap-2.5 max-w-[280px]">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C9A961] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#EFD9A0]"></span>
          </span>
          <p className="text-[11.5px] font-semibold text-white leading-tight truncate">
            {AI_MESSAGES[activeMessageIndex]}
          </p>
          <Sparkles className="w-3.5 h-3.5 text-[#EFD9A0] shrink-0 animate-pulse" />
        </div>
        {/* Little triangle tail */}
        <div className="w-2.5 h-2.5 bg-[#2A0E3F] border-r border-b border-[#C9A961]/50 rotate-45 mx-auto -mt-1.5"></div>
      </div>

      {/* 3D Robot Container with Perspective & Transform */}
      <div 
        onClick={handleClick}
        className="relative w-48 h-56 md:w-56 md:h-64 flex items-center justify-center transition-transform duration-200"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg) ${clickSpin ? 'rotateY(360deg) scale(1.1)' : ''}`,
          transition: clickSpin ? 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' : isDragging ? 'none' : 'transform 0.15s ease-out'
        }}
      >
        {/* Ambient Back Glow */}
        <div className={`absolute inset-4 rounded-full bg-gradient-to-tr from-[#6B2D8C]/40 via-[#C9A961]/30 to-[#8236A0]/40 blur-2xl transition-opacity duration-500 ${isHovered ? 'opacity-90 scale-110' : 'opacity-60'}`} />

        {/* Orbiting 3D Holographic Ring 1 (Gold) */}
        <div 
          className="absolute w-52 h-52 md:w-60 md:h-60 rounded-full border border-[#C9A961]/60 pointer-events-none"
          style={{
            transform: 'rotateX(75deg) rotateY(15deg)',
            animation: 'spin 12s linear infinite',
            boxShadow: '0 0 15px rgba(201, 169, 97, 0.4), inset 0 0 15px rgba(201, 169, 97, 0.2)'
          }}
        >
          {/* Node on Ring */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#EFD9A0] shadow-[0_0_10px_#EFD9A0]"></div>
        </div>

        {/* Orbiting 3D Holographic Ring 2 (Purple) */}
        <div 
          className="absolute w-44 h-44 md:w-52 md:h-52 rounded-full border border-[#E8D5F2]/40 pointer-events-none"
          style={{
            transform: 'rotateX(45deg) rotateY(-35deg)',
            animation: 'spin 8s linear infinite reverse',
            boxShadow: '0 0 12px rgba(232, 213, 242, 0.3)'
          }}
        >
          <div className="absolute bottom-0 right-1/4 w-2.5 h-2.5 rounded-full bg-[#E8D5F2] shadow-[0_0_8px_#E8D5F2]"></div>
        </div>

        {/* 3D Robot Head & Body Structure */}
        <div className="relative flex flex-col items-center justify-center z-20">
          
          {/* Floating Robot Antenna */}
          <div className="flex flex-col items-center -mb-1 z-30">
            <div className={`w-3 h-3 rounded-full bg-gradient-to-tr from-[#C9A961] to-[#FFF] shadow-[0_0_12px_#EFD9A0] transition-transform duration-300 ${pulseCore ? 'scale-150 shadow-[0_0_20px_#EFD9A0]' : 'animate-pulse'}`} />
            <div className="w-1 h-3 bg-gradient-to-b from-[#C9A961] to-[#6B2D8C]" />
          </div>

          {/* Robot Head (Sleek Chrome & Glass Helmet) */}
          <div className="relative w-28 h-24 md:w-32 md:h-28 rounded-[28px] bg-gradient-to-b from-[#FAF7F2] via-[#E5D4ED] to-[#3D1E4E] p-1.5 shadow-[0_15px_35px_rgba(42,14,63,0.5)] border border-white/60 overflow-hidden group">
            
            {/* Glossy Visor Highlight */}
            <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent pointer-events-none z-20"></div>

            {/* Dark Cyber Visor */}
            <div className="w-full h-full bg-[#1A0D24] rounded-[22px] flex items-center justify-center relative overflow-hidden border border-[#6B2D8C]/50 shadow-inner">
              
              {/* Scanlines Effect */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(201,169,97,0.05)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none"></div>

              {/* Glowing LED Eyes */}
              <div className="flex items-center justify-center gap-4 relative z-10">
                {/* Left Eye */}
                <div className={`relative w-6 h-6 rounded-full bg-gradient-to-tr from-[#6B2D8C] via-[#C9A961] to-[#EFD9A0] shadow-[0_0_15px_#C9A961] flex items-center justify-center transition-transform duration-300 ${clickSpin ? 'scale-y-10' : ''}`}>
                  <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_6px_#FFF]" />
                </div>
                {/* Right Eye */}
                <div className={`relative w-6 h-6 rounded-full bg-gradient-to-tr from-[#6B2D8C] via-[#C9A961] to-[#EFD9A0] shadow-[0_0_15px_#C9A961] flex items-center justify-center transition-transform duration-300 ${clickSpin ? 'scale-y-10' : ''}`}>
                  <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_6px_#FFF]" />
                </div>
              </div>

              {/* Interactive Audio Wave Mouth Accent */}
              <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-1 opacity-80">
                <span className="w-1 h-1.5 bg-[#C9A961] rounded-full animate-bounce"></span>
                <span className="w-1 h-3 bg-[#EFD9A0] rounded-full animate-bounce delay-100"></span>
                <span className="w-1 h-2 bg-[#C9A961] rounded-full animate-bounce delay-200"></span>
                <span className="w-1 h-3.5 bg-[#EFD9A0] rounded-full animate-bounce delay-150"></span>
                <span className="w-1 h-1.5 bg-[#C9A961] rounded-full animate-bounce delay-75"></span>
              </div>
            </div>
          </div>

          {/* Neck Joint */}
          <div className="w-10 h-2.5 bg-gradient-to-r from-[#2A0E3F] via-[#C9A961] to-[#2A0E3F] rounded-full my-0.5 shadow-xs border border-white/30" />

          {/* Robot Torso / Body */}
          <div className="relative w-32 h-24 md:w-36 md:h-28 rounded-[24px] bg-gradient-to-br from-[#3D1E4E] via-[#54276E] to-[#2A0E3F] p-2 shadow-[0_20px_45px_rgba(20,5,35,0.6)] border border-[#C9A961]/40 flex flex-col items-center justify-center">
            
            {/* Metallic Collar Plate */}
            <div className="absolute top-1 inset-x-4 h-1.5 bg-gradient-to-r from-transparent via-[#C9A961]/60 to-transparent rounded-full"></div>

            {/* Glowing AI Power Core */}
            <div className={`relative w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#1A0D24] border-2 border-[#C9A961] flex items-center justify-center shadow-[0_0_20px_rgba(201,169,97,0.5)] transition-all duration-300 ${pulseCore ? 'scale-125 border-white shadow-[0_0_30px_#EFD9A0]' : ''}`}>
              <Cpu className="w-5 h-5 text-[#EFD9A0] animate-pulse" />
              <div className="absolute inset-0 rounded-full border border-[#EFD9A0]/40 animate-ping opacity-50" />
            </div>

            {/* B2B Badge Accent */}
            <div className="mt-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 text-[9px] font-extrabold uppercase tracking-widest text-[#EFD9A0]">
              Nexora AI v2.4
            </div>
          </div>

        </div>

        {/* Base Shadow Float */}
        <div className="absolute -bottom-6 w-36 h-6 bg-[#2A0E3F]/40 rounded-full blur-md pointer-events-none transform rotateX(75deg) scale-y-50"></div>
      </div>

      {/* Helper Interaction Hint */}
      <div className="mt-2 flex items-center gap-1.5 text-[10.5px] font-medium text-white/70 bg-white/10 backdrop-blur-xs px-3 py-1 rounded-full border border-white/20 transition-opacity duration-300 hover:bg-white/20">
        <RotateCcw className="w-3 h-3 text-[#EFD9A0]" />
        <span>Hover, Drag or Click to Interact</span>
        <button 
          onClick={resetRotation}
          title="Reset 3D Angle"
          className="ml-1.5 text-white/50 hover:text-white underline"
        >
          Reset
        </button>
      </div>
    </div>
  );
};
