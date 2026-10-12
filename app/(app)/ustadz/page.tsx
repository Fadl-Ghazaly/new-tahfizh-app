import { createClient } from '@/lib/supabase/server';
import { UstadzClientContent } from './ustadz-client-content';
import { Suspense } from 'react';

export default async function UstadzPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user) {
    const { data } = await supabase.from('profiles').select('role, is_active').eq('id', user.id).single();
    isAdmin = data?.role === 'ADMIN' && data?.is_active === true;
  }
  return (
    <div className="flex flex-col gap-6">
      <Suspense><UstadzClientContent isAdmin={isAdmin} /></Suspense>
    </div>
  );
}
