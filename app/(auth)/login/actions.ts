"use server";

import { createClient } from "@/lib/supabase/server";

export async function loginAction(data: { email: string; password: string }) {
  const supabase = await createClient();
  
  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    return { error: "Email atau kata sandi salah" };
  }

  // Check if profile is active
  const { data: userResp } = await supabase.auth.getUser();
  if (userResp.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_active")
      .eq("id", userResp.user.id)
      .single();

    if (profile && profile.is_active === false) {
      await supabase.auth.signOut();
      return { error: "Akun Anda tidak aktif. Silakan hubungi admin." };
    }
  }

  return { success: true };
}
