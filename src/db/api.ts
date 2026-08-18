// ============================================================================
// NEXORA LUXE - PHASE 4 UNIFIED BACKEND API & REST/RELATIONAL CLIENT LAYER
// ============================================================================

import { db } from './database';
import {
  DBUser,
  DBProfileBuyer,
  DBProfileSupplier,
  DBProduct,
  DBRFQEnquiry,
  DBQuote,
  DBMessage,
  DBFollowUp,
  PopulatedRFQEnquiry,
  PopulatedQuote,
  PopulatedProduct,
  UserRole
} from './types';

// ============================================================================
// AUTH & SESSION API
// ============================================================================

export interface AuthSession {
  user: DBUser;
  buyerProfile?: DBProfileBuyer;
  supplierProfile?: DBProfileSupplier;
  token: string;
}

export const authApi = {
  async getSession(): Promise<AuthSession | null> {
    try {
      const stored = localStorage.getItem('nexora_user_session');
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      const user = db.getUserByEmailOrPhone(parsed.email) || db.getUserById(parsed.userId);
      if (!user) return null;

      const buyerProfile = db.getBuyerProfileByUserId(user.id);
      const supplierProfile = db.getSupplierProfileByUserId(user.id);

      return {
        user,
        buyerProfile,
        supplierProfile,
        token: parsed.token || 'nexora_token_mock'
      };
    } catch {
      return null;
    }
  },

  async login(identifier: string, passwordOrOtp: string): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
    const user = db.getUserByEmailOrPhone(identifier);
    if (!user) {
      // Auto-register if new user in simulation
      return { success: false, error: 'User not found. Please register your business account.' };
    }

    // OTP / Password validation
    if (passwordOrOtp === '1234' || passwordOrOtp.length >= 4) {
      const token = `nexora_jwt_${Date.now()}`;
      const buyerProfile = db.getBuyerProfileByUserId(user.id);
      const supplierProfile = db.getSupplierProfileByUserId(user.id);

      const sessionData = {
        userId: user.id,
        email: user.email,
        name: buyerProfile?.contact_name || supplierProfile?.company_name || 'Nexora Member',
        role: user.role,
        token,
        authenticatedAt: new Date().toISOString()
      };

      localStorage.setItem('nexora_user_session', JSON.stringify(sessionData));
      localStorage.setItem('nexora_is_logged_in', 'true');
      localStorage.setItem('nexora_user_role', user.role);

      return {
        success: true,
        session: {
          user,
          buyerProfile,
          supplierProfile,
          token
        }
      };
    }

    return { success: false, error: 'Invalid password or verification code.' };
  },

  async register(data: {
    emailOrPhone: string;
    businessName: string;
    role: UserRole;
    contactName?: string;
  }): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
    const isEmail = data.emailOrPhone.includes('@');
    const email = isEmail ? data.emailOrPhone : `${data.businessName.toLowerCase().replace(/[^a-z0-9]/g, '')}@sourcing.in`;
    const phone = isEmail ? '+91 98000 00000' : data.emailOrPhone;

    const existing = db.getUserByEmailOrPhone(data.emailOrPhone);
    const user = existing || db.createUser({
      email,
      phone,
      password_hash: 'hashed_account_security_key',
      role: data.role
    });

    let buyerProfile: DBProfileBuyer | undefined;
    let supplierProfile: DBProfileSupplier | undefined;

    if (data.role === 'buyer') {
      buyerProfile = db.upsertBuyerProfile({
        user_id: user.id,
        contact_name: data.contactName || 'Procurement Manager',
        company_name: data.businessName
      });
    } else if (data.role === 'supplier') {
      supplierProfile = db.upsertSupplierProfile({
        user_id: user.id,
        company_name: data.businessName
      });
    }

    const token = `nexora_jwt_${Date.now()}`;
    const sessionData = {
      userId: user.id,
      email: user.email,
      name: data.businessName,
      role: data.role,
      token,
      authenticatedAt: new Date().toISOString()
    };

    localStorage.setItem('nexora_user_session', JSON.stringify(sessionData));
    localStorage.setItem('nexora_is_logged_in', 'true');
    localStorage.setItem('nexora_user_role', data.role);

    return {
      success: true,
      session: {
        user,
        buyerProfile,
        supplierProfile,
        token
      }
    };
  },

  async switchRole(userId: string, targetRole: UserRole): Promise<DBUser | undefined> {
    const updated = db.updateUserRole(userId, targetRole);
    if (updated) {
      localStorage.setItem('nexora_user_role', targetRole);
      // Ensure target profile exists
      if (targetRole === 'buyer' && !db.getBuyerProfileByUserId(userId)) {
        db.upsertBuyerProfile({
          user_id: userId,
          contact_name: 'Procurement Specialist',
          company_name: 'Independent Buyer'
        });
      } else if (targetRole === 'supplier' && !db.getSupplierProfileByUserId(userId)) {
        db.upsertSupplierProfile({
          user_id: userId,
          company_name: 'Verified Manufacturing Hub'
        });
      }
    }
    return updated;
  },

  logout(): void {
    localStorage.removeItem('nexora_user_session');
    localStorage.setItem('nexora_is_logged_in', 'false');
    localStorage.setItem('nexora_user_role', 'guest');
  }
};

