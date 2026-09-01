import React from 'react';
import { Home, LayoutGrid, PlusCircle, MessageSquare, User, Package, ClipboardList, BarChart3 } from 'lucide-react';
import { toViewer, accountScreenFor } from '../lib/roleAccess';

interface MobileBottomNavProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  isLoggedIn: boolean;
  userRole: 'buyer' | 'supplier' | null;
  onOpenAuth: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentScreen,
  onNavigate,
  isLoggedIn,
  userRole,
  onOpenAuth
}) => {
  const viewer = toViewer(isLoggedIn, userRole);
  const isSupplier = viewer === 'supplier';

  const handleProfileClick = () => {
    if (isLoggedIn) {
      onNavigate(accountScreenFor(viewer));
    } else {
      onOpenAuth();
    }
  };

  const activeCls = 'text-[#6B2D8C] fill-[#6B2D8C]/10';
  const idleCls = 'text-[#5B4A6E]';

  // --------------------------------------------------------------------------
  // Supplier bar: admin destinations only. Marketplace browsing, Post RFQ and
  // the buyer enquiry log are all buyer-facing and must not appear here.
  // --------------------------------------------------------------------------
  if (isSupplier) {
    const portalActive = currentScreen === 'supplier-portal';
    const verifyActive = currentScreen === 'supplier-verification';
    return (
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#F4F0E9] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe">
        <div className="flex items-center justify-around px-2 h-16">
          <button
            onClick={() => onNavigate('supplier-portal')}
            className="flex flex-col items-center justify-center w-16 h-full gap-1"
          >
            <Package className={`w-5 h-5 ${portalActive ? activeCls : idleCls}`} strokeWidth={portalActive ? 2.5 : 2} />
            <span className={`text-[10px] font-medium ${portalActive ? 'text-[#6B2D8C]' : idleCls}`}>Inventory</span>
          </button>

          <button
            onClick={() => onNavigate('supplier-portal')}
            className="flex flex-col items-center justify-center w-16 h-full gap-1"
          >
            <ClipboardList className={`w-5 h-5 ${idleCls}`} strokeWidth={2} />
            <span className={`text-[10px] font-medium ${idleCls}`}>Orders</span>
          </button>

          <button
            onClick={() => onNavigate('supplier-portal')}
            className="flex flex-col items-center justify-center w-16 h-full gap-1"
          >
            <BarChart3 className={`w-5 h-5 ${idleCls}`} strokeWidth={2} />
            <span className={`text-[10px] font-medium ${idleCls}`}>Analytics</span>
          </button>

          <button
            onClick={() => onNavigate('supplier-verification')}
            className="flex flex-col items-center justify-center w-16 h-full gap-1"
          >
            <User className={`w-5 h-5 ${verifyActive ? activeCls : idleCls}`} strokeWidth={verifyActive ? 2.5 : 2} />
            <span className={`text-[10px] font-medium ${verifyActive ? 'text-[#6B2D8C]' : idleCls}`}>Settings</span>
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Buyer / guest bar: the marketplace.
  // --------------------------------------------------------------------------
  const exploreActive = currentScreen === 'explore';
  const catActive = currentScreen === 'directory' || currentScreen === 'plp';
  const chatActive = currentScreen === 'buyer-enquiry-log';
  const profileActive = currentScreen === 'buyer-dashboard';

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#F4F0E9] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe">
      <div className="flex items-center justify-around px-2 h-16">

        {/* Home */}
        <button 
          onClick={() => onNavigate('explore')}
          className="flex flex-col items-center justify-center w-16 h-full gap-1"
        >
          <Home className={`w-5 h-5 ${exploreActive ? activeCls : idleCls}`} strokeWidth={exploreActive ? 2.5 : 2} />
          <span className={`text-[10px] font-medium ${exploreActive ? 'text-[#6B2D8C]' : idleCls}`}>
            Home
          </span>
        </button>

        {/* Categories / Directory */}
        <button 
          onClick={() => onNavigate('directory')}
          className="flex flex-col items-center justify-center w-16 h-full gap-1"
        >
          <LayoutGrid className={`w-5 h-5 ${catActive ? activeCls : idleCls}`} strokeWidth={catActive ? 2.5 : 2} />
          <span className={`text-[10px] font-medium ${catActive ? 'text-[#6B2D8C]' : idleCls}`}>
            Categories
          </span>
        </button>

        {/* Post RFQ - Prominent Center */}
        <button 
          onClick={() => onNavigate('post-rfq')}
          className="relative -top-5 flex flex-col items-center justify-center group"
        >
          <div className="w-14 h-14 rounded-full bg-[#6B2D8C] shadow-lg shadow-[#6B2D8C]/30 flex items-center justify-center text-white transition-transform active:scale-95 border-4 border-[#FDFBF7]">
            <PlusCircle className="w-6 h-6" strokeWidth={2} />
          </div>
          <span className="text-[10px] font-bold text-[#2A0E3F] mt-1">Post RFQ</span>
        </button>

        {/* Chats / Enquiries */}
        <button 
          onClick={() => onNavigate('buyer-enquiry-log')}
          className="flex flex-col items-center justify-center w-16 h-full gap-1 relative"
        >
          <MessageSquare className={`w-5 h-5 ${chatActive ? activeCls : idleCls}`} strokeWidth={chatActive ? 2.5 : 2} />
          {/* Notification dot placeholder */}
          <span className="absolute top-2 right-4 w-2 h-2 bg-[#8236A0] rounded-full border-2 border-white"></span>
          <span className={`text-[10px] font-medium ${chatActive ? 'text-[#6B2D8C]' : idleCls}`}>
            Chats
          </span>
        </button>

        {/* Profile */}
        <button 
          onClick={handleProfileClick}
          className="flex flex-col items-center justify-center w-16 h-full gap-1"
        >
          <User className={`w-5 h-5 ${profileActive ? activeCls : idleCls}`} strokeWidth={profileActive ? 2.5 : 2} />
          <span className={`text-[10px] font-medium ${profileActive ? 'text-[#6B2D8C]' : idleCls}`}>
            Profile
          </span>
        </button>

      </div>
    </div>
  );
};
