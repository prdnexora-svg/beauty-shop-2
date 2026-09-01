import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Menu, 
  X, 
  Mail, 
  Building2, 
  Sparkles, 
  Package, 
  Layers, 
  PlusCircle, 
  CheckCircle2, 
  Settings, 
  LogOut, 
  ShieldCheck, 
  ChevronDown, 
  Edit3,
  ExternalLink,
  Briefcase,
  Bell
} from 'lucide-react';
import { BuyerProfileData } from './EditProfileModal';
import { NotificationCenter } from './NotificationCenter';
import { useNotifications } from '../hooks/useNotifications';
import { navItemsFor, canPostRequirement, toViewer, accountScreenFor } from '../lib/roleAccess';

interface TopNavBarProps {
  currentScreen: any;
  onNavigate: (screen: any, params?: any) => void;
  onOpenRFQModal: () => void;
  onOpenAuthModal: (mode: 'login' | 'register') => void;
  isLoggedIn: boolean;
  userRole: 'buyer' | 'supplier' | null;
  userProfile?: BuyerProfileData;
  onOpenEditProfile: () => void;
  onLogout: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  currentScreen,
  onNavigate,
  onOpenRFQModal,
  onOpenAuthModal,
  isLoggedIn,
  userRole,
  userProfile,
  onOpenEditProfile,
  onLogout
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const { unreadCount } = useNotifications();

  // Navigation is derived from the shared access policy, so a link can never
  // point at a screen the route guard would reject.
  const viewer = toViewer(isLoggedIn, userRole);
  const isSupplier = viewer === 'supplier';
  const navItems = navItemsFor(viewer);
  const showRfqCta = canPostRequirement(viewer);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (screenId: string, params?: any) => {
    onNavigate(screenId as any, params);
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  };

  const displayName = userProfile?.fullName || (userRole === 'supplier' ? 'Aura Beauty Labs' : 'Priya Sharma');
  const displayEmail = userProfile?.email || (userRole === 'supplier' ? 'contact@aurabeauty.in' : 'priya.procurement@radiantbeauty.in');
  const displayCompany = userProfile?.businessName || (userRole === 'supplier' ? 'Aura Beauty Labs Pvt Ltd' : 'Radiant Beauty Solutions');
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Profile completion calculation (e.g. 85%)
  const profileCompletion = userProfile?.isGstVerified ? 90 : 70;