// ============================================================================
// BUYER API (RFQs, Enquiries, Quotes Comparison & Negotiation)
// ============================================================================

export const buyerApi = {
  async getProfile(buyerIdOrUserId: string): Promise<DBProfileBuyer | undefined> {
    return db.getBuyerProfileById(buyerIdOrUserId) || db.getBuyerProfileByUserId(buyerIdOrUserId);
  },

  async updateProfile(profile: Partial<DBProfileBuyer> & { user_id: string; contact_name: string }): Promise<DBProfileBuyer> {
    return db.upsertBuyerProfile(profile);
  },

  async getEnquiries(buyerId: string): Promise<PopulatedRFQEnquiry[]> {
    return db.getRFQsAndEnquiries({ buyer_id: buyerId });
  },

  async getRFQs(buyerId: string): Promise<PopulatedRFQEnquiry[]> {
    return db.getRFQsAndEnquiries({ buyer_id: buyerId, type: 'public_rfq' });
  },

  async createEnquiryOrRFQ(data: {
    buyer_id: string;
    supplier_id?: string | null;
    product_id?: string | null;
    requirement_title: string;
    category: string;
    quantity_required: number;
    quantity_unit?: string;
    target_budget?: number;
    delivery_location: string;
    details: string;
    attachments?: string[];
    type: 'direct_enquiry' | 'public_rfq';
    send_to_similar_suppliers?: boolean;
  }): Promise<{ success: boolean; rfq?: DBRFQEnquiry; errors?: string[] }> {
    // Form Validation Check
    const validation = db.validateRFQ(data);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    const rfq = db.createRFQEnquiry({
      buyer_id: data.buyer_id,
      supplier_id: data.supplier_id || null,
      product_id: data.product_id || null,
      requirement_title: data.requirement_title,
      category: data.category,
      quantity_required: data.quantity_required,
      quantity_unit: data.quantity_unit || 'Units',
      target_budget: data.target_budget,
      delivery_location: data.delivery_location,
      details: data.details,
      attachments: data.attachments || [],
      status: 'new',
      type: data.type,
      send_to_similar_suppliers: data.send_to_similar_suppliers ?? true
    });

    return { success: true, rfq };
  },

  async getQuotesForRFQ(rfqId: string): Promise<PopulatedQuote[]> {
    return db.getQuotesByRfqId(rfqId);
  },

  async acceptQuote(quoteId: string): Promise<DBQuote | undefined> {
    return db.updateQuoteStatus(quoteId, 'accepted');
  },

  async counterOfferQuote(quoteId: string, counterPrice: number, notes: string): Promise<DBQuote | undefined> {
    return db.updateQuoteStatus(quoteId, 'negotiating', {
      counter_offer_price: counterPrice,
      counter_offer_notes: notes
    });
  },

  async rejectQuote(quoteId: string): Promise<DBQuote | undefined> {
    return db.updateQuoteStatus(quoteId, 'rejected');
  }
};

