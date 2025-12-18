import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;

const supabase = supabaseUrl && serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;

// GET - Получить все привычки пользователя
export async function GET(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const telegramId = searchParams.get('telegram_id');

    if (!telegramId) {
      return NextResponse.json({ error: 'telegram_id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('telegram_id', telegramId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[api/habits] GET error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err) {
    console.error('[api/habits] GET unexpected error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Создать новую привычку
export async function POST(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
  }

  try {
    const payload = await request.json();

    if (!payload?.telegram_id || !payload?.title) {
      return NextResponse.json({ error: 'telegram_id and title are required' }, { status: 400 });
    }

    const habitData = {
      telegram_id: payload.telegram_id,
      title: payload.title,
      category: payload.category || 'other',
      streak: 0,
      completed_dates: [],
      total_completions: 0,
    };

    const { data, error } = await supabase
      .from('habits')
      .insert(habitData)
      .select();

    if (error) {
      console.error('[api/habits] POST error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data?.[0] ?? null);
  } catch (err) {
    console.error('[api/habits] POST unexpected error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Обновить привычку (toggle completion)
export async function PATCH(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
  }

  try {
    const payload = await request.json();
    const { habit_id, date, telegram_id } = payload;

    if (!habit_id || !date) {
      return NextResponse.json({ error: 'habit_id and date are required' }, { status: 400 });
    }

    // Получаем текущую привычку
    const { data: habit, error: fetchError } = await supabase
      .from('habits')
      .select('*')
      .eq('id', habit_id)
      .single();

    if (fetchError || !habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    const completedDates: string[] = habit.completed_dates || [];
    const isCompleted = completedDates.includes(date);

    let newDates: string[];
    let pointsDelta = 0;

    if (isCompleted) {
      // Убираем дату
      newDates = completedDates.filter(d => d !== date);
      pointsDelta = -getPointsForCategory(habit.category);
    } else {
      // Добавляем дату
      newDates = [...completedDates, date];
      pointsDelta = getPointsForCategory(habit.category);
    }

    // Вычисляем streak
    const streak = calculateStreak(newDates);

    // Обновляем привычку
    const { data: updatedHabit, error: updateError } = await supabase
      .from('habits')
      .update({
        completed_dates: newDates,
        streak,
        total_completions: newDates.length,
      })
      .eq('id', habit_id)
      .select();

    if (updateError) {
      console.error('[api/habits] PATCH error', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Обновляем баллы пользователя
    if (telegram_id && pointsDelta !== 0) {
      await updateUserPoints(telegram_id, pointsDelta);
    }

    return NextResponse.json({
      habit: updatedHabit?.[0],
      pointsDelta,
    });
  } catch (err) {
    console.error('[api/habits] PATCH unexpected error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Обновить название привычки
export async function PUT(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
  }

  try {
    const payload = await request.json();
    const { habit_id, title } = payload;

    if (!habit_id || !title?.trim()) {
      return NextResponse.json({ error: 'habit_id and title are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('habits')
      .update({ title: title.trim() })
      .eq('id', habit_id)
      .select();

    if (error) {
      console.error('[api/habits] PUT error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data?.[0] ?? null);
  } catch (err) {
    console.error('[api/habits] PUT unexpected error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Удалить привычку
export async function DELETE(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const habitId = searchParams.get('habit_id');

    if (!habitId) {
      return NextResponse.json({ error: 'habit_id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', habitId);

    if (error) {
      console.error('[api/habits] DELETE error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[api/habits] DELETE unexpected error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Вспомогательные функции

function getPointsForCategory(category: string): number {
  const points: Record<string, number> = {
    sport: 10,
    nutrition: 8,
    regime: 12,
    other: 5,
  };
  return points[category] || 5;
}

function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const sortedDates = dates
    .map(d => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Проверяем, есть ли выполнение сегодня или вчера
  const latestDate = sortedDates[0];
  latestDate.setHours(0, 0, 0, 0);

  if (latestDate < yesterday) {
    return 0; // Streak прерван
  }

  let streak = 1;
  let currentDate = latestDate;

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - 1);

    const checkDate = sortedDates[i];
    checkDate.setHours(0, 0, 0, 0);

    if (checkDate.getTime() === prevDate.getTime()) {
      streak++;
      currentDate = checkDate;
    } else if (checkDate.getTime() < prevDate.getTime()) {
      break;
    }
  }

  return streak;
}

async function updateUserPoints(telegramId: number, pointsDelta: number) {
  if (!supabase) return;

  try {
    // Получаем текущие баллы
    const { data: user } = await supabase
      .from('tg_users')
      .select('total_points')
      .eq('telegram_id', telegramId)
      .single();

    const currentPoints = user?.total_points || 0;
    const newPoints = Math.max(0, currentPoints + pointsDelta);

    // Обновляем баллы
    await supabase
      .from('tg_users')
      .update({ total_points: newPoints })
      .eq('telegram_id', telegramId);
  } catch (error) {
    console.error('[api/habits] updateUserPoints error', error);
  }
}
