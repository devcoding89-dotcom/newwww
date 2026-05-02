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
import { signUp } from "@/lib/firebase/auth";
import { AuthCard } from "./auth-card";
import Link from "next/link";

const signupSchema = z.object({
  displayName: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type SignupFormData = z.infer<typeof signupSchema>;

export function SignupForm() {
  const { toast } = useToast();
  const auth = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { displayName: "", email: "", password: "" },
  });

  async function onSubmit(values: SignupFormData) {
    if (!auth) {
      toast({ variant: "destructive", title: "Auth service not available" });
      return;
    }
    setIsLoading(true);
    try {
      await signUp(auth, values);
      setIsSubmitted(true);
    } catch (error: any) {
      let description = "An unexpected error occurred. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        description = "This email is already in use. Please log in or use a different email.";
      } else if (error.code === 'auth/weak-password') {
        description = "The password is too weak.";
      } else if (error.code === 'auth/operation-not-allowed') {
        description = "Email/password accounts are not enabled.";
      }
      
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthCard
      title={isSubmitted ? "Check your email" : "Create an account"}
      description={
        isSubmitted
          ? "We've sent a verification link to your email address."
          : "Enter your information to create a new account"
      }
      footerContent={
        <div className="text-center text-sm text-muted-foreground w-full">
          {isSubmitted ? (
            <>
              Verified your email?{' '}
              <Link
                href="/login"
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                Log In
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                Log In
              </Link>
            </>
          )}
        </div>
      }
    >
      {isSubmitted ? (
        <div className="py-4 text-center text-sm">
          Please click the link in the email to finish signing up. You may need
          to check your spam folder.
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="name@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </form>
        </Form>
      )}
    </AuthCard>
  );
}
