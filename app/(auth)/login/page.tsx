import { Suspense } from "react";
import LoginForm from "./login-form";
import { getPublicSchoolSettings } from "@/lib/settings";

export default async function LoginPage() {
  const { school_name, logo_url } = await getPublicSchoolSettings();

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Memuat...</div>}>
      <LoginForm schoolName={school_name} logoUrl={logo_url} />
    </Suspense>
  );
}
