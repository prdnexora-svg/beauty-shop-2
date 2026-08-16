import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  UserCheck,
  Building2,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Coins,
  FileCheck2,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Info,
  Clock,
  PlusCircle,
  AlertCircle,
  ThumbsUp,
  X,
  FileText,
  BadgePercent,
  TrendingDown,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Conversation {
  id: string;
  supplierName: string;
  avatar: string;
  location: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  isOnline: boolean;
  activeQuote: {
    id: string;
    productName: string;
    originalPrice: number;
    originalMoq: number;
    shippingLeadTime: string;
    status: 'received' | 'countered' | 'approved' | 'rejected';
    counterPrice?: number;
    counterMoq?: number;
    counterRemarks?: string;
  } | null;
}

export const NegotiationInboxScreen: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 'c-1',
      supplierName: 'Aura Beauty Labs',
      avatar: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=100&q=80',
      location: 'Mumbai, Maharashtra',
      lastMessage: 'Sure, we can customize the Peptide Barrier formulation to include 1.5% Ceramide concentration.',
      time: '10:45 AM',
      unreadCount: 2,
      isOnline: true,
      activeQuote: {
        id: 'QT-9921',
        productName: 'Botanical Peptide Barrier Cream (Bulk Sourcing Run)',
        originalPrice: 240, // per unit
        originalMoq: 2000,
        shippingLeadTime: '12 Days',
        status: 'received'
      }
    },
    {
      id: 'c-2',
      supplierName: 'Dermaglow India',
      avatar: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=100&q=80',
      location: 'Ahmedabad, Gujarat',
      lastMessage: 'The heavy metal assay report has been uploaded to your secure compliance vault.',
      time: 'Yesterday',
      unreadCount: 0,
      isOnline: false,
      activeQuote: {
        id: 'QT-8814',
        productName: 'Professional Retinol 1% Serum Base',
        originalPrice: 190,
        originalMoq: 1000,
        shippingLeadTime: '10 Days',
        status: 'approved',
        counterPrice: 180,
        counterMoq: 1000
      }
    },
    {
      id: 'c-3',
      supplierName: 'LuxeForm Cosmetics',
      avatar: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=100&q=80',
      location: 'Delhi NCR',
      lastMessage: 'We would request you to look at our custom frosted bottle catalog before final production.',
      time: '3 days ago',
      unreadCount: 0,
      isOnline: true,
      activeQuote: null
    }
  ]);

  const [selectedConvoId, setSelectedConvoId] = useState<string>('c-1');
  const [messages, setMessages] = useState<Record<string, Array<{
    id: string;
    sender: 'supplier' | 'buyer' | 'system';
    text: string;
    time: string;
    quoteOffer?: {
      id: string;
      productName: string;
      price: number;
      moq: number;
      leadTime: string;
      status: string;
    };
  }>>>({
    'c-1': [
      {
        id: 'm-1-1',
        sender: 'supplier',
        text: 'Hello! Thank you for reviewing our commercial capabilities. We have received your preliminary formulation request and compiled a primary factory quote for the Peptide Barrier Cream formulation.',
        time: '10:30 AM'
      },
      {
        id: 'm-1-2',
        sender: 'supplier',
        text: 'Here is our primary bulk production quotation:',
        time: '10:31 AM',
        quoteOffer: {
          id: 'QT-9921',
          productName: 'Botanical Peptide Barrier Cream (Bulk Sourcing Run)',
          price: 240,
          moq: 2000,
          leadTime: '12 Days',
          status: 'received'
        }
      },
      {
        id: 'm-1-3',
        sender: 'buyer',
        text: 'Thank you for the quote. We are verifying compliance certifications on our end.',
        time: '10:40 AM'
      },
      {
        id: 'm-1-4',
        sender: 'supplier',
        text: 'Sure, we can customize the Peptide Barrier formulation to include 1.5% Ceramide concentration.',
        time: '10:45 AM'
      }
    ],
    'c-2': [
      {
        id: 'm-2-1',
        sender: 'supplier',
        text: 'Greetings! Our batch testing for the Retinol serum base is complete. Here is our official bulk price and contract offer.',
        time: 'Yesterday'
      },
      {
        id: 'm-2-2',
        sender: 'supplier',
        text: 'Initial Quote offer posted:',
        time: 'Yesterday',
        quoteOffer: {
          id: 'QT-8814',
          productName: 'Professional Retinol 1% Serum Base',
          price: 190,
          moq: 1000,
          leadTime: '10 Days',
          status: 'approved'
        }
      },
      {
        id: 'm-2-3',
        sender: 'buyer',
        text: 'We would request a slight price reduction to ₹180 to fit our branding budget.',
        time: 'Yesterday'
      },
      {
        id: 'm-2-4',
        sender: 'supplier',
        text: 'Understood. We have approved the counter-quote of ₹180 per unit for 1,000 units. Proforma invoices are ready to build!',
        time: 'Yesterday'
      }
    ],
    'c-3': [
      {
        id: 'm-3-1',
        sender: 'supplier',
        text: 'Hello, we are prepared to supply the Frosted Cosmetic Jars. Our plant is ready to print custom product labels. What is your required lead time?',
        time: '3 days ago'
      }
    ]
  });

  const [inputText, setInputText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Counter Offer Inputs
  const [counterPriceInput, setCounterPriceInput] = useState<string>('');
  const [counterMoqInput, setCounterMoqInput] = useState<string>('');
  const [counterRemarksInput, setCounterRemarksInput] = useState<string>('');
  const [isNegotiating, setIsNegotiating] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConvo = conversations.find((c) => c.id === selectedConvoId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedConvoId]);

  // Set default counter inputs when selected conversation changes
  useEffect(() => {
    if (activeConvo && activeConvo.activeQuote) {
      setCounterPriceInput((activeConvo.activeQuote.originalPrice - 20).toString());
      setCounterMoqInput(activeConvo.activeQuote.originalMoq.toString());
    }
  }, [selectedConvoId]);

  const showLocalToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: 'buyer' as const,
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => ({
      ...prev,
      [selectedConvoId]: [...(prev[selectedConvoId] || []), newMsg]
    }));

    setInputText('');

    // Simulated supplier immediate response after 2 seconds
    setTimeout(() => {
      const supplierReply = {
        id: `msg-${Date.now() + 1}`,
        sender: 'supplier' as const,
        text: `Got it. Our production team is reviewing your message. We strive for a response rate of under 1 hour for verified buyers.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => ({
        ...prev,
        [selectedConvoId]: [...(prev[selectedConvoId] || []), supplierReply]
      }));
    }, 2000);
  };

  const handleSendCounterOffer = () => {
    if (!activeConvo || !activeConvo.activeQuote) return;

    const price = parseFloat(counterPriceInput);
    const moq = parseInt(counterMoqInput);

    if (isNaN(price) || price <= 0 || isNaN(moq) || moq <= 0) {
      showLocalToast('Please enter valid numeric parameters for price & MOQ.');
      return;
    }

    setIsNegotiating(true);

    // Update conversation states to "countered"
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConvoId && c.activeQuote
          ? {
              ...c,
              activeQuote: {
                ...c.activeQuote,
                status: 'countered',
                counterPrice: price,
                counterMoq: moq,
                counterRemarks: counterRemarksInput
              }
            }
          : c
      )
    );

    // Insert buyer's official counter offer chip into message stream
    const counterMsg = {
      id: `counter-${Date.now()}`,
      sender: 'buyer' as const,
      text: `OFFICIAL COUNTER-OFFER SUBMITTED:\nRequested Price: ₹${price}/unit (Original: ₹${activeConvo.activeQuote.originalPrice})\nRequested MOQ: ${moq.toLocaleString()} units (Original: ${activeConvo.activeQuote.originalMoq})\nRemarks: ${counterRemarksInput || "None"}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      quoteOffer: {
        id: activeConvo.activeQuote.id,
        productName: activeConvo.activeQuote.productName,
        price,
        moq,
        leadTime: activeConvo.activeQuote.shippingLeadTime,
        status: 'countered'
      }
    };

    setMessages((prev) => ({
      ...prev,
      [selectedConvoId]: [...(prev[selectedConvoId] || []), counterMsg]
    }));

    setCounterRemarksInput('');
    showLocalToast('Official Counter-Offer submitted! Pending supplier review.');

    // Simulate supplier decision logic after 3 seconds
    setTimeout(() => {
      const accepts = price >= activeConvo.activeQuote.originalPrice * 0.9; // Accepts if reduction is <= 10%
      
      let supplierReplyText = '';
      let nextStatus: 'approved' | 'rejected' = 'approved';

      if (accepts) {
        supplierReplyText = `Good news! Our commercial desk has reviewed your Counter-Offer of ₹${price} per unit for ${moq} units. We have formally accepted your terms. Generating Proforma Invoice (PI) in your secure documents tab now!`;
        nextStatus = 'approved';
      } else {
        supplierReplyText = `We appreciate your Counter-Offer. However, because our formulation requires premium Swiss-grade peptides and active assays, our absolute floor price is ₹${Math.round(activeConvo.activeQuote.originalPrice * 0.95)} per unit for a ${moq} batch. Please let us know if you would like to proceed.`;
        nextStatus = 'rejected';
      }

      const systemReply = {
        id: `reply-${Date.now()}`,
        sender: 'supplier' as const,
        text: supplierReplyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConvoId && c.activeQuote
            ? {
                ...c,
                activeQuote: {
                  ...c.activeQuote,
                  status: nextStatus
                }
              }
            : c
        )
      );

      setMessages((prev) => ({
        ...prev,
        [selectedConvoId]: [...(prev[selectedConvoId] || []), systemReply]
      }));

      setIsNegotiating(false);
      showLocalToast(accepts ? 'Counter-Offer accepted by supplier!' : 'Counter-Offer rejected. Supplier has made a final proposal.');
    }, 3500);
  };

  const handleApproveOriginalQuote = () => {
    if (!activeConvo || !activeConvo.activeQuote) return;

    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConvoId && c.activeQuote
          ? {
              ...c,
              activeQuote: {
                ...c.activeQuote,
                status: 'approved'
              }
            }
          : c
      )
    );

    const approveMsg = {
      id: `approve-${Date.now()}`,
      sender: 'buyer' as const,
      text: 'CONFIRMED: Bulk Quote Terms Approved as posted. Sourcing contract compilation started.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const sysConfirmMsg = {
      id: `sys-${Date.now()}`,
      sender: 'supplier' as const,
      text: 'Excellent. Sourcing contract registered under Escrow Settle. You can now build, verify, and print the digital Proforma Invoice (PI) and compile the corresponding Purchase Order (PO).',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => ({
      ...prev,
      [selectedConvoId]: [...(prev[selectedConvoId] || []), approveMsg, sysConfirmMsg]
    }));

    showLocalToast('Commercial Quote approved! Sourcing Documents compiled.');
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
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Sourcing Chatroom &amp; Price Negotiation Desk</span>
          </div>
          <h1 className="text-3xl font-black text-[#1c1b1b] tracking-tight">
            Direct B2B Sourcing Inbox
          </h1>
          <p className="text-[14px] text-[#594047] font-semibold mt-1">
            Negotiate live quotes, request recipe alterations, and submit legal Counter-Offers directly with verified manufacturing partners.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white px-4 py-2 border border-[#e8e8e8] rounded-xl text-[12px] font-bold text-[#594047]">
          <Activity className="w-4 h-4 text-[#0050d6]" />
          <span>Average Supplier Response Rate: <strong className="text-emerald-700">42 Min</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white border border-[#e8e8e8] rounded-2xl overflow-hidden shadow-xs h-[720px]">
        
        {/* L-SIDE: Conversations List (col-span-3) */}
        <div className="lg:col-span-3 border-r border-[#e8e8e8] flex flex-col h-full bg-[#fcf9f8]">
          <div className="p-4 border-b border-[#e8e8e8] bg-white">
            <span className="text-[11px] font-extrabold text-[#8c7077] uppercase tracking-wider block mb-2">Sourcing Threads</span>
            <div className="text-[12px] text-zinc-950 font-bold bg-[#fde7f3] text-[#b90064] px-3 py-1.5 rounded-lg text-center">
              Active Negotiating Desk
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#e8e8e8]">
            {conversations.map((convo) => {
              const isSelected = convo.id === selectedConvoId;
              return (
                <button
                  key={convo.id}
                  onClick={() => setSelectedConvoId(convo.id)}
                  className={`w-full text-left p-4 transition-all flex gap-3 cursor-pointer items-start ${
                    isSelected ? 'bg-white border-l-4 border-[#b90064]' : 'hover:bg-white/50'
                  }`}
                >
                  <div className="relative">
                    <img src={convo.avatar} alt={convo.supplierName} className="w-10 h-10 rounded-xl object-cover border border-[#e8e8e8]" />
                    {convo.isOnline && (
                      <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[13px] font-bold text-zinc-950 truncate">{convo.supplierName}</h4>
                      <span className="text-[10px] text-[#8c7077] font-semibold">{convo.time}</span>
                    </div>
                    <span className="text-[10px] text-[#8c7077] block font-semibold">{convo.location}</span>
                    <p className="text-[11.5px] text-[#594047] truncate mt-1 font-medium">{convo.lastMessage}</p>
                    
                    {convo.unreadCount > 0 && (
                      <span className="inline-block mt-1.5 text-[10px] bg-[#b90064] text-white font-extrabold px-2 py-0.5 rounded-full">
                        {convo.unreadCount} New
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* MID-SIDE: Scrollable Chat Message Feed (col-span-5) */}
        <div className="lg:col-span-5 flex flex-col h-full border-r border-[#e8e8e8]">
          
          {/* Active Partner bar */}
          {activeConvo && (
            <div className="p-4 bg-white border-b border-[#e8e8e8] flex justify-between items-center">
              <div className="flex items-center gap-3">
                <img src={activeConvo.avatar} alt={activeConvo.supplierName} className="w-9 h-9 rounded-lg object-cover border border-[#e8e8e8]" />
                <div>
                  <h3 className="text-[14px] font-bold text-zinc-950">{activeConvo.supplierName}</h3>
                  <p className="text-[11px] text-[#8c7077] flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                    Verified Manufacturing Representative
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded px-2.5 py-1 font-bold">
                  CDSCO Compliant
                </span>
              </div>
            </div>
          )}

          {/* Chat message list */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#fdf8f8]">
            {activeConvo && (messages[activeConvo.id] || []).map((msg) => {
              const isBuyer = msg.sender === 'buyer';
              return (
                <div key={msg.id} className={`flex flex-col ${isBuyer ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[90%] p-3.5 rounded-2xl text-[12.5px] leading-relaxed shadow-3xs ${
                    isBuyer 
                      ? 'bg-[#b90064] text-white rounded-br-xs' 
                      : 'bg-white text-zinc-950 border border-[#e8e8e8] rounded-bl-xs'
                  }`}>
                    
                    {/* Render message body content */}
                    <p className="whitespace-pre-line font-medium">{msg.text}</p>

                    {/* Render embedded B2B Quote Card */}
                    {msg.quoteOffer && (
                      <div className="mt-3 p-3 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-zinc-950 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-mono font-black uppercase text-[#8c7077]">
                            QUOTE PROPOSAL: {msg.quoteOffer.id}
                          </span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                            msg.quoteOffer.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : msg.quoteOffer.status === 'countered'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-[#fde7f3] text-[#b90064]'
                          }`}>
                            {msg.quoteOffer.status.toUpperCase()}
                          </span>
                        </div>

                        <div className="font-extrabold text-[12.5px]">{msg.quoteOffer.productName}</div>
                        
                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-[#f0edec]">
                          <div>
                            <span className="block text-[#8c7077] font-bold">Unit Rate</span>
                            <span className="font-black text-[#b90064]">₹{msg.quoteOffer.price}/Unit</span>
                          </div>
                          <div>
                            <span className="block text-[#8c7077] font-bold">Batch MOQ</span>
                            <span className="font-bold">{msg.quoteOffer.moq.toLocaleString()} Units</span>
                          </div>
                        </div>

                        {msg.quoteOffer.status === 'received' && (
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={handleApproveOriginalQuote}
                              className="flex-1 py-2 bg-[#b90064] hover:bg-[#8e004b] text-white font-extrabold rounded-lg text-center text-[11px] cursor-pointer"
                            >
                              Approve Quote
                            </button>
                            <button
                              onClick={() => {
                                showLocalToast('Scroll down the right side negotiation desk to customize your counter-offer parameters.');
                              }}
                              className="flex-1 py-2 bg-white border border-[#b90064] text-[#b90064] hover:bg-[#fde7f3] font-bold rounded-lg text-center text-[11px] cursor-pointer"
                            >
                              Counter Offer
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-[9.5px] text-[#8c7077] mt-1 px-1 font-semibold">{msg.time}</span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Simple Inline message text field */}
          <div className="p-3 bg-white border-t border-[#e8e8e8] flex items-center gap-2">
            <input
              type="text"
              placeholder="Type message regarding recipe parameters, certifications..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              className="flex-1 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl px-4 py-2 text-[12.5px] outline-none text-zinc-950 focus:border-[#b90064]"
            />
            <button
              onClick={handleSendMessage}
              className="w-9 h-9 bg-[#b90064] hover:bg-[#8e004b] text-white rounded-xl flex items-center justify-center cursor-pointer shadow-xs active:scale-98"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* R-SIDE: Counter-Quote Control Room & Negotiation Engine (col-span-4) */}
        <div className="lg:col-span-4 p-5 flex flex-col h-full bg-[#fcf9f8] overflow-y-auto">
          <div className="pb-4 border-b border-[#e8e8e8] mb-4">
            <span className="text-[10px] font-extrabold text-[#8c7077] uppercase tracking-wider block mb-1">
              Commercial Negotiation Desk
            </span>
            <h3 className="text-[15px] font-black text-zinc-950 flex items-center gap-1.5">
              <Coins className="w-4.5 h-4.5 text-[#0050d6]" />
              Counter-Quote Controller
            </h3>
          </div>

          {activeConvo && activeConvo.activeQuote ? (
            <div className="space-y-5">
              
              {/* Reference Original Quote Summary Box */}
              <div className="bg-white border border-[#e8e8e8] p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center text-[11px] font-bold text-[#8c7077]">
                  <span>Active Supplier Quote</span>
                  <span className="font-mono bg-[#eee7ea] px-1.5 py-0.5 rounded text-zinc-900">
                    ID: {activeConvo.activeQuote.id}
                  </span>
                </div>

                <div className="font-extrabold text-[12.5px] text-zinc-950">
                  {activeConvo.activeQuote.productName}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[12px] pt-2 border-t border-[#f0edec]">
                  <div className="bg-[#fdf8f8] p-2 rounded-lg border border-[#e8e8e8]/60">
                    <span className="block text-[#8c7077] font-semibold text-[10px]">Orig. Price / Unit</span>
                    <strong className="text-zinc-950 text-[13.5px]">₹{activeConvo.activeQuote.originalPrice}</strong>
                  </div>
                  <div className="bg-[#fdf8f8] p-2 rounded-lg border border-[#e8e8e8]/60">
                    <span className="block text-[#8c7077] font-semibold text-[10px]">Orig. Sourcing MOQ</span>
                    <strong className="text-zinc-950 text-[13.5px]">{activeConvo.activeQuote.originalMoq.toLocaleString()} Units</strong>
                  </div>
                </div>

                <div className="text-[11px] text-[#594047] font-medium flex items-center gap-1 pt-1">
                  <Clock className="w-3.5 h-3.5 text-[#0050d6]" />
                  <span>Declared Manufacturing Lead Time: <strong>{activeConvo.activeQuote.shippingLeadTime}</strong></span>
                </div>
              </div>

              {/* Status Banner */}
              <div className="p-3.5 rounded-xl border flex items-start gap-2.5 bg-amber-50 border-amber-200/70 text-[12px] text-amber-900 font-medium">
                <Info className="w-4.5 h-4.5 text-amber-700 shrink-0 mt-0.5" />
                <p className="leading-tight">
                  {activeConvo.activeQuote.status === 'received' && "Supplier has submitted the initial quote. You can now propose a lower unit price or MOQ request."}
                  {activeConvo.activeQuote.status === 'countered' && "Your counter-offer has been submitted and is currently being evaluated by the supplier's commercial team."}
                  {activeConvo.activeQuote.status === 'approved' && "This quote's terms have been APPROVED. Check your Proforma Invoice generator in the Docs tab."}
                  {activeConvo.activeQuote.status === 'rejected' && "Your counter offer was rejected. Try sending a modified counter offer closer to the supplier floor rate."}
                </p>
              </div>

              {/* Counter Offer Input Form */}
              <div className="space-y-4">
                <span className="text-[11px] font-extrabold text-[#8c7077] uppercase tracking-wider block">
                  Propose Counter Parameters
                </span>

                {/* Price Input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[12px]">
                    <label className="font-bold text-zinc-950">Target Unit Price (₹)</label>
                    <span className="text-[10px] text-[#b90064] font-bold">Suggested: ₹210 - ₹230</span>
                  </div>
                  <input
                    type="number"
                    disabled={activeConvo.activeQuote.status === 'approved' || isNegotiating}
                    value={counterPriceInput}
                    onChange={(e) => setCounterPriceInput(e.target.value)}
                    placeholder="Enter target counter price"
                    className="w-full bg-white border border-[#e8e8e8] focus:border-[#b90064] rounded-xl p-3 text-[13px] text-zinc-950 outline-none transition-colors font-bold disabled:bg-zinc-100 disabled:text-zinc-500"
                  />
                </div>

                {/* MOQ Input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[12px]">
                    <label className="font-bold text-zinc-950">Adjust Sourcing Batch MOQ</label>
                    <span className="text-[10px] text-[#8c7077] font-semibold">Current Floor: 1,500 units</span>
                  </div>
                  <input
                    type="number"
                    disabled={activeConvo.activeQuote.status === 'approved' || isNegotiating}
                    value={counterMoqInput}
                    onChange={(e) => setCounterMoqInput(e.target.value)}
                    placeholder="Enter target batch quantity"
                    className="w-full bg-white border border-[#e8e8e8] focus:border-[#b90064] rounded-xl p-3 text-[13px] text-zinc-950 outline-none transition-colors font-bold disabled:bg-zinc-100 disabled:text-zinc-500"
                  />
                </div>

                {/* Remarks / Justification textarea */}
                <div className="space-y-1.5">
                  <label className="block text-[12px] font-bold text-zinc-950">Justification / Sourcing Remarks</label>
                  <textarea
                    disabled={activeConvo.activeQuote.status === 'approved' || isNegotiating}
                    value={counterRemarksInput}
                    onChange={(e) => setCounterRemarksInput(e.target.value)}
                    rows={3}
                    placeholder="E.g., requesting reduction based on scheduled subsequent Phase 2 orders..."
                    className="w-full bg-white border border-[#e8e8e8] focus:border-[#b90064] rounded-xl p-3 text-[12px] text-zinc-950 outline-none transition-colors font-medium disabled:bg-zinc-100 disabled:text-zinc-500 resize-none"
                  />
                </div>

                {/* Negotiation CTA */}
                {activeConvo.activeQuote.status !== 'approved' ? (
                  <button
                    onClick={handleSendCounterOffer}
                    disabled={isNegotiating}
                    className="w-full py-3 bg-[#b90064] hover:bg-[#8e004b] disabled:bg-pink-300 text-white font-extrabold text-[13px] rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                  >
                    {isNegotiating ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin" />
                        <span>Evaluating Trade Counter-Offer...</span>
                      </>
                    ) : (
                      <>
                        <ArrowDownLeft className="w-4 h-4" />
                        <span>Submit Official Counter-Offer</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-center text-[12.5px] font-bold">
                    ✓ Contract Terms Locked &amp; Approved
                  </div>
                )}

              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-white border border-[#e8e8e8] rounded-xl">
              <FileCheck2 className="w-10 h-10 text-zinc-300 mb-2" />
              <h4 className="text-[13px] font-bold text-zinc-950">No Quote Linked</h4>
              <p className="text-[11.5px] text-[#8c7077] mt-1 max-w-[180px]">
                This supplier thread has no outstanding quotes awaiting negotiation.
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
