"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import type { ReactNode } from "react";

type AuthCardProps = {
  children: ReactNode;
  title: string;
  description: string;
  footerContent: ReactNode;
};

export function AuthCard({
  children,
  title,
  description,
  footerContent,
}: AuthCardProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
        <CardFooter>
          {footerContent}
        </CardFooter>
      </Card>
    </div>
  );
}
