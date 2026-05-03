"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/firebase";
import { resetPassword } from "@/lib/firebase/auth";
import { AuthCard } from "./auth-card";
import Link from "next/link";

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const { toast } = useToast();
  const auth = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordFormData) {
    if (!auth) {
      toast({
        variant: "destructive",
        title: "Authentication service not available.",
      });
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(auth, values.email);
      setIsSubmitted(true);
    } catch (error: any) {
      const errorCode = error.code;
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (errorCode === "auth/user-not-found") {
        errorMessage = "No user found with this email address.";
      }
      toast({
        variant: "destructive",
        title: "Password Reset Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthCard
      title="Forgot Password"
      description={isSubmitted ? "Check your email for the reset link." : "Enter your email to reset your password."}
      footerContent={
        <div className="text-center text-sm text-muted-foreground w-full">
            Remembered your password?{" "}
            <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
                Log In
            </Link>
        </div>
      }
    >
      {isSubmitted ? (
         <div className="py-4 text-center text-sm">
            If an account with that email exists, a password reset link has been sent.
         </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Reset Link
            </Button>
          </form>
        </Form>
      )}
    </AuthCard>
  );
}
