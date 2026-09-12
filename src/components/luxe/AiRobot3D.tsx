import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Sparkles, Bot, ShieldCheck, Zap, RefreshCw, MessageSquare } from 'lucide-react';

interface AiRobot3DProps {
  onRobotClick?: () => void;
}

export const AiRobot3D: React.FC<AiRobot3DProps> = ({ onRobotClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [speechIndex, setSpeechIndex] = useState(0);
  const [manualRotationY, setManualRotationY] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse tilt physics for 3D perspective effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for 3D rotation on hover
  const rotateXSpring = useSpring(useTransform(mouseY, [-100, 100], [15, -15]), { stiffness: 200, damping: 20 });
  const rotateYSpring = useSpring(useTransform(mouseX, [-100, 100], [-25, 25]), { stiffness: 200, damping: 20 });

  const speechBubbles = [
    '✨ Hi! I am Nexora AI. Hover or drag to rotate me in 3D!',
    '🔍 Auto-matching 5,000+ verified cosmetics suppliers...',
    '⚡ 99.4% instant quote accuracy for beauty RFQs!',
    '💎 Click me to spin & discover premium OEM labs!',
  ];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleClick = () => {
    setIsSpinning(true);
    setManualRotationY((prev) => prev + 360);
    setSpeechIndex((prev) => (prev + 1) % speechBubbles.length);
    if (onRobotClick) onRobotClick();
    setTimeout(() => setIsSpinning(false), 1000);
  };

  return (
    <div className="relative flex flex-col items-center justify-center select-none py-2">
      {/* Speech Bubble / Floating AI Status Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-3 relative"
      >
        <div className="bg-[#1F0A2E]/90 border border-purple-300/30 text-white text-[11.5px] font-semibold px-3.5 py-1.5 rounded-full shadow-lg backdrop-blur-md flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[#EFD9A0] font-bold">Nexora 3D AI</span>
          <span className="text-white/80 hidden sm:inline">{speechBubbles[speechIndex]}</span>
        </div>
      </motion.div>

      {/* 3D Robot Container with Perspective */}
      <div
        ref={containerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className="relative w-44 h-52 sm:w-52 sm:h-60 cursor-pointer flex items-center justify-center group"
        style={{ perspective: 1000 }}
      >
        {/* Subtle glowing platform ring beneath robot */}
        <div className="absolute bottom-2 w-32 h-8 bg-gradient-to-r from-purple-500/20 via-[#EFD9A0]/30 to-purple-500/20 rounded-full blur-md animate-pulse" />
        <div className="absolute bottom-4 w-28 h-4 border border-[#EFD9A0]/40 rounded-full transform rotate-x-60 animate-spin-slow opacity-60" />

        {/* Floating 3D Robot Body */}
        <motion.div
          style={{
            rotateX: rotateXSpring,
            rotateY: rotateYSpring,
            transformStyle: 'preserve-3d',
          }}
          animate={{
            y: [0, -12, 0],
            rotateY: isSpinning ? manualRotationY : undefined,
          }}
          transition={{
            y: {
              duration: 3.5,
              repeat: Infinity,
              ease: 'easeInOut',
            },
            rotateY: {
              duration: isSpinning ? 0.9 : 0.2,
              ease: 'easeOut',
            },
          }}
          className="relative w-full h-full flex flex-col items-center justify-center"
        >
          {/* SVG 3D AI Robot Design */}
          <svg
            viewBox="0 0 200 240"
            className="w-full h-full drop-shadow-[0_15px_25px_rgba(107,45,140,0.5)] transition-transform duration-300 group-hover:scale-105"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Holographic Orbit Ring around robot */}
            <g className="animate-spin-slow" style={{ transformOrigin: '100px 120px' }}>
              <ellipse cx="100" cy="120" rx="85" ry="28" stroke="url(#orbitGlow)" strokeWidth="1.8" strokeDasharray="6 4" opacity="0.8" />
              <circle cx="170" cy="130" r="4" fill="#EFD9A0" className="animate-ping" />
            </g>

            {/* Antenna with Pulsing Crystal Sphere */}
            <path d="M100 42 V22" stroke="url(#metallicGradient)" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="100" cy="18" r="7" fill="url(#goldSphere)" />
            <circle cx="100" cy="18" r="10" stroke="#EFD9A0" strokeWidth="1.5" opacity="0.6" className="animate-ping" />

            {/* Robot Head Outer Shell */}
            <rect x="55" y="42" width="90" height="65" rx="28" fill="url(#metallicGradient)" stroke="url(#borderGlow)" strokeWidth="2" />

            {/* Visor Screen */}
            <rect x="65" y="52" width="70" height="42" rx="18" fill="#0D0314" stroke="url(#visorBorder)" strokeWidth="1.5" />
            <rect x="68" y="55" width="64" height="36" rx="15" fill="url(#screenGradient)" />

            {/* Glowing Digital Eyes */}
            <motion.g
              animate={{
                scaleY: [1, 1, 0.1, 1, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                repeatDelay: 2,
              }}
              style={{ transformOrigin: '100px 73px' }}
            >
              {/* Left Eye */}
              <circle cx="83" cy="73" r="6" fill="#00FFCC" className="shadow-[0_0_10px_#00FFCC]" />
              <circle cx="83" cy="73" r="3" fill="#FFFFFF" />

              {/* Right Eye */}
              <circle cx="117" cy="73" r="6" fill="#00FFCC" className="shadow-[0_0_10px_#00FFCC]" />
              <circle cx="117" cy="73" r="3" fill="#FFFFFF" />
            </motion.g>

            {/* Friendly Digital Smile / Data Indicator */}
            <path d="M90 84 Q100 89 110 84" stroke="#EFD9A0" strokeWidth="2" strokeLinecap="round" />

            {/* Neck Joint */}
            <rect x="88" y="106" width="24" height="10" rx="3" fill="url(#jointGradient)" />

            {/* Torso / Body */}
            <path d="M60 116 Q100 110 140 116 L130 185 Q100 195 70 185 Z" fill="url(#metallicGradient)" stroke="url(#borderGlow)" strokeWidth="2" />

            {/* Chest Core Crystal Arc React Reactor */}
            <circle cx="100" cy="150" r="16" fill="#1F0A2E" stroke="#6B2D8C" strokeWidth="2" />
            <circle cx="100" cy="150" r="12" fill="url(#coreGlow)" className="animate-pulse" />
            <polygon points="100,140 109,155 91,155" fill="#EFD9A0" opacity="0.9" />

            {/* Arms / Shoulder Pads */}
            <rect x="42" y="122" width="16" height="45" rx="8" fill="url(#metallicGradient)" stroke="url(#borderGlow)" strokeWidth="1.5" transform="rotate(12 50 122)" />
            <rect x="142" y="122" width="16" height="45" rx="8" fill="url(#metallicGradient)" stroke="url(#borderGlow)" strokeWidth="1.5" transform="rotate(-12 150 122)" />

            {/* Floating Hands */}
            <circle cx="45" cy="176" r="6" fill="url(#goldSphere)" />
            <circle cx="155" cy="176" r="6" fill="url(#goldSphere)" />

            {/* Gradient Definitions */}
            <defs>
              <linearGradient id="metallicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4A1E60" />
                <stop offset="50%" stopColor="#2A0E3F" />
                <stop offset="100%" stopColor="#170624" />
              </linearGradient>
              <linearGradient id="borderGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EFD9A0" />
                <stop offset="50%" stopColor="#6B2D8C" />
                <stop offset="100%" stopColor="#EFD9A0" />
              </linearGradient>
              <linearGradient id="goldSphere" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF2D1" />
                <stop offset="50%" stopColor="#C9A961" />
                <stop offset="100%" stopColor="#8A6C29" />
              </linearGradient>
              <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#00FFCC" />
                <stop offset="60%" stopColor="#6B2D8C" />
                <stop offset="100%" stopColor="#1A0628" />
              </radialGradient>
              <linearGradient id="screenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1A072E" />
                <stop offset="100%" stopColor="#080112" />
              </linearGradient>
              <linearGradient id="visorBorder" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00FFCC" />
                <stop offset="100%" stopColor="#EFD9A0" />
              </linearGradient>
              <linearGradient id="orbitGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EFD9A0" />
                <stop offset="50%" stopColor="#00FFCC" />
                <stop offset="100%" stopColor="#6B2D8C" />
              </linearGradient>
              <linearGradient id="jointGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8A6C29" />
                <stop offset="100%" stopColor="#C9A961" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* Hover Hint Overlay */}
        <div className="absolute -bottom-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <span className="text-[10px] font-bold text-[#EFD9A0] bg-[#170624]/90 px-2.5 py-1 rounded-full border border-[#EFD9A0]/30 shadow-lg flex items-center gap-1">
            <RefreshCw className="w-3 h-3 animate-spin" /> Click or drag to 3D rotate
          </span>
        </div>
      </div>

      {/* Floating UI Status Cards with Pulsing & Floating Animations */}
      <div className="w-full max-w-xs space-y-2.5 mt-2">
        {/* Floating Card 1: AI Match Accuracy */}
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          className="bg-white/10 border border-white/20 hover:border-[#EFD9A0]/50 rounded-xl p-2.5 backdrop-blur-md shadow-lg flex items-center justify-between text-white transition-all"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-white/70">AI Match Engine</p>
              <p className="text-xs font-black text-white">99.4% Supplier Precision</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            ACTIVE
          </span>
        </motion.div>

        {/* Floating Card 2: Verified Security Guard */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
          className="bg-white/10 border border-white/20 hover:border-[#EFD9A0]/50 rounded-xl p-2.5 backdrop-blur-md shadow-lg flex items-center justify-between text-white transition-all"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/20 text-[#EFD9A0] border border-[#EFD9A0]/30">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-white/70">Verification Guard</p>
              <p className="text-xs font-black text-white">100% GST & ISO Screened</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-[#EFD9A0] border border-purple-500/40">
            VERIFIED
          </span>
        </motion.div>
      </div>
    </div>
  );
};
