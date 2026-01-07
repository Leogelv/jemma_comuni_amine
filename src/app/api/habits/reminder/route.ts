import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;

const supabase = supabaseUrl && serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;

// PATCH - Обновить настройки напоминаний привычки
export async function PATCH(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
  }

  try {
    const payload = await request.json();
    const { habit_id, reminder_enabled, reminder_time } = payload;

    if (!habit_id) {
      return NextResponse.json({ error: 'habit_id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('habits')
      .update({
        reminder_enabled: reminder_enabled ?? true,
        reminder_time: reminder_time ?? null,
      })
      .eq('id', habit_id)
      .select();

    if (error) {
      console.error('[api/habits/reminder] PATCH error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data?.[0] ?? null);
  } catch (err) {
    console.error('[api/habits/reminder] PATCH unexpected error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
