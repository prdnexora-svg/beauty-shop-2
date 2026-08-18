// ============================================================================
// NEXORA LUXE - SUPABASE CLIENT & REALTIME INITIALIZATION LAYER
// ============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables or standard fallback credentials for dev environment
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://mock-nexora-project.supabase.co';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vY2stbmV4b3JhLXByb2plY3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcwMDA0MDAwMCwiZXhwIjoyMDE1NjE2MDAwfQ.mock_key_nexora';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
  }
  return supabaseClient;
}

export const supabase = getSupabaseClient();
