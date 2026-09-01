import React from 'react';
import { toViewer, type AppRole } from '../lib/roleAccess';

interface FooterProps {
  onOpenRFQModal?: () => void;
  onOpenAuthModal?: (mode: 'login' | 'register') => void;
  onNavigate?: (screen: any) => void;
  isLoggedIn?: boolean;
  userRole?: AppRole | null;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenRFQModal, onOpenAuthModal, isLoggedIn = false, userRole = null }) => {
  // Footer columns follow the same access policy as the header: a supplier
  // sees supplier links only, a buyer/guest sees the marketplace side.
  const viewer = toViewer(isLoggedIn, userRole);
  const isSupplier = viewer === 'supplier';
  return (
    <footer className="w-full py-12 md:py-16 border-t border-[#E5D8EE] bg-[#FFF7FA] hidden md:block">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-1 mb-6 md:mb-0">
          <div className="font-serif text-[20px] font-bold text-[#2A0E3F] mb-3">
            Nexora Luxe
          </div>
          <p className="text-[14px] text-[#4E3D63] mb-4 leading-relaxed max-w-sm">
            Elevating the B2B beauty supply chain through verified connections and premium sourcing.
          </p>
          <div className="text-[13px] text-[#8B7FA3]">
            © 2024 Nexora Luxe. All rights reserved.
          </div>
        </div>

        <div>
          <h4 className="text-[12px] font-bold text-[#2A0E3F] mb-4 uppercase tracking-wider">
            Marketplace
          </h4>
          <ul className="space-y-2 text-[14px]">
            <li>
              <button
                onClick={() => onNavigate?.('plp')}
                className="text-[#4E3D63] hover:text-[#2A0E3F] hover:underline underline-offset-4 transition-colors cursor-pointer"
              >
                Skincare
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate?.('plp')}
                className="text-[#4E3D63] hover:text-[#2A0E3F] hover:underline underline-offset-4 transition-colors cursor-pointer"
              >
                Color Cosmetics
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate?.('supplier-directory')}
                className="text-[#4E3D63] hover:text-[#2A0E3F] hover:underline underline-offset-4 transition-colors cursor-pointer"
              >
                Verified Suppliers
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate?.('oem-hub')}
                className="text-[#4E3D63] hover:text-[#2A0E3F] hover:underline underline-offset-4 transition-colors cursor-pointer"
              >
                OEM / Private Label
              </button>
            </li>
          </ul>
        </div>

        {!isSupplier && (
        <div>
          <h4 className="text-[12px] font-bold text-[#2A0E3F] mb-4 uppercase tracking-wider">
            Buyers
          </h4>
          <ul className="space-y-2 text-[14px]">
            <li>
              <button
                onClick={() => onNavigate?.('rfq-tracking')}
                className="text-[#4E3D63] hover:text-[#2A0E3F] hover:underline underline-offset-4 transition-colors cursor-pointer"
              >
                Post RFQ
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate?.('buyer-dashboard')}
                className="text-[#4E3D63] hover:text-[#2A0E3F] hover:underline underline-offset-4 transition-colors cursor-pointer"
              >
                Buyer Dashboard
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate?.('buyer-enquiry-log')}
                className="text-[#4E3D63] hover:text-[#2A0E3F] hover:underline underline-offset-4 transition-colors cursor-pointer"
              >
                Enquiry Log
              </button>
            </li>
          </ul>
        </div>
        )}

        <div>
          <h4 className="text-[12px] font-bold text-[#2A0E3F] mb-4 uppercase tracking-wider">
            Suppliers
          </h4>
          <ul className="space-y-2 text-[14px]">
            {!isLoggedIn && (
              <li>
                <button
                  onClick={() => onOpenAuthModal?.('register')}
                  className="text-[#4E3D63] hover:text-[#2A0E3F] hover:underline underline-offset-4 transition-colors cursor-pointer"
                >
                  Join as Supplier
                </button>
              </li>
            )}
            {isSupplier && (
              <>
                <li>
                  <button
                    onClick={() => onNavigate?.('supplier-portal')}
                    className="text-[#4E3D63] hover:text-[#2A0E3F] hover:underline underline-offset-4 transition-colors cursor-pointer"
                  >
                    Supplier Business Hub
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate?.('supplier-verification')}
                    className="text-[#4E3D63] hover:text-[#2A0E3F] hover:underline underline-offset-4 transition-colors cursor-pointer"
                  >
                    Verification Center
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </footer>
  );
};
