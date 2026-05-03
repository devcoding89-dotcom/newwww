'use client';

import { LoginForm } from "@/components/auth/login-form";
import { useRedirectIfAuthenticated } from "@/hooks/use-redirect-if-authenticated";

export default function LoginPage() {
  useRedirectIfAuthenticated();

  return (
    <LoginForm />
  );
}
