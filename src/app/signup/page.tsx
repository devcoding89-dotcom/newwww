'use client';

import { SignupForm } from "@/components/auth/signup-form";
import { useRedirectIfAuthenticated } from "@/hooks/use-redirect-if-authenticated";

export default function SignupPage() {
  useRedirectIfAuthenticated();
  return <SignupForm />;
}
