import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;

const supabase = supabaseUrl && serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;

// PATCH - Обновить профиль пользователя
export async function PATCH(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
  }

  try {
    const payload = await request.json();
    const { telegram_id, ...updateData } = payload;

    if (!telegram_id) {
      return NextResponse.json({ error: 'telegram_id is required' }, { status: 400 });
    }

    // Фильтруем только допустимые поля для обновления
    const allowedFields = [
      'first_name',
      'age',
      'gender',
      'timezone',
      'notifications_enabled',
      'default_reminder_time',
    ];

    const filteredData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    }

    if (Object.keys(filteredData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('tg_users')
      .update(filteredData)
      .eq('telegram_id', telegram_id)
      .select();

    if (error) {
      console.error('[api/user/profile] PATCH error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data?.[0] ?? null);
  } catch (err) {
    console.error('[api/user/profile] PATCH unexpected error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
