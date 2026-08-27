import React from 'react';
import { Activity, Clock, MapPin, Send, CheckCircle2, ChevronRight } from 'lucide-react';
import { RFQItem } from '../types';

interface LiveSourcingRequestsProps {
  rfqs: RFQItem[];
  onSubmitQuote: (rfq: RFQItem) => void;
  onOpenRFQModal: () => void;
}

export const LiveSourcingRequests: React.FC<LiveSourcingRequestsProps> = ({
  rfqs,
  onSubmitQuote,
  onOpenRFQModal
}) => {
  return (
    <section className="py-12 bg-[#FDFBF7]">
      <div className="max-w-[1440px] mx-auto px-5 md:px-10">
        
        {/* Section Header with Live Ticker Pulse */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-white border border-[#E8DEEF] rounded-full shadow-2xs">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8236A0] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#6B2D8C]"></span>
              </span>
              <span className="text-[12px] font-bold uppercase tracking-wider text-[#6B2D8C]">LIVE SOURCING REQUESTS</span>
            </div>
            <span className="text-[13px] text-[#5B4A6E] hidden md:inline">Real-time buyer requirements submitted across India</span>
          </div>

          <button
            onClick={onOpenRFQModal}
            className="text-[13px] font-bold text-[#6B2D8C] hover:text-[#4A2560] flex items-center gap-1 transition-colors self-start sm:self-auto"
          >
            <span>Post a Requirement</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Live Requests Horizontal Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {rfqs.map((rfq) => (
            <div
              key={rfq.id}
              className="bg-white rounded-xl border border-[#E8DEEF] p-5 flex flex-col justify-between card-hover-fx"
            >
              <div>
                {/* Meta header: Location, Verified Buyer & Time */}
                <div className="flex items-center justify-between text-[11px] text-[#7E6C96] mb-2.5">
                  <span className="flex items-center gap-1 font-medium text-[#5B4A6E]">
                    <MapPin className="w-3 h-3 text-[#6B2D8C]" />
                    {rfq.buyerLocation}
                  </span>
                  <span className="flex items-center gap-1 text-[#7E6C96]">
                    <Clock className="w-3 h-3" />
                    {rfq.timeAgo}
                  </span>
                </div>

                {/* RFQ Title & Category */}
                <div className="mb-2">
                  <span className="inline-block text-[10px] font-semibold text-[#6B2D8C] bg-[#EDE0F5] px-2 py-0.5 rounded-full mb-1.5">
                    {rfq.category}
                  </span>
                  <h3 className="text-[14px] font-bold text-[#2A0E3F] line-clamp-2 leading-snug">
                    {rfq.title}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-[12px] text-[#5B4A6E] line-clamp-3 leading-relaxed mb-4">
                  {rfq.description}
                </p>
              </div>

              {/* Bottom Specs & Action */}
              <div className="pt-3 border-t border-[#F4F0E9] space-y-3">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-[#7E6C96]">Required Quantity:</span>
                  <span className="font-bold text-[#2A0E3F]">{rfq.quantityRequired}</span>
                </div>

                {rfq.targetPrice && (
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-[#7E6C96]">Target Price:</span>
                    <span className="font-semibold text-[#6B2D8C]">{rfq.targetPrice}</span>
                  </div>
                )}

                <button
                  onClick={() => onSubmitQuote(rfq)}
                  className="w-full bg-[#F5EEF8] hover:bg-[#6B2D8C] text-[#6B2D8C] hover:text-white text-[12px] font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Quote</span>
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