// ============================================================================
// SUPPLIER API (Catalogue, Lead Funnel, Quote Submission, Follow-ups)
// ============================================================================

export const supplierApi = {
  async getProfile(supplierIdOrUserId: string): Promise<DBProfileSupplier | undefined> {
    return db.getSupplierProfileById(supplierIdOrUserId) || db.getSupplierProfileByUserId(supplierIdOrUserId);
  },

  async getAllSuppliers(): Promise<DBProfileSupplier[]> {
    return db.getSupplierProfiles();
  },

  async updateProfile(profile: Partial<DBProfileSupplier> & { user_id: string; company_name: string }): Promise<DBProfileSupplier> {
    return db.upsertSupplierProfile(profile);
  },

  async getProducts(supplierId?: string): Promise<PopulatedProduct[]> {
    return db.getProducts({ supplier_id: supplierId });
  },

  async createProduct(product: Omit<DBProduct, 'id' | 'created_at' | 'updated_at'>): Promise<DBProduct> {
    return db.createProduct(product);
  },

  async updateProduct(id: string, updates: Partial<DBProduct>): Promise<DBProduct | undefined> {
    return db.updateProduct(id, updates);
  },

  async deleteProduct(id: string): Promise<boolean> {
    return db.deleteProduct(id);
  },

  async getIncomingLeads(supplierId: string): Promise<PopulatedRFQEnquiry[]> {
    return db.getRFQsAndEnquiries({ supplier_id: supplierId });
  },

  async getMarketplaceRFQs(): Promise<PopulatedRFQEnquiry[]> {
    return db.getRFQsAndEnquiries({ type: 'public_rfq' });
  },

  async submitQuote(quoteData: {
    rfq_id: string;
    supplier_id: string;
    unit_price: number;
    total_price: number;
    moq_offered: number;
    lead_time: string;
    validity_date: string;
    terms_and_conditions: string;
    attachment_url?: string;
    sample_available: boolean;
    sample_cost?: number;
    notes?: string;
  }): Promise<DBQuote> {
    return db.createQuote({
      ...quoteData,
      status: 'submitted'
    });
  },

  async getFollowUps(supplierId: string): Promise<DBFollowUp[]> {
    return db.getFollowUps(supplierId);
  },

  async createFollowUp(data: Omit<DBFollowUp, 'id' | 'created_at' | 'updated_at'>): Promise<DBFollowUp> {
    return db.createFollowUp(data);
  },

  async completeFollowUp(id: string): Promise<DBFollowUp | undefined> {
    return db.updateFollowUpStatus(id, 'completed');
  }
};

// ============================================================================
// CHAT & DIRECT COMMUNICATION API
// ============================================================================

export const chatApi = {
  async getMessages(conversationId?: string): Promise<DBMessage[]> {
    return db.getMessages(conversationId);
  },

  async sendMessage(data: {
    conversation_id: string;
    sender_id: string;
    receiver_id: string;
    rfq_id?: string;
    product_id?: string;
    message_body: string;
    attachments?: string[];
  }): Promise<DBMessage> {
    return db.sendMessage({
      ...data,
      attachments: data.attachments || []
    });
  },

  async markRead(conversationId: string, receiverId: string): Promise<void> {
    db.markMessagesAsRead(conversationId, receiverId);
  }
};

// ============================================================================
// VALIDATION & HELPERS API
// ============================================================================

export const validationApi = {
  validateGST: (gst: string) => db.validateGST(gst),
  validatePhone: (phone: string) => db.validatePhone(phone),
  validateRFQ: (rfq: Partial<DBRFQEnquiry>) => db.validateRFQ(rfq)
};
