// Supabase Browser Client (singleton)

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logDebug } from '@/shared/lib/debug-store';

let supabaseClient: SupabaseClient | null = null;

function initClient(): SupabaseClient | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    logDebug('supabase', 'error', 'Supabase env vars missing', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
    });
    console.error('Supabase environment variables are missing');
    return null;
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });

  logDebug('supabase', 'success', 'Supabase client initialized', {
    url: supabaseUrl.substring(0, 30) + '...',
  });

  return client;
}

export function createSupabaseBrowserClient(): SupabaseClient | null {
  if (!supabaseClient) {
    supabaseClient = initClient();
  }
  return supabaseClient;
}

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = initClient();
  }

  if (!supabaseClient) {
    throw new Error('Supabase client not available');
  }

  return supabaseClient;
}
