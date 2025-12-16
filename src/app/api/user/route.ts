import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;

const supabase = supabaseUrl && serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;

export async function POST(request: Request) {
  if (!supabase) {
    console.error('[api/user] Supabase env vars missing', { hasUrl: !!supabaseUrl });
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
  }

  try {
    const payload = await request.json();

    if (!payload?.telegram_id) {
      return NextResponse.json({ error: 'telegram_id is required' }, { status: 400 });
    }

    console.log('[api/user] Upserting user', { telegram_id: payload.telegram_id });

    const { data, error } = await supabase
      .from('tg_users')
      .upsert({
        ...payload,
        total_points: payload.total_points ?? 0,
        current_streak: payload.current_streak ?? 0,
      }, { onConflict: 'telegram_id' })
      .select();

    if (error) {
      console.error('[api/user] Supabase error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const user = data?.[0] ?? null;
    return NextResponse.json(user);
  } catch (err) {
    console.error('[api/user] Unexpected error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
