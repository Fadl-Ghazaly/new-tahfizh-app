import { Suspense } from "react";
import LoginForm from "./login-form";
import { createClient } from "@/lib/supabase/server";
import { connection } from "next/server";

export const instant = false;

export default async function LoginPage() {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_public_school_settings");
  
  const schoolName = data && data.length > 0 ? data[0].school_name : "Pesantren Darul Ilmi";
  const logoUrl = data && data.length > 0 ? data[0].logo_url : null;

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Memuat...</div>}>
      <LoginForm schoolName={schoolName} logoUrl={logoUrl} />
    </Suspense>
  );
}
