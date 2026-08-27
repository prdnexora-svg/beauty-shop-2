import React, { useState } from 'react';
import { Shield, MessageSquare, Users, Sparkles } from 'lucide-react';

interface BuySmartCardProps {
  onGetQuotes: (requirement: string, quantity: string, contact: string) => void;
  onPostDetailed: () => void;
}

const POINTS = [
  { icon: Shield, title: 'Verified Suppliers', desc: 'Connect with trusted & verified beauty suppliers' },
  { icon: Users, title: 'Multiple Quotes', desc: 'Receive competitive quotes & compare easily' },
  { icon: MessageSquare, title: 'Direct Communication', desc: 'Talk directly with suppliers & close faster' },
];

const inputClasses =
  'w-full px-4 py-3 rounded-xl bg-white/60 border border-white/40 focus:border-luxe-gold ' +
  'focus:ring-2 focus:ring-luxe-gold/20 outline-none transition-all placeholder:text-luxe-purple/40 text-luxe-purple-dark';

export const BuySmartCard: React.FC<BuySmartCardProps> = ({ onGetQuotes, onPostDetailed }) => {
  const [requirement, setRequirement] = useState('');
  const [quantity, setQuantity] = useState('');
  const [contact, setContact] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onGetQuotes(requirement.trim(), quantity.trim(), contact.trim());
  };

  return (
    <div className="relative max-w-5xl mx-auto -mt-16 md:-mt-20 z-20 px-4">
      {/* Decorative sparkles */}
      <div className="sparkle" style={{ top: '-20px', left: '10%' }} />
      <div className="sparkle" style={{ top: '30px', right: '15%', animationDelay: '0.5s' }} />
      <div className="sparkle" style={{ bottom: '20px', left: '20%', animationDelay: '1s' }} />

      <div className="glass-card rounded-3xl p-8 md:p-10">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Features */}
          <div>
            <h2 className="font-display text-3xl font-bold text-luxe-purple mb-2">
              Buy Smart. <span className="text-gold-shimmer">Source Better.</span>
            </h2>
            <p className="text-luxe-purple/70 mb-6">India&rsquo;s premium B2B beauty marketplace</p>

            <div className="space-y-4">
              {POINTS.map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/40 transition-all duration-300 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-luxe-purple/10 group-hover:bg-luxe-gold/20 flex items-center justify-center transition-colors">
                    <item.icon className="w-5 h-5 text-luxe-purple group-hover:text-luxe-gold" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-luxe-purple">{item.title}</h3>
                    <p className="text-sm text-luxe-purple/60">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Form */}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label htmlFor="bsc-requirement" className="text-sm font-medium text-luxe-purple mb-1.5 block">
                Product / Requirement
              </label>
              <input
                id="bsc-requirement"
                type="text"
                value={requirement}
                onChange={(e) => setRequirement(e.target.value)}
                placeholder="e.g., Vitamin C Serum"
                className={inputClasses}
              />
            </div>

            <div>
              <label htmlFor="bsc-quantity" className="text-sm font-medium text-luxe-purple mb-1.5 block">
                Quantity
              </label>
              <input
                id="bsc-quantity"
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g., 500 pcs"
                className={inputClasses}
              />
            </div>

            <div>
              <label htmlFor="bsc-contact" className="text-sm font-medium text-luxe-purple mb-1.5 block">
                City / Mobile
              </label>
              <div className="flex gap-2">
                <select
                  aria-label="Country code"
                  className="w-20 px-3 py-3 rounded-xl bg-white/60 border border-white/40 focus:border-luxe-gold outline-none text-luxe-purple-dark"
                >
                  <option>+91</option>
                </select>
                <input
                  id="bsc-contact"
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Enter city or mobile number"
                  className={`flex-1 min-w-0 ${inputClasses}`}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-luxe-purple to-luxe-purple-light text-white font-semibold shadow-luxe hover:shadow-luxe-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              Get Supplier Quotes
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>

            <button
              type="button"
              onClick={onPostDetailed}
              className="w-full py-2.5 text-sm text-luxe-purple hover:text-luxe-gold font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              Post Detailed Requirement
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
