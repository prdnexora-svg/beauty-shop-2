import React, { useState } from 'react';
import {
  Building2,
  Cpu,
  TrendingUp,
  Truck,
  Box,
  MapPin,
  Clock,
  Sparkles,
  Search,
  CheckCircle2,
  FileCheck2,
  PlusCircle,
  Coins,
  AlertCircle,
  Trash2,
  ChevronRight,
  Calculator,
  Compass,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';

interface RFQLead {
  id: string;
  product: string;
  buyer: string;
  volumeNeeded: string;
  category: string;
  leadTimeRequested: string;
  budgetEstimated: string;
  status: 'open' | 'quoted';
}

export const SupplierAdminPortal: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'capacity' | 'catalog' | 'leads' | 'logistics'>('capacity');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showLocalToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Plant Capacity States
  const [plantCapacity, setPlantCapacity] = useState({
    activeBatchCapacity: 84, // percentage
    compoundingLiquidOutput: 4500, // Liters per day
    packagingLinesActive: 3, // out of 4
    sterilizationLevel: '100% Class 10,000 ISO Cleanroom Verified'
  });

  const [capacityLogs, setCapacityLogs] = useState([
    { id: 'log-1', timestamp: '10:15 AM', type: 'Sterilization', message: 'Cleanroom HVAC pressure system calibrated. Ambient moisture 42%.' },
    { id: 'log-2', timestamp: '08:30 AM', type: 'Batch Release', message: 'Batch AR-229 (Retinol Serum Base) passed NABL laboratory assay tests.' }
  ]);

  const [newLogType, setNewLogType] = useState('Production');
  const [newLogMsg, setNewLogMsg] = useState('');

  const handleAddCapacityLog = () => {
    if (!newLogMsg.trim()) return;
    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: newLogType,
      message: newLogMsg.trim()
    };
    setCapacityLogs([newLog, ...capacityLogs]);
    setNewLogMsg('');
    showLocalToast('Plant capacity log registered successfully.');
  };

  // 2. Bulk Catalog States
  const [catalogItems, setCatalogItems] = useState([
    { id: 'cat-1', name: 'Niacinamide 10% + Zinc 1% Formulation Base', priceRange: '₹140 - ₹180', moq: '1,000 Liters', plantHub: 'Ahmedabad Plant' },
    { id: 'cat-2', name: 'Hydrating Botanical Cleanser Base (SLS Free)', priceRange: '₹85 - ₹120', moq: '500 Liters', plantHub: 'Mumbai Plant' }
  ]);

  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemMoq, setNewItemMoq] = useState('');
  const [newItemHub, setNewItemHub] = useState('Mumbai Plant');

  const handleAddCatalogItem = () => {
    if (!newItemName || !newItemPrice || !newItemMoq) {
      showLocalToast('Please fill all catalog parameters.');
      return;
    }
    const item = {
      id: `cat-${Date.now()}`,
      name: newItemName,
      priceRange: newItemPrice,
      moq: newItemMoq,
      plantHub: newItemHub
    };
    setCatalogItems([...catalogItems, item]);
    setNewItemName('');
    setNewItemPrice('');
    setNewItemMoq('');
    showLocalToast('New product catalog specification compiled!');
  };

  const handleDeleteCatalogItem = (id: string) => {
    setCatalogItems(catalogItems.filter(i => i.id !== id));
    showLocalToast('Catalog specification unlisted.');
  };

  // 3. Live RFQs Pipeline
  const [rfqLeads, setRfqLeads] = useState<RFQLead[]>([
    { id: 'rfq-2210', product: 'Private Label Organic Sunscreen SPF 50', buyer: 'Glitz & Glow Cosmetics (New Delhi)', volumeNeeded: '5,000 Tubes (50ml)', category: 'OEM Sunscreens', leadTimeRequested: '20 Days', budgetEstimated: '₹4,50,000', status: 'open' },
    { id: 'rfq-2211', product: 'Keratin Nourishing Hair Masque Base', buyer: 'Vogue Salon Group (Mumbai)', volumeNeeded: '2,000 Liters (Bulk Drums)', category: 'Haircare Formulations', leadTimeRequested: '15 Days', budgetEstimated: '₹6,00,000', status: 'open' }
  ]);

  const handleQuoteRfq = (id: string) => {
    setRfqLeads(rfqLeads.map(r => r.id === id ? { ...r, status: 'quoted' } : r));
    showLocalToast('Commercial quote compiled and sent to buyer!');
  };

  // 4. Logistics & Freight Calculator States
  const [originHub, setOriginHub] = useState('Mumbai Plant');
  const [destinationCity, setDestinationCity] = useState('Bangalore, KA');
  const [shippingTier, setShippingTier] = useState<'Air' | 'Surface' | 'Ocean'>('Air');
  const [sourcingWeight, setSourcingWeight] = useState(1500); // Kilograms
  const [calculatedFreight, setCalculatedFreight] = useState<{
    baseRate: number;
    surcharges: number;
    fuelTax: number;
    grandTotal: number;
    transitDays: string;
    co2Estimate: string;
    logisticsPartner: string;
  } | null>(null);

  const handleCalculateFreight = () => {
    // Standard calculation simulation
    let perKgRate = 35; // base rate per kg
    let logisticsPartner = 'Delhivery B2B Express Cargo';
    let transitDays = '5-6 Days';
    let co2 = '112 kg CO2 (Green Settle)';

    if (shippingTier === 'Air') {
      perKgRate = 120;
      logisticsPartner = 'Blue Dart Premium Air Aviation';
      transitDays = '2-3 Days';
      co2 = '420 kg CO2 (High Velocity)';
    } else if (shippingTier === 'Ocean') {
      perKgRate = 18;
      logisticsPartner = 'Maersk B2B Sea Carrier Hub';
      transitDays = '10-12 Days';
      co2 = '45 kg CO2 (Lowest footprint)';
    }

    const baseRate = perKgRate * sourcingWeight;
    const surcharges = Math.round(baseRate * 0.08); // 8% octroi / plant gate passes
    const fuelTax = Math.round(baseRate * 0.18); // 18% GST & fuel adjustment
    const grandTotal = baseRate + surcharges + fuelTax;

    setCalculatedFreight({
      baseRate,
      surcharges,
      fuelTax,
      grandTotal,
      transitDays,
      co2Estimate: co2,
      logisticsPartner
    });
    showLocalToast('Freight freight rates computed via NSDL cargo routing!');
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#eee7ea] text-[#1c1b1b] font-bold text-[11px] uppercase tracking-wider mb-2">
            <Building2 className="w-3.5 h-3.5 text-[#b90064]" />
            <span>Supplier &amp; Manufacturer Workspace</span>
          </div>
          <h1 className="text-3xl font-black text-[#1c1b1b] tracking-tight">
            Enterprise Sourcing Hub
          </h1>
          <p className="text-[14px] text-[#594047] font-semibold mt-1">
            Track active aseptic compounding capacity, update raw material catalogs, bid on incoming RFQs, and compute logistics freight routing.
          </p>
        </div>

        <div className="flex items-center gap-2.5 bg-[#fdf8f8] border border-[#e8e8e8] px-4 py-3 rounded-xl">
          <div className="w-2.5 h-2.5 bg-emerald-600 rounded-full animate-ping"></div>
          <span className="text-[12.5px] font-bold text-zinc-950">Plant Status: <span className="text-emerald-700 font-black">NABL Certified &amp; Operational</span></span>
        </div>
      </div>

      {/* Dashboard Sub-Tabs Navigation */}
      <div className="flex border-b border-[#e8e8e8] mb-6 overflow-x-auto whitespace-nowrap scrollbar-none">
        <button
          onClick={() => setActiveSubTab('capacity')}
          className={`pb-4 px-1 text-[13.5px] font-bold mr-8 transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'capacity'
              ? 'text-[#b90064] border-b-2 border-[#b90064]'
              : 'text-[#594047] hover:text-[#1c1b1b]'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Plant Compounding Capacity</span>
        </button>

        <button
          onClick={() => setActiveSubTab('catalog')}
          className={`pb-4 px-1 text-[13.5px] font-bold mr-8 transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'catalog'
              ? 'text-[#b90064] border-b-2 border-[#b90064]'
              : 'text-[#594047] hover:text-[#1c1b1b]'
          }`}
        >
          <Box className="w-4 h-4" />
          <span>Bulk Catalog Specifications</span>
        </button>

        <button
          onClick={() => setActiveSubTab('leads')}
          className={`pb-4 px-1 text-[13.5px] font-bold mr-8 transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'leads'
              ? 'text-[#b90064] border-b-2 border-[#b90064]'
              : 'text-[#594047] hover:text-[#1c1b1b]'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Live RFQ Lead Pipeline</span>
          <span className="text-[10px] bg-[#fde7f3] text-[#b90064] px-1.5 py-0.5 rounded-full font-bold">
            {rfqLeads.filter(r => r.status === 'open').length} New
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('logistics')}
          className={`pb-4 px-1 text-[13.5px] font-bold mr-8 transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'logistics'
              ? 'text-[#b90064] border-b-2 border-[#b90064]'
              : 'text-[#594047] hover:text-[#1c1b1b]'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Freight &amp; Logistics Calculator</span>
        </button>
      </div>

      {/* SUB-TAB CONTENTS */}

      {/* 1. PLANT CAPACITY */}
      {activeSubTab === 'capacity' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Status Gauges */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-[#e8e8e8] p-5 rounded-2xl text-left">
                <span className="text-[11px] font-extrabold text-[#8c7077] uppercase">Aseptic Batch Capacity</span>
                <div className="text-3xl font-black text-[#b90064] mt-1.5">{plantCapacity.activeBatchCapacity}%</div>
                <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden mt-3">
                  <div className="bg-[#b90064] h-2 rounded-full" style={{ width: `${plantCapacity.activeBatchCapacity}%` }}></div>
                </div>
                <span className="text-[10.5px] text-[#594047] font-semibold mt-2.5 block">16% Available compounding headroom</span>
              </div>

              <div className="bg-white border border-[#e8e8e8] p-5 rounded-2xl text-left">
                <span className="text-[11px] font-extrabold text-[#8c7077] uppercase">Daily Liquid Out-Turn</span>
                <div className="text-3xl font-black text-zinc-950 mt-1.5">{plantCapacity.compoundingLiquidOutput.toLocaleString()} L</div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block mt-3 uppercase tracking-wider">
                  NABL Standards
                </span>
                <span className="text-[10.5px] text-[#594047] font-semibold mt-2.5 block">Liquid cosmetics and emulsification</span>
              </div>

              <div className="bg-white border border-[#e8e8e8] p-5 rounded-2xl text-left">
                <span className="text-[11px] font-extrabold text-[#8c7077] uppercase">Packaging Line Status</span>
                <div className="text-3xl font-black text-[#0050d6] mt-1.5">{plantCapacity.packagingLinesActive} / 4</div>
                <div className="flex gap-1.5 mt-3">
                  {[1, 2, 3, 4].map((line) => (
                    <span key={line} className={`w-3.5 h-3.5 rounded-sm inline-block ${
                      line <= plantCapacity.packagingLinesActive ? 'bg-[#0050d6]' : 'bg-zinc-200'
                    }`} />
                  ))}
                </div>
                <span className="text-[10.5px] text-[#594047] font-semibold mt-2.5 block">Lines 1, 2, 3: Aseptic tube packing</span>
              </div>
            </div>

            {/* Compliance details banner */}
            <div className="p-4 rounded-xl border bg-amber-50 border-amber-200/70 text-[12.5px] text-amber-900 font-semibold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
              <span>Plant facility matches: <strong className="text-amber-950">{plantCapacity.sterilizationLevel}</strong>. Continuous environmental tracking enabled.</span>
            </div>

            {/* Machinery Maintenance & Plant Logs */}
            <div className="bg-white border border-[#e8e8e8] p-6 rounded-2xl space-y-4">
              <h3 className="font-bold text-base text-zinc-950">Cleanroom Sourcing &amp; Plant Operations Log</h3>
              
              <div className="space-y-3">
                {capacityLogs.map((log) => (
                  <div key={log.id} className="p-3.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-[12.5px] flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10.5px] font-mono font-bold text-zinc-950 bg-white border px-1.5 py-0.5 rounded uppercase">
                          {log.type}
                        </span>
                        <span className="text-[11px] text-[#8c7077] font-semibold">{log.timestamp}</span>
                      </div>
                      <p className="text-[#594047] font-medium">{log.message}</p>
                    </div>
                    <span className="text-[10.5px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold uppercase">
                      Pass
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Add Sourcing Plant Log Form */}
          <div className="bg-[#fcf9f8] border border-[#e8e8e8] p-5 rounded-2xl space-y-4 h-fit">
            <h4 className="font-bold text-[14px] text-zinc-950 uppercase tracking-wider">
              Register Plant Operation Log
            </h4>

            <div className="space-y-4 text-[12.5px]">
              <div className="space-y-1.5">
                <label className="font-bold text-zinc-950">Log Classification</label>
                <select
                  value={newLogType}
                  onChange={(e) => setNewLogType(e.target.value)}
                  className="w-full bg-white border border-[#e8e8e8] p-2 rounded-lg font-semibold"
                >
                  <option value="Production">Batch Compounding Settle</option>
                  <option value="Sterilization">ISO Cleanroom Humidification</option>
                  <option value="Packaging">Line 3 Tube Calibration</option>
                  <option value="NABL Assay">Swiss Formulation Validation</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-zinc-950">Sourcing Log Message</label>
                <textarea
                  value={newLogMsg}
                  onChange={(e) => setNewLogMsg(e.target.value)}
                  rows={4}
                  placeholder="Enter precise calibration details or batch safety metrics..."
                  className="w-full bg-white border border-[#e8e8e8] focus:border-[#b90064] p-3 rounded-xl outline-none font-medium text-zinc-950 resize-none"
                />
              </div>

              <button
                onClick={handleAddCapacityLog}
                className="w-full py-2.5 bg-[#b90064] hover:bg-[#8e004b] text-white font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Submit Sourcing Log</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. BULK CATALOG SPECIFICATIONS */}
      {activeSubTab === 'catalog' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] font-extrabold text-[#8c7077] uppercase tracking-wider">Currently Listed Formulations ({catalogItems.length})</span>
              <span className="text-[11px] text-[#0050d6] font-bold">Listed on Nexora B2B Grid</span>
            </div>

            {catalogItems.map((item) => (
              <div key={item.id} className="bg-white border border-[#e8e8e8] rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-shadow">
                <div>
                  <h3 className="text-base font-bold text-zinc-950 tracking-tight">{item.name}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-[10.5px] bg-[#f0edec] text-[#594047] font-extrabold uppercase px-2 py-0.5 rounded">
                      Plant: {item.plantHub}
                    </span>
                    <span className="text-[10.5px] bg-[#e6f0ff] text-[#0050d6] font-extrabold uppercase px-2 py-0.5 rounded">
                      MOQ: {item.moq}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-stretch sm:self-auto justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-100">
                  <div className="text-right">
                    <span className="text-[10px] text-[#8c7077] font-bold block uppercase">Estimated Wholesaling Rate</span>
                    <strong className="text-base font-black text-[#b90064]">{item.priceRange} / L</strong>
                  </div>

                  <button
                    onClick={() => handleDeleteCatalogItem(item.id)}
                    className="p-2 text-zinc-400 hover:text-[#b90064] hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Unlist item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Sourcing Specification Form */}
          <div className="bg-[#fcf9f8] border border-[#e8e8e8] p-5 rounded-2xl space-y-4 h-fit">
            <h4 className="font-bold text-[14px] text-zinc-950 uppercase tracking-wider">
              List Bulk Formulation Specification
            </h4>

            <div className="space-y-4 text-[12.5px]">
              <div className="space-y-1.5">
                <label className="font-bold text-zinc-950">Formulation / Base Chemical Name</label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="E.g., Salicylic Acid 2% Exfoliating Cleanser"
                  className="w-full bg-white border border-[#e8e8e8] p-2.5 rounded-lg font-semibold text-zinc-950 outline-none focus:border-[#b90064]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-950">Price Range (Litre)</label>
                  <input
                    type="text"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    placeholder="E.g., ₹120 - ₹150"
                    className="w-full bg-white border border-[#e8e8e8] p-2.5 rounded-lg font-semibold text-zinc-950 outline-none focus:border-[#b90064]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-950">Minimum Order Size</label>
                  <input
                    type="text"
                    value={newItemMoq}
                    onChange={(e) => setNewItemMoq(e.target.value)}
                    placeholder="E.g., 500 Liters"
                    className="w-full bg-white border border-[#e8e8e8] p-2.5 rounded-lg font-semibold text-zinc-950 outline-none focus:border-[#b90064]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-zinc-950">Target Sourcing Compounding Plant</label>
                <select
                  value={newItemHub}
                  onChange={(e) => setNewItemHub(e.target.value)}
                  className="w-full bg-white border border-[#e8e8e8] p-2 rounded-lg font-semibold"
                >
                  <option value="Mumbai Plant">Mumbai Plant Hub (Cosmeceuticals)</option>
                  <option value="Ahmedabad Plant">Ahmedabad Plant Hub (Actives &amp; Serums)</option>
                  <option value="Delhi NCR Plant">Delhi NCR Plant Hub (Packaging &amp; Aerosols)</option>
                </select>
              </div>

              <button
                onClick={handleAddCatalogItem}
                className="w-full py-2.5 bg-[#b90064] hover:bg-[#8e004b] text-white font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>List Product Catalog Specification</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* 3. LIVE RFQ LEADS */}
      {activeSubTab === 'leads' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-extrabold text-[#8c7077] uppercase tracking-wider">Broadcasting RFQs Matching Category ({rfqLeads.length})</span>
            <span className="text-[11.5px] text-[#0050d6] font-bold">Auto-matched from New Delhi &amp; Mumbai Sourcing desks</span>
          </div>

          <div className="space-y-4">
            {rfqLeads.map((rfq) => (
              <div key={rfq.id} className="bg-white border border-[#e8e8e8] rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-4 border-b border-[#f0edec]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10.5px] font-mono font-bold text-[#8c7077] bg-[#f0edec] px-2 py-0.5 rounded">
                        LEAD ID: {rfq.id}
                      </span>
                      <span className="text-[11px] font-extrabold uppercase text-[#0050d6] tracking-wider">
                        {rfq.category}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-zinc-950 mt-2 tracking-tight">
                      {rfq.product}
                    </h3>
                    <p className="text-[12.5px] text-[#594047] font-semibold mt-0.5">
                      Requested by: <strong className="text-zinc-950">{rfq.buyer}</strong>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-[#8c7077] font-bold block uppercase">Estimated Budget</span>
                    <strong className="text-base font-black text-[#b90064]">{rfq.budgetEstimated}</strong>
                  </div>
                </div>

                <div className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-[12.5px] text-[#594047] font-medium">
                  <div>
                    <span className="block text-[10px] text-[#8c7077] uppercase font-bold">Volume Required</span>
                    <span className="text-zinc-950 font-bold">{rfq.volumeNeeded}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#8c7077] uppercase font-bold">Delivery Lead Time Target</span>
                    <span className="text-zinc-950 font-bold">{rfq.leadTimeRequested}</span>
                  </div>
                  <div className="sm:border-l sm:pl-4 border-zinc-100">
                    <span className="block text-[10px] text-emerald-700 uppercase font-bold">Compliance Required</span>
                    <span className="text-emerald-800 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      CDSCO Standard Assay
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#f0edec] flex justify-between items-center">
                  <span className="text-[11px] text-[#8c7077] font-medium">
                    ▲ Placing quote submits factory technical specification and NABL batch history automatically.
                  </span>

                  {rfq.status === 'open' ? (
                    <button
                      onClick={() => handleQuoteRfq(rfq.id)}
                      className="bg-[#b90064] hover:bg-[#8e004b] text-white text-[12px] font-bold py-2 px-5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 active:scale-98"
                    >
                      <FileCheck2 className="w-4 h-4" />
                      <span>Compile &amp; Send Sourcing Quote</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[12px] font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Quote Sent Successfully (Active Bid)</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. LOGISTICS & FREIGHT CALCULATOR */}
      {activeSubTab === 'logistics' && (
        <div className="space-y-6">
          <div className="bg-[#e6f0ff] border border-[#bfdbfe] p-4 rounded-xl flex items-start gap-3">
            <Truck className="w-5 h-5 text-[#0050d6] shrink-0 mt-0.5" />
            <div className="text-[13px] text-[#0050d6] font-medium">
              <strong className="font-bold">Pan-India Freight Rate Estimator:</strong> Calculate transport logistics across Mumbai, Baddi, New Delhi, and Ahmedabad plants directly to South, East, and West India buyer hubs. Our estimates integrate GST and local octroi levies.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Input Config Form (col-span-5) */}
            <div className="lg:col-span-5 bg-[#fcf9f8] border border-[#e8e8e8] p-5 rounded-2xl space-y-4">
              <h3 className="font-bold text-base text-zinc-950 flex items-center gap-1.5 pb-2 border-b">
                <Calculator className="w-5 h-5 text-[#b90064]" />
                Freight Parameter Configuration
              </h3>

              <div className="space-y-4 text-[12.5px]">
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-zinc-950">Origin Plant Hub</label>
                    <select
                      value={originHub}
                      onChange={(e) => setOriginHub(e.target.value)}
                      className="w-full bg-white border border-[#e8e8e8] p-2.5 rounded-lg font-semibold"
                    >
                      <option value="Mumbai Plant">Mumbai (West)</option>
                      <option value="Ahmedabad Plant">Ahmedabad (West)</option>
                      <option value="Delhi NCR Plant">Delhi NCR (North)</option>
                      <option value="Baddi Plant">Baddi (North India Hub)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-zinc-950">Destination Hub</label>
                    <select
                      value={destinationCity}
                      onChange={(e) => setDestinationCity(e.target.value)}
                      className="w-full bg-white border border-[#e8e8e8] p-2.5 rounded-lg font-semibold"
                    >
                      <option value="Bangalore, KA">Bangalore, Karnataka</option>
                      <option value="Hyderabad, TS">Hyderabad, Telangana</option>
                      <option value="Chennai, TN">Chennai, Tamil Nadu</option>
                      <option value="Kolkata, WB">Kolkata, West Bengal</option>
                      <option value="Cochin, KL">Cochin, Kerala</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-950">Logistics Shipping Tier</label>
                  <div className="grid grid-cols-3 gap-2 text-center font-bold">
                    {[
                      { tier: 'Air', label: 'Air Premium', desc: 'Urgent' },
                      { tier: 'Surface', label: 'Surface Cargo', desc: 'Secure' },
                      { tier: 'Ocean', label: 'Sea Cargo', desc: 'Lowest Rate' }
                    ].map((item) => (
                      <button
                        key={item.tier}
                        onClick={() => setShippingTier(item.tier as any)}
                        className={`p-2.5 border rounded-xl transition-all flex flex-col justify-center items-center cursor-pointer ${
                          shippingTier === item.tier
                            ? 'bg-[#b90064] text-white border-[#b90064]'
                            : 'bg-white text-[#594047] border-[#e8e8e8] hover:bg-[#fde7f3]'
                        }`}
                      >
                        <span className="text-[12px] block font-black">{item.label}</span>
                        <span className="text-[9.5px] font-medium opacity-90">{item.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[12px]">
                    <label className="font-bold text-zinc-950">Sourcing Gross Weight (KG / Liters)</label>
                    <span className="text-[10px] text-[#8c7077] font-semibold">Minimum: 100 kg</span>
                  </div>
                  <input
                    type="number"
                    value={sourcingWeight}
                    onChange={(e) => setSourcingWeight(Math.max(100, Number(e.target.value)))}
                    placeholder="Enter gross batch weight in KGs"
                    className="w-full bg-white border border-[#e8e8e8] focus:border-[#b90064] p-2.5 rounded-lg font-bold outline-none"
                  />
                </div>

                <button
                  onClick={handleCalculateFreight}
                  className="w-full py-3 bg-[#0050d6] hover:bg-[#003da8] text-white font-extrabold text-[13px] rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <Calculator className="w-4 h-4" />
                  <span>Compute Sourcing Freight Charges</span>
                </button>

              </div>
            </div>

            {/* Calculations Result Screen (col-span-7) */}
            <div className="lg:col-span-7 border border-[#e8e8e8] rounded-2xl p-6 h-full flex flex-col justify-center bg-white min-h-[300px]">
              {calculatedFreight ? (
                <div className="space-y-5 text-left">
                  <div className="flex justify-between items-center pb-3 border-b">
                    <div>
                      <span className="text-[10px] text-[#8c7077] font-bold block uppercase">Assigned B2B Carrier Partner</span>
                      <strong className="text-[14px] text-zinc-950 flex items-center gap-1">
                        <Truck className="w-4.5 h-4.5 text-[#0050d6]" />
                        {calculatedFreight.logisticsPartner}
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-[#8c7077] font-bold block uppercase">Estimated Transit Days</span>
                      <span className="text-[13px] bg-emerald-50 text-emerald-700 font-extrabold px-2.5 py-0.5 rounded border border-emerald-200">
                        {calculatedFreight.transitDays}
                      </span>
                    </div>
                  </div>

                  {/* Calculations Sheet */}
                  <div className="space-y-3 text-[13px] text-[#594047] font-semibold">
                    <div className="flex justify-between">
                      <span>Base Transport Rate ({sourcingWeight} KGs):</span>
                      <span className="text-zinc-950 font-bold">₹{calculatedFreight.baseRate.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Facility Gate Passes &amp; Octroi:</span>
                      <span className="text-zinc-950 font-bold">₹{calculatedFreight.surcharges.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST, Fuel Surcharge, &amp; Toll Settle:</span>
                      <span className="text-zinc-950 font-bold">₹{calculatedFreight.fuelTax.toLocaleString('en-IN')}</span>
                    </div>
                    
                    <div className="pt-3 border-t flex justify-between items-center text-zinc-950 font-extrabold text-base">
                      <span className="flex items-center gap-1">
                        <Coins className="w-5 h-5 text-zinc-400" />
                        Grand Total Freight Cost:
                      </span>
                      <span className="text-xl font-black text-[#b90064]">₹{calculatedFreight.grandTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Eco Footprint */}
                  <div className="p-4 bg-emerald-50 border border-[#a3cfb1] rounded-xl flex items-center gap-2.5 text-[12px] text-emerald-900 font-semibold">
                    <Compass className="w-5 h-5 text-emerald-700 shrink-0" />
                    <div>
                      <span>Environmental Carbon Footprint Audit: </span>
                      <span className="text-emerald-800 font-black">{calculatedFreight.co2Estimate}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#8c7077] font-medium leading-relaxed">
                    *Freight routing calculations are based on standard carrier contracts. In-app purchase checkouts are not available; logistics cost will be appended directly to the final supplier Proforma Invoice.
                  </p>

                </div>
              ) : (
                <div className="text-center space-y-3.5">
                  <div className="w-12 h-12 rounded-full bg-[#fdf8f8] border border-[#e8e8e8] flex items-center justify-center mx-auto text-[#b90064]">
                    <Calculator className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold text-zinc-950">Awaiting Freight Calibration</h4>
                    <p className="text-[12px] text-[#594047] max-w-[280px] mx-auto mt-1 font-medium">
                      Select custom plant origins, gross weight parameter and shipping speed tier to compute bulk commercial shipping costs.
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
