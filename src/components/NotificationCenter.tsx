import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  CheckCheck,
  MessageSquare,
  FileText,
  TrendingUp,
  Building2,
  Clock,
  ChevronRight,
  Filter,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export interface NotificationItem {
  id: string;
  type: 'rfq' | 'negotiation' | 'message';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionRoute?: string;
  supplierName?: string;
  badgeText?: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (route: string) => void;
}

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'negotiation',
    title: 'New Counter-Proposal Received',
    message: 'Aura Beauty Labs submitted a revised offer of ₹185/unit for 5,000 units of Vit-C Serum.',
    timestamp: '10 mins ago',
    isRead: false,
    actionRoute: 'buyer-enquiry-log',
    supplierName: 'Aura Beauty Labs',
    badgeText: 'Counter Offer'
  },
  {
    id: 'notif-2',
    type: 'rfq',
    title: 'New Quotation Received',
    message: 'LuxeForm Cosmetics submitted a quote for RFQ-2026-08 (Organic Hair Mask).',
    timestamp: '1 hour ago',
    isRead: false,
    actionRoute: 'rfq-tracking',
    supplierName: 'LuxeForm Cosmetics',
    badgeText: 'Quote Ready'
  },
  {
    id: 'notif-3',
    type: 'message',
    title: 'New Supplier Message',
    message: 'PureEssence Mfg: "Sample dispatch tracking number #PE-9921 is now active."',
    timestamp: '3 hours ago',
    isRead: true,
    actionRoute: 'buyer-enquiry-log',
    supplierName: 'PureEssence Mfg',
    badgeText: 'Message'
  },
  {
    id: 'notif-4',
    type: 'negotiation',
    title: 'Sourcing Agreement Accepted',
    message: 'Velvet Touch Cosmetics accepted your target price of ₹220/unit for Matte Foundation.',
    timestamp: 'Yesterday',
    isRead: true,
    actionRoute: 'buyer-enquiry-log',
    supplierName: 'Velvet Touch Cosmetics',
    badgeText: 'Agreement Signed'
  }
];

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const stored = localStorage.getItem('nexora_buyer_notifications');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        // Fallback
      }
    }
    return MOCK_NOTIFICATIONS;
  });

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'rfq' | 'negotiation' | 'message'>('all');

  useEffect(() => {
    localStorage.setItem('nexora_buyer_notifications', JSON.stringify(notifications));
  }, [notifications]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleItemClick = (item: NotificationItem) => {
    setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, isRead: true } : n));
    if (item.actionRoute && onNavigate) {
      onNavigate(item.actionRoute);
    }
    onClose();
  };

  const filtered = notifications.filter(item => {
    if (activeFilter === 'unread') return !item.isRead;
    if (activeFilter === 'rfq') return item.type === 'rfq';
    if (activeFilter === 'negotiation') return item.type === 'negotiation';
    if (activeFilter === 'message') return item.type === 'message';
    return true;
  });

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'rfq':
        return <FileText className="w-4 h-4 text-[#0050d6]" />;
      case 'negotiation':
        return <TrendingUp className="w-4 h-4 text-[#b90064]" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-emerald-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 md:p-6 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl border border-[#e8e8e8] w-full max-w-md shadow-2xl overflow-hidden mt-16 md:mt-12 animate-in slide-in-from-top-4 duration-200 text-left"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#f0edec] bg-[#fcf9f8] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#fde7f3] text-[#b90064] flex items-center justify-center font-bold">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-[#1c1b1b]">Notification Center</h3>
                {notifications.some(n => !n.isRead) && (
                  <span className="px-2 py-0.5 rounded-full bg-[#b90064] text-white text-[10px] font-black">
                    {notifications.filter(n => !n.isRead).length} New
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#8c7077] font-medium">Real-time RFQ, quote, and message updates</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleMarkAllRead}
              className="p-1.5 text-[#8c7077] hover:text-[#b90064] rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
              title="Mark all as read"
            >
              <CheckCheck className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#8c7077] hover:text-[#1c1b1b] rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-1.5 p-2 bg-white border-b border-[#f0edec] overflow-x-auto no-scrollbar">
          {(['all', 'unread', 'negotiation', 'rfq', 'message'] as const).map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeFilter === f
                  ? 'bg-[#b90064] text-white shadow-xs'
                  : 'bg-[#fcf9f8] text-[#594047] hover:bg-[#f0edec]'
              }`}
            >
              {f === 'all' ? 'All' : f === 'unread' ? 'Unread' : f === 'negotiation' ? 'Offers' : f === 'rfq' ? 'RFQs' : 'Chats'}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-[#f0edec]">
          {filtered.length > 0 ? (
            filtered.map(item => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`p-4 transition-all cursor-pointer hover:bg-[#fdf8f8] flex items-start gap-3 relative ${
                  !item.isRead ? 'bg-[#fde7f3]/20' : 'bg-white'
                }`}
              >
                {!item.isRead && (
                  <div className="absolute top-4 left-2 w-1.5 h-1.5 rounded-full bg-[#b90064]" />
                )}

                <div className="w-9 h-9 rounded-xl bg-[#fcf9f8] border border-[#e8e8e8] flex items-center justify-center shrink-0 mt-0.5">
                  {getIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-[#1c1b1b] truncate">{item.title}</span>
                    <span className="text-[10px] text-[#8c7077] font-medium shrink-0">{item.timestamp}</span>
                  </div>

                  <p className="text-[11px] text-[#594047] leading-relaxed font-medium line-clamp-2 mb-2">
                    {item.message}
                  </p>

                  <div className="flex items-center justify-between">
                    {item.supplierName && (
                      <span className="text-[10px] font-bold text-[#8c7077] flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-[#b90064]" />
                        {item.supplierName}
                      </span>
                    )}

                    {item.badgeText && (
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[#fde7f3] text-[#b90064] border border-[#f5d6df]">
                        {item.badgeText}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-[#8c7077] font-bold">
              No notifications found for this filter.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#fcf9f8] border-t border-[#f0edec] text-center">
          <button
            onClick={() => {
              if (onNavigate) onNavigate('buyer-enquiry-log');
              onClose();
            }}
            className="text-xs font-extrabold text-[#b90064] hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
          >
            <span>View All Sourcing Activity</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
