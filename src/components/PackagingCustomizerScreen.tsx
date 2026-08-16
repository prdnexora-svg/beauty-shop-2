import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Settings,
  HelpCircle,
  Download,
  Check,
  RefreshCw,
  FolderOpen,
  Info,
  BadgePercent,
  Coins,
  PackageCheck
} from 'lucide-react';

export const PackagingCustomizerScreen: React.FC = () => {
  // Customizer selections
  const [bottleShape, setBottleShape] = useState<'boston' | 'cylinder' | 'square'>('boston');
  const [pumpType, setPumpType] = useState<'spray' | 'dropper' | 'disc'>('dropper');
  const [capColor, setCapColor] = useState<'gold' | 'chrome' | 'pink' | 'black'>('gold');
  const [labelTheme, setLabelTheme] = useState<'rose' | 'mint' | 'gold' | 'black'>('rose');
  const [labelText, setLabelText] = useState<'NEXORA LUXE' | 'SKINCARE' | 'GLOW REPAIR' | 'CUSTOM BRAND'>('NEXORA LUXE');
  const [fluidColor, setFluidColor] = useState<'pink' | 'amber' | 'clear' | 'milky'>('pink');
  const [customText, setCustomText] = useState('');
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showLocalToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveDesign = () => {
    showLocalToast('Packaging custom design specification compiled & appended to active RFQ specifications!');
  };

  // Helper values for rendering
  const capColorStyles = {
    gold: 'bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 border-amber-300 shadow-md shadow-yellow-100',
    chrome: 'bg-gradient-to-r from-zinc-200 via-zinc-400 to-zinc-500 border-zinc-300 shadow-md shadow-zinc-100',
    pink: 'bg-gradient-to-r from-pink-300 via-[#e6007e] to-[#b90064] border-pink-400 shadow-md shadow-pink-100',
    black: 'bg-gradient-to-r from-zinc-700 via-zinc-800 to-zinc-950 border-zinc-800 shadow-md shadow-zinc-300'
  };

  const labelThemeStyles = {
    rose: 'bg-[#fff1f2] border-rose-200 text-rose-950 shadow-xs',
    mint: 'bg-[#f0fdf4] border-emerald-200 text-emerald-950 shadow-xs',
    gold: 'bg-[#fefce8] border-amber-200 text-amber-950 shadow-xs',
    black: 'bg-[#1c1b1b] border-zinc-800 text-white shadow-xs'
  };

  const fluidColorStyles = {
    pink: 'bg-gradient-to-t from-[#fdf2f8]/70 via-[#fbcfe8]/40 to-transparent',
    amber: 'bg-gradient-to-t from-amber-100/70 via-amber-50/30 to-transparent',
    clear: 'bg-gradient-to-t from-blue-50/40 via-transparent to-transparent',
    milky: 'bg-gradient-to-t from-zinc-100/80 via-zinc-50/50 to-transparent'
  };

  return (
    <div className="py-8 px-4 md:px-10 max-w-[1440px] mx-auto">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-22 right-6 z-50 bg-[#1c1b1b] text-white px-4 py-3 rounded-xl shadow-xl border border-[#313030] flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#e6007e]" />
          <span className="text-[13px] font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Screen Header */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fde7f3] text-[#b90064] font-bold text-[11px] uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Private Label Studio</span>
          </div>
          <h1 className="text-3xl font-black text-[#1c1b1b] tracking-tight">
            Packaging &amp; Cosmetic Bottle Customizer
          </h1>
          <p className="text-[14px] text-[#594047] font-semibold mt-1">
            Choose cosmetic bottle silhouettes, select metallic caps, configure fluid tints, and apply customized brand labeling in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white px-4 py-2 border border-[#e8e8e8] rounded-xl text-[12px] font-bold text-[#594047]">
          <PackageCheck className="w-4 h-4 text-[#0050d6]" />
          <span>Render Mode: <strong className="text-emerald-700">Aseptic Preview</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* L-SIDE: Control Panel Parameters (col-span-5) */}
        <div className="lg:col-span-5 bg-[#fcf9f8] border border-[#e8e8e8] p-5 rounded-3xl space-y-5">
          <div className="pb-3 border-b border-[#e8e8e8] flex justify-between items-center">
            <h3 className="font-bold text-[14.5px] text-zinc-950 flex items-center gap-1.5">
              <Settings className="w-4.5 h-4.5 text-[#b90064]" />
              Visual Configurator Room
            </h3>
            <button
              onClick={() => {
                setBottleShape('boston');
                setPumpType('dropper');
                setCapColor('gold');
                setLabelTheme('rose');
                setFluidColor('pink');
                setLabelText('NEXORA LUXE');
                setCustomText('');
                showLocalToast('Configuration reset to baseline template.');
              }}
              className="text-[11px] font-bold text-[#594047] hover:text-[#b90064] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>

          <div className="space-y-4 text-[12.5px]">
            
            {/* parameter 1: bottle silhouette */}
            <div className="space-y-1.5">
              <label className="font-bold text-zinc-950 block">Bottle Silhouette Shape</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { shape: 'boston' as const, label: 'Boston Round', desc: 'Curved neck' },
                  { shape: 'cylinder' as const, label: 'Cylinder Slim', desc: 'Minimalist' },
                  { shape: 'square' as const, label: 'Luxury Square', desc: 'Grounded' }
                ].map((item) => (
                  <button
                    key={item.shape}
                    onClick={() => setBottleShape(item.shape)}
                    className={`p-2.5 border rounded-xl text-center cursor-pointer transition-all ${
                      bottleShape === item.shape
                        ? 'bg-[#b90064] text-white border-[#b90064]'
                        : 'bg-white text-[#594047] border-[#e8e8e8] hover:bg-[#fde7f3]'
                    }`}
                  >
                    <span className="text-[11.5px] font-black block">{item.label}</span>
                    <span className="text-[9px] font-medium opacity-90 block mt-0.5">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* parameter 2: Cap / Pump mechanism */}
            <div className="space-y-1.5">
              <label className="font-bold text-zinc-950 block">Cap &amp; Dispensing Mechanism</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { type: 'dropper' as const, label: 'Glass Dropper', desc: 'Pipette head' },
                  { type: 'spray' as const, label: 'Mist Spray Pump', desc: 'Atomizer spray' },
                  { type: 'disc' as const, label: 'Disc Top Cap', desc: 'Press & pour' }
                ].map((item) => (
                  <button
                    key={item.type}
                    onClick={() => setPumpType(item.type)}
                    className={`p-2.5 border rounded-xl text-center cursor-pointer transition-all ${
                      pumpType === item.type
                        ? 'bg-[#b90064] text-white border-[#b90064]'
                        : 'bg-white text-[#594047] border-[#e8e8e8] hover:bg-[#fde7f3]'
                    }`}
                  >
                    <span className="text-[11.5px] font-black block">{item.label}</span>
                    <span className="text-[9px] font-medium opacity-90 block mt-0.5">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* parameter 3: cap metallic finish color */}
            <div className="space-y-1.5">
              <label className="font-bold text-zinc-950 block">Metallic Cap Finish &amp; Color</label>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { color: 'gold' as const, label: 'Brushed Gold', rgb: '#f59e0b' },
                  { color: 'chrome' as const, label: 'Luxury Chrome', rgb: '#9ca3af' },
                  { color: 'pink' as const, label: 'Cosmic Pink', rgb: '#e6007e' },
                  { color: 'black' as const, label: 'Cosmetic Black', rgb: '#1f2937' }
                ].map((item) => (
                  <button
                    key={item.color}
                    onClick={() => setCapColor(item.color)}
                    className={`p-2 border rounded-xl cursor-pointer transition-all ${
                      capColor === item.color
                        ? 'bg-[#b90064] text-white border-[#b90064]'
                        : 'bg-white text-[#594047] border-[#e8e8e8] hover:bg-[#fde7f3]'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full mx-auto border mb-1" style={{ backgroundColor: item.rgb }}></div>
                    <span className="text-[10px] font-bold block">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* parameter 4: label text config */}
            <div className="space-y-2 pt-2 border-t border-zinc-200">
              <label className="font-bold text-zinc-950 block">Label Text Branding</label>
              <div className="grid grid-cols-2 gap-2">
                {['NEXORA LUXE', 'SKINCARE', 'GLOW REPAIR'].map((text) => (
                  <button
                    key={text}
                    onClick={() => {
                      setLabelText(text as any);
                      setCustomText('');
                    }}
                    className={`p-2 border rounded-xl text-center cursor-pointer font-extrabold text-[11px] transition-all ${
                      labelText === text && !customText
                        ? 'bg-[#b90064] text-white border-[#b90064]'
                        : 'bg-white text-[#594047] border-[#e8e8e8]'
                    }`}
                  >
                    {text}
                  </button>
                ))}
                <input
                  type="text"
                  maxLength={16}
                  placeholder="Custom Brand Name..."
                  value={customText}
                  onChange={(e) => {
                    setCustomText(e.target.value.toUpperCase());
                    setLabelText(e.target.value.toUpperCase() as any);
                  }}
                  className="w-full bg-white border border-[#e8e8e8] rounded-xl px-2.5 py-1 text-[11px] outline-none font-extrabold text-zinc-950"
                />
              </div>
            </div>

            {/* parameter 5: label theme coloring */}
            <div className="space-y-1.5">
              <label className="font-bold text-zinc-950 block">Label Palette Aesthetics</label>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { theme: 'rose' as const, label: 'Warm Rose', colorCode: '#fff1f2' },
                  { theme: 'mint' as const, label: 'Active Mint', colorCode: '#f0fdf4' },
                  { theme: 'gold' as const, label: 'Royal Gold', colorCode: '#fefce8' },
                  { theme: 'black' as const, label: 'Luxury Onyx', colorCode: '#1c1b1b' }
                ].map((item) => (
                  <button
                    key={item.theme}
                    onClick={() => setLabelTheme(item.theme)}
                    className={`p-2 border rounded-xl cursor-pointer transition-all ${
                      labelTheme === item.theme
                        ? 'bg-[#b90064] text-white border-[#b90064]'
                        : 'bg-white text-[#594047] border-[#e8e8e8] hover:bg-[#fde7f3]'
                    }`}
                  >
                    <div className="w-5 h-5 rounded mx-auto border mb-1" style={{ backgroundColor: item.colorCode }}></div>
                    <span className="text-[10px] font-bold block">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* parameter 6: fluid color */}
            <div className="space-y-1.5">
              <label className="font-bold text-zinc-950 block">Cosmetic Fluid Base Tint</label>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { fluid: 'pink' as const, label: 'Rose Gold', rgb: '#fbcfe8' },
                  { fluid: 'amber' as const, label: 'Vitamin C', rgb: '#fef3c7' },
                  { fluid: 'clear' as const, label: 'Serum Clear', rgb: '#eff6ff' },
                  { fluid: 'milky' as const, label: 'Milky Emulsion', rgb: '#f4f4f5' }
                ].map((item) => (
                  <button
                    key={item.fluid}
                    onClick={() => setFluidColor(item.fluid)}
                    className={`p-2 border rounded-xl cursor-pointer transition-all ${
                      fluidColor === item.fluid
                        ? 'bg-[#b90064] text-white border-[#b90064]'
                        : 'bg-white text-[#594047] border-[#e8e8e8] hover:bg-[#fde7f3]'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full mx-auto border mb-1" style={{ backgroundColor: item.rgb }}></div>
                    <span className="text-[10px] font-bold block">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSaveDesign}
              className="w-full py-3 bg-[#b90064] hover:bg-[#8e004b] text-white font-extrabold text-[13px] rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Settle Customizer Specs</span>
            </button>

          </div>
        </div>

        {/* R-SIDE: Interactive Visual Bottle Canvas (col-span-7) */}
        <div className="lg:col-span-7 border border-[#e8e8e8] rounded-3xl p-8 bg-white shadow-sm flex flex-col justify-between items-center min-h-[580px]">
          
          <div className="w-full flex justify-between items-center text-[12px] font-bold text-[#8c7077] pb-4 border-b border-zinc-100">
            <span>Visual private label preview</span>
            <span className="text-[#0050d6] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Aseptic 3D Rendering Online
            </span>
          </div>

          {/* THE BOTTLE CONTAINER (Pure CSS Interactive Artistry) */}
          <div className="my-10 flex flex-col items-center justify-center relative">
            
            {/* 1. THE DROPPER PIPETTE SUCTION BULB / PUMP OUTLINE */}
            {pumpType === 'dropper' && (
              <div className="relative z-20 flex flex-col items-center -mb-[2px]">
                {/* Rubber bulb head */}
                <div className="w-7 h-8 bg-white border border-zinc-300 rounded-t-full shadow-xs"></div>
                {/* Pipette glass neck base */}
                <div className="w-6 h-1 bg-zinc-200 border-x border-zinc-300"></div>
              </div>
            )}

            {pumpType === 'spray' && (
              <div className="relative z-20 flex flex-col items-center -mb-[2px]">
                {/* Spray nozzle trigger */}
                <div className="w-5 h-6 bg-gradient-to-t from-zinc-200 to-zinc-50 border border-zinc-300 rounded-md relative shadow-xs">
                  {/* Mist nozzle outlet hole */}
                  <div className="absolute right-0.5 top-1.5 w-1 h-1.5 bg-zinc-950 rounded-sm"></div>
                </div>
                {/* Neck adaptor */}
                <div className="w-6 h-2 bg-zinc-300 border-x border-zinc-400"></div>
              </div>
            )}

            {pumpType === 'disc' && (
              <div className="relative z-20 flex flex-col items-center -mb-[2px]">
                {/* Disc top press cap */}
                <div className="w-10 h-3 bg-gradient-to-t from-zinc-300 via-zinc-100 to-zinc-50 border border-zinc-300 rounded-t-sm shadow-xs relative">
                  <div className="absolute right-1 top-0 w-4 h-1 bg-[#1c1b1b] rounded-sm"></div>
                </div>
              </div>
            )}

            {/* 2. THE CAP COLLAR */}
            <div className={`w-12 h-6 border-x border-t rounded-t-sm z-10 -mb-[1px] relative transition-all duration-300 ${capColorStyles[capColor]}`}>
              {/* Vertical rib lines on cap */}
              <div className="absolute inset-y-0 left-2 w-[1px] bg-white/30"></div>
              <div className="absolute inset-y-0 left-4 w-[1px] bg-white/30"></div>
              <div className="absolute inset-y-0 left-6 w-[1px] bg-white/30"></div>
              <div className="absolute inset-y-0 right-4 w-[1px] bg-white/30"></div>
              <div className="absolute inset-y-0 right-2 w-[1px] bg-white/30"></div>
            </div>

            {/* 3. THE BOTTLE BODY SHELL */}
            <div
              className={`w-36 h-64 border-x border-y border-zinc-300/60 shadow-xl overflow-hidden flex flex-col items-center justify-center relative transition-all duration-500 bg-white/40 backdrop-blur-[3px] ${
                bottleShape === 'boston'
                  ? 'rounded-t-[36px] rounded-b-xl'
                  : bottleShape === 'cylinder'
                  ? 'rounded-t-lg rounded-b-lg'
                  : 'rounded-t-sm rounded-b-sm'
              }`}
            >
              
              {/* Glass shine reflections overlay */}
              <div className="absolute top-0 bottom-0 left-2 w-4 bg-gradient-to-r from-white/30 via-white/10 to-transparent z-10 pointer-events-none"></div>
              <div className="absolute top-0 bottom-0 right-2 w-1.5 bg-white/10 z-10 pointer-events-none"></div>

              {/* 4. THE LIQUID INNER LAYER */}
              <div className={`absolute inset-0 z-0 transition-all duration-500 ${fluidColorStyles[fluidColor]}`} />

              {/* Glass Pipette tube inside (rendered only for dropper) */}
              {pumpType === 'dropper' && (
                <div className="absolute top-0 bottom-4 w-1.5 bg-white/70 border-x border-zinc-400/20 z-0 flex flex-col justify-end">
                  {/* Tip of pipette */}
                  <div className="w-1 h-3 bg-zinc-300/40 rounded-b-full self-center"></div>
                </div>
              )}

              {/* 5. THE BRAND LABEL CONTAINER */}
              <div
                className={`w-[85%] h-32 border z-10 rounded-sm flex flex-col items-center justify-center text-center p-3 relative select-none transition-all duration-500 ${labelThemeStyles[labelTheme]}`}
              >
                {/* Fine geometric layout border inside label */}
                <div className="absolute inset-1.5 border border-current opacity-20 pointer-events-none"></div>

                <span className="text-[7px] font-mono tracking-widest uppercase opacity-70">
                  ESTD 2026
                </span>
                
                <h4 className="font-extrabold text-[12px] tracking-widest leading-none my-1">
                  {labelText || 'NEXORA LUXE'}
                </h4>

                <div className="w-8 h-[1px] bg-current opacity-40 my-1"></div>

                <span className="text-[6.5px] font-mono tracking-wider opacity-80 uppercase">
                  Aseptic Laboratory Sourcing
                </span>

                <span className="text-[5.5px] font-mono tracking-normal opacity-60 uppercase block mt-1.5">
                  50ml / 1.7 FL. OZ
                </span>
              </div>

            </div>

          </div>

          {/* Quick Specifications list below canvas */}
          <div className="w-full p-4 bg-[#fcf9f8] rounded-2xl border border-[#e8e8e8] text-[12px] text-[#594047] font-semibold grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <span className="block text-[10px] text-[#8c7077] uppercase font-bold">Silhouette</span>
              <span className="text-zinc-950 capitalize">{bottleShape} Shape</span>
            </div>
            <div>
              <span className="block text-[10px] text-[#8c7077] uppercase font-bold">Cap Mechanism</span>
              <span className="text-zinc-950 capitalize">{pumpType}</span>
            </div>
            <div>
              <span className="block text-[10px] text-[#8c7077] uppercase font-bold">Collar Finish</span>
              <span className="text-zinc-950 capitalize">{capColor} metal</span>
            </div>
            <div>
              <span className="block text-[10px] text-[#8c7077] uppercase font-bold">Aesthetic Label</span>
              <span className="text-zinc-950 capitalize">{labelTheme} motif</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
