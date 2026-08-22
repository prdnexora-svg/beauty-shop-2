import React, { createContext, useContext } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DatabaseState } from '../db/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mock-nexora-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vY2stbmV4b3JhLXByb2plY3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcwMDA0MDAwMCwiZXhwIjoyMDE1NjE2MDAwfQ.mock_key_nexora';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes('mock-nexora-project') && !url.includes('your-project'));
}

export function getSupabaseConfigInfo() {
  return {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    isConfigured: isSupabaseConfigured(),
    anonKeyTruncated: import.meta.env.VITE_SUPABASE_ANON_KEY 
      ? `${import.meta.env.VITE_SUPABASE_ANON_KEY.slice(0, 10)}...${import.meta.env.VITE_SUPABASE_ANON_KEY.slice(-6)}`
      : 'Not set'
  };
}

export async function testSupabaseConnection(): Promise<{ connected: boolean; message: string; details?: any; latencyMs?: number }> {
  const start = performance.now();
  try {
    if (!isSupabaseConfigured()) {
      return {
        connected: false,
        message: 'Supabase credentials are not yet configured in environment variables (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Currently running with local client persistence store.',
      };
    }

    const { data, error } = await supabase.from('products').select('id', { count: 'exact', head: true });
    const latencyMs = Math.round(performance.now() - start);

    if (error) {
      return {
        connected: false,
        message: `Supabase connected, table query note: ${error.message}. (Ensure schema migration is run in Supabase SQL editor)`,
        latencyMs,
      };
    }
    return {
      connected: true,
      message: `Successfully connected to live Supabase PostgreSQL database! (${latencyMs}ms response time)`,
      details: data,
      latencyMs,
    };
  } catch (err: any) {
    return {
      connected: false,
      message: err?.message || 'Error connecting to Supabase instance.',
    };
  }
}

/**
 * Push all active local database entities to Supabase tables
 */
export async function syncAllDataToSupabase(state: DatabaseState): Promise<{ success: boolean; syncedCount: number; errors: string[] }> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      syncedCount: 0,
      errors: ['Supabase credentials (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY) are not set.']
    };
  }

  const errors: string[] = [];
  let syncedCount = 0;

  try {
    // 1. Sync Users
    if (state.users?.length) {
      const { error } = await supabase.from('users').upsert(state.users);
      if (error) errors.push(`users: ${error.message}`);
      else syncedCount += state.users.length;
    }

    // 2. Sync Buyers
    if (state.profiles_buyer?.length) {
      const { error } = await supabase.from('profiles_buyer').upsert(state.profiles_buyer);
      if (error) errors.push(`profiles_buyer: ${error.message}`);
      else syncedCount += state.profiles_buyer.length;
    }

    // 3. Sync Suppliers
    if (state.profiles_supplier?.length) {
      const { error } = await supabase.from('profiles_supplier').upsert(state.profiles_supplier);
      if (error) errors.push(`profiles_supplier: ${error.message}`);
      else syncedCount += state.profiles_supplier.length;
    }

    // 4. Sync Products
    if (state.products?.length) {
      const { error } = await supabase.from('products').upsert(state.products);
      if (error) errors.push(`products: ${error.message}`);
      else syncedCount += state.products.length;
    }

    // 5. Sync RFQs & Enquiries
    if (state.rfqs_enquiries?.length) {
      const { error } = await supabase.from('rfqs_enquiries').upsert(state.rfqs_enquiries);
      if (error) errors.push(`rfqs_enquiries: ${error.message}`);
      else syncedCount += state.rfqs_enquiries.length;
    }

    // 6. Sync Quotes
    if (state.quotes?.length) {
      const { error } = await supabase.from('quotes').upsert(state.quotes);
      if (error) errors.push(`quotes: ${error.message}`);
      else syncedCount += state.quotes.length;
    }

    // 7. Sync Messages
    if (state.messages?.length) {
      const { error } = await supabase.from('messages').upsert(state.messages);
      if (error) errors.push(`messages: ${error.message}`);
      else syncedCount += state.messages.length;
    }

    return {
      success: errors.length === 0,
      syncedCount,
      errors
    };
  } catch (err: any) {
    return {
      success: false,
      syncedCount,
      errors: [err.message || 'Unexpected synchronization error.']
    };
  }
}

export interface SupabaseContextType {
  supabase: SupabaseClient;
  isConfigured: boolean;
  testConnection: () => Promise<{ connected: boolean; message: string; details?: any; latencyMs?: number }>;
  syncData: (state: DatabaseState) => Promise<{ success: boolean; syncedCount: number; errors: string[] }>;
}

export const SupabaseContext = createContext<SupabaseContextType>({
  supabase,
  isConfigured: false,
  testConnection: testSupabaseConnection,
  syncData: syncAllDataToSupabase,
});

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isConfigured = isSupabaseConfigured();

  return React.createElement(
    SupabaseContext.Provider,
    {
      value: {
        supabase,
        isConfigured,
        testConnection: testSupabaseConnection,
        syncData: syncAllDataToSupabase,
      },
    },
    children
  );
};

export const useSupabase = () => useContext(SupabaseContext);


