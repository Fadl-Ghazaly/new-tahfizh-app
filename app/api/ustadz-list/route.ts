import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const showInactive = searchParams.get('inactive') === 'true';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = (page - 1) * limit;

  const supabase = await createClient();

  let query = supabase
    .from('teachers')
    .select('*, halaqahs(name, classes(name))', { count: 'exact' });

  if (!showInactive) {
    query = query.eq('is_active', true);
  }

  if (search) {
    const sanitized = search.replace(/[%_]/g, '');
    query = query.ilike('name', `%${sanitized}%`);
  }

  query = query.order('name', { ascending: true }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ teachers: data || [], count: count || 0 });
}