  return (
    <header className="fixed top-0 z-50 w-full bg-[#FFFDFC]/90 backdrop-blur-xl border-b border-[#E5D8EE] shadow-xs">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
        {/* Brand & Logo */}
        <div
          onClick={() => handleNavClick('explore')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 bg-gradient-to-br from-[#6B2D8C] to-[#2A0E3F] rounded-xl flex items-center justify-center shadow-md shadow-[#6B2D8C]/20 transition-transform group-hover:scale-105">
            <span className="text-white font-serif font-bold text-xl leading-none">N</span>
          </div>
          <div>
            <span className="font-serif text-xl font-bold tracking-tight text-[#2A0E3F] block leading-none">
              Nexora<span className="text-[#6B2D8C] ml-1 font-sans text-lg font-light">Luxe</span>
            </span>
            <span className="text-[10px] font-bold tracking-widest uppercase text-[#8B7FA3] block mt-0.5">
              B2B Beauty Marketplace
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
          {navItems.map((item) => {
            const isActive = currentScreen === item.screen || (item.id === 'supplier-directory' && currentScreen === 'directory');
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.screen)}
                className={`text-[14px] py-1.5 transition-all cursor-pointer relative font-medium ${
                  isActive
                    ? 'text-[#6B2D8C] font-bold'
                    : 'text-[#4E3D63] hover:text-[#6B2D8C]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6B2D8C] rounded-full animate-in fade-in duration-200"></span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Actions & Interactive User Profile */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden sm:flex items-center gap-2 text-[#2A0E3F]">
            {/* Supplier-only entry point. Hidden entirely from buyers and
                guests so the UI never advertises a route the guard blocks. */}
            {isSupplier && (
              <button 
                aria-label="Supplier Portal & Ad Campaigns"
                title="Supplier Admin Portal & Sponsored Ad Manager"
                onClick={() => handleNavClick('supplier-portal')}
                className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-[13px] font-bold ${
                  currentScreen === 'supplier-portal' 
                    ? 'bg-[#6B2D8C] text-white shadow-sm' 
                    : 'bg-[#F5EEF8] hover:bg-[#E8D5F2] text-[#6B2D8C] border border-[#E8D5F2]'
                }`}
              >
                <Sparkles className="w-4 h-4 text-[#6B2D8C]" />
                <span className="hidden md:inline">Supplier Portal & Ads</span>
              </button>
            )}

            {/* Notification Bell Center */}
            <div className="relative" ref={notifRef}>
              <button
                aria-label="Procurement Notifications & Alerts"
                title="Notifications & Live RFQ Responses"
                onClick={() => setNotificationsOpen(prev => !prev)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer relative ${
                  notificationsOpen
                    ? 'bg-[#F5EEF8] border-[#6B2D8C] text-[#6B2D8C] shadow-xs'
                    : 'bg-[#FDFBF7] hover:bg-[#F5EEF8] border-[#E5D8EE] hover:border-[#6B2D8C] text-[#4E3D63] hover:text-[#6B2D8C]'
                }`}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#6B2D8C] text-[9px] font-black text-white shadow-xs animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 z-50">
                  <NotificationCenter
                    variant="dropdown"
                    onNavigate={(screen, params) => {
                      setNotificationsOpen(false);
                      onNavigate(screen, params);
                    }}
                    onClose={() => setNotificationsOpen(false)}
                  />
                </div>
              )}
            </div>

            {/* Profile Dropdown or Sign In Button */}
            {isLoggedIn ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  aria-label="User Profile Menu"
                  title="Profile & Settings"
                  onClick={() => setProfileDropdownOpen(prev => !prev)}
                  className="flex items-center gap-2 p-1.5 pl-2 pr-2.5 bg-[#FDFBF7] hover:bg-[#F5EEF8] border border-[#E5D8EE] hover:border-[#6B2D8C] rounded-xl transition-all cursor-pointer shadow-2xs group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6B2D8C] to-[#8236A0] text-white flex items-center justify-center font-bold text-xs shadow-xs overflow-hidden">
                    {userProfile?.avatarUrl ? (
                      <img src={userProfile.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-[12px] font-bold text-[#2A0E3F] leading-tight group-hover:text-[#6B2D8C] truncate max-w-[110px]">
                      {displayName.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-[#7E6C96] leading-none capitalize">
                      {userRole || 'Buyer'}
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-[#7E6C96] transition-transform ${profileDropdownOpen ? 'rotate-180 text-[#6B2D8C]' : ''}`} />
                </button>

                {/* Floating Profile Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-[#E8DEEF] shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                    {/* User Header Summary */}
                    <div className="p-4 bg-[#FDFBF7] border-b border-[#E8DEEF]">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#6B2D8C] to-[#8236A0] text-white flex items-center justify-center font-bold text-base shadow-sm overflow-hidden shrink-0">
                          {userProfile?.avatarUrl ? (
                            <img src={userProfile.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                          ) : (
                            initials
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-[#2A0E3F] truncate">{displayName}</h4>
                          <p className="text-[11px] text-[#5B4A6E] truncate">{displayEmail}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="px-1.5 py-0.5 rounded bg-[#F5EEF8] text-[#6B2D8C] text-[9px] font-bold">
                              {userRole === 'supplier' ? 'Verified Supplier' : 'Verified Buyer'}
                            </span>
                            {userProfile?.isGstVerified && (
                              <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-700">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> GST Active
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Profile Strength Progress */}
                      <div className="mt-3 pt-2.5 border-t border-[#F4F0E9]">
                        <div className="flex justify-between text-[10px] font-bold text-[#5B4A6E] mb-1">
                          <span>Profile Strength</span>
                          <span className="text-[#6B2D8C]">{profileCompletion}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#E8DEEF] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#6B2D8C] to-[#8236A0] rounded-full transition-all duration-300"
                            style={{ width: `${profileCompletion}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Menu Actions */}
                    <div className="p-2 space-y-1">
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          // Suppliers manage their public listing from inside
                          // the portal; the standalone supplier-profile page is
                          // a buyer-facing marketplace view.
                          handleNavClick(isSupplier ? 'supplier-portal' : 'buyer-profile');
                        }}
                        className="w-full px-3 py-2 text-left rounded-xl hover:bg-[#F5EEF8] text-xs font-bold text-[#2A0E3F] hover:text-[#6B2D8C] flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <User className="w-4 h-4 text-[#6B2D8C]" />
                        <span>View My Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onOpenEditProfile();
                        }}
                        className="w-full px-3 py-2 text-left rounded-xl hover:bg-[#F5EEF8] text-xs font-bold text-[#2A0E3F] hover:text-[#6B2D8C] flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4 text-[#6B2D8C]" />
                        <span>Edit Profile & Business Details</span>
                      </button>

                      {/* Workspace link is role-exclusive: a buyer never sees
                          the supplier portal entry, and vice versa. */}
                      {isSupplier ? (
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            handleNavClick('supplier-portal');
                          }}
                          className="w-full px-3 py-2 text-left rounded-xl hover:bg-[#F5EEF8] text-xs font-bold text-[#6B2D8C] flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4 text-[#6B2D8C]" />
                          <span>Supplier Portal & Ad Campaigns</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            handleNavClick('buyer-dashboard');
                          }}
                          className="w-full px-3 py-2 text-left rounded-xl hover:bg-[#F5EEF8] text-xs font-semibold text-[#5B4A6E] hover:text-[#2A0E3F] flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <Briefcase className="w-4 h-4 text-[#7E6C96]" />
                          <span>Buyer RFQ & Sourcing Dashboard</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onOpenEditProfile();
                        }}
                        className="w-full px-3 py-2 text-left rounded-xl hover:bg-[#F5EEF8] text-xs font-semibold text-[#5B4A6E] hover:text-[#2A0E3F] flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Settings className="w-4 h-4 text-[#7E6C96]" />
                        <span>Account & Security Settings</span>
                      </button>

                      <div className="pt-1.5 mt-1.5 border-t border-[#F4F0E9]">
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            onLogout();
                          }}
                          className="w-full px-3 py-2 text-left rounded-xl hover:bg-red-50 text-xs font-bold text-red-600 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-red-500" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                aria-label="Profile"
                title="Supplier / Buyer Sign In"
                onClick={() => onOpenAuthModal('login')}
                className="p-2 hover:bg-[#F5EEF8] text-[#4E3D63] hover:text-[#6B2D8C] rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              >
                <User className="w-5 h-5" />
                <span className="hidden md:inline">Sign In</span>
              </button>
            )}
          </div>
          
          {/* Buyers raise requirements; suppliers respond to them. */}
          {showRfqCta && (
            <button
              onClick={onOpenRFQModal}
              className="bg-[#6B2D8C] hover:bg-[#A00057] active:scale-[0.98] text-white text-[13px] font-bold px-4 sm:px-5 py-2.5 rounded-xl transition-all duration-200 shadow-sm shadow-[#6B2D8C]/25 cursor-pointer flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Post Requirement</span>
            </button>
          )}

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl hover:bg-[#F5EEF8] text-[#2A0E3F] cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E5D8EE] bg-[#FFFDFC] shadow-xl px-4 py-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const isActive = currentScreen === item.screen || (item.id === 'supplier-directory' && currentScreen === 'directory');
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.screen)}
                  className={`text-left px-3.5 py-2.5 rounded-xl text-[14px] font-semibold transition-colors flex items-center justify-between ${
                    isActive
                      ? 'bg-[#F5EEF8] text-[#6B2D8C]'
                      : 'text-[#2A0E3F] hover:bg-[#FAF5F7]'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && <CheckCircle2 className="w-4 h-4 text-[#6B2D8C]" />}
                </button>
              );
            })}

            <div className="pt-3 mt-2 border-t border-[#F0E8EB] flex flex-col gap-2">
              {isLoggedIn ? (
                <>
                  <div className="p-3 bg-[#FDFBF7] rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6B2D8C] to-[#8236A0] text-white flex items-center justify-center font-bold text-sm">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-[#2A0E3F] truncate">{displayName}</div>
                      <div className="text-[11px] text-[#5B4A6E] truncate">{displayEmail}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenEditProfile();
                    }}
                    className="text-left px-3.5 py-2.5 rounded-xl text-[14px] font-semibold text-[#6B2D8C] bg-[#F5EEF8] flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Profile & Business Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onNavigate(accountScreenFor(viewer), isSupplier ? undefined : { tab: 'notifications' });
                    }}
                    className="text-left px-3.5 py-2.5 rounded-xl text-[14px] font-semibold text-[#2A0E3F] hover:bg-[#F5EEF8] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#6B2D8C]" />
                      <span>Notifications & Alerts</span>
                    </div>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#6B2D8C] text-white text-[10px] font-bold">
                        {unreadCount} new
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => handleNavClick(accountScreenFor(viewer))}
                    className="text-left px-3.5 py-2.5 rounded-xl text-[14px] font-semibold text-[#4E3D63] hover:bg-[#F5EEF8] flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4 text-[#6B2D8C]" />
                    <span>{isSupplier ? 'Supplier Admin Portal' : 'Buyer Workspace & Enquiries'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogout();
                    }}
                    className="text-left px-3.5 py-2.5 rounded-xl text-[14px] font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuthModal('login');
                    }}
                    className="text-left px-3.5 py-2.5 rounded-xl text-[14px] font-semibold text-[#4E3D63] hover:bg-[#F5EEF8] flex items-center gap-2"
                  >
                    <User className="w-4 h-4 text-[#6B2D8C]" />
                    <span>Supplier / Buyer Sign In</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};


