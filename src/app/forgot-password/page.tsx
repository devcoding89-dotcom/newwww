'use client';

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { useRedirectIfAuthenticated } from "@/hooks/use-redirect-if-authenticated";

export default function ForgotPasswordPage() {
  useRedirectIfAuthenticated();
  return <ForgotPasswordForm />;
}
