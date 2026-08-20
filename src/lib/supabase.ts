import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mock-nexora-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vY2stbmV4b3JhLXByb2plY3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcwMDA0MDAwMCwiZXhwIjoyMDE1NjE2MDAwfQ.mock_key_nexora';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
  return Boolean(url && key && !url.includes('mock-nexora-project'));
}

export async function testSupabaseConnection(): Promise<{ connected: boolean; message: string; details?: any }> {
  try {
    const { data, error } = await supabase.from('products').select('count', { count: 'exact', head: true });
    if (error) {
      return {
        connected: false,
        message: isSupabaseConfigured()
          ? `Supabase connected, table status: ${error.message}`
          : 'Running with local client persistence fallback. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to connect live Supabase project.',
      };
    }
    return {
      connected: true,
      message: 'Successfully connected to live Supabase backend instance!',
      details: data,
    };
  } catch (err: any) {
    return {
      connected: false,
      message: err?.message || 'Client persistence active.',
    };
  }
}

