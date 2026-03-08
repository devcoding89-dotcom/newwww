
"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Mail, Rocket, AlertTriangle, CheckCircle2, BarChart3, History, Loader2, Target, ShieldCheck } from "lucide-react";
import PageHeader from "@/components/page-header";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, Cell } from "recharts";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query } from "firebase/firestore";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const parsesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "users", user.uid, "parses"));
  }, [db, user]);

  const campaignsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "users", user.uid, "campaigns"));
  }, [db, user]);

  const contactsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "users", user.uid, "contacts"));
  }, [db, user]);

  const { data: parses, isLoading: parsesLoading } = useCollection(parsesQuery);
  const { data: campaigns, isLoading: campaignsLoading } = useCollection(campaignsQuery);
  const { data: contacts, isLoading: contactsLoading } = useCollection(contactsQuery);

  const stats = useMemo(() => {
    if (!contacts) return { total: 0, valid: 0, invalid: 0 };
    return {
      total: contacts.length,
      valid: contacts.filter(c => c.isValid).length,
      invalid: contacts.filter(c => c.isValid === false).length,
    };
  }, [contacts]);

  const chartData = useMemo(() => [
    { name: "Verified", value: stats.valid, fill: "hsl(var(--primary))" },
    { name: "Pending", value: stats.total - stats.valid - stats.invalid, fill: "hsl(var(--muted))" },
    { name: "Flagged", value: stats.invalid, fill: "hsl(var(--destructive))" },
  ], [stats]);

  const chartConfig = {
    value: { label: "Recipients" },
  };

  if (isUserLoading || parsesLoading || campaignsLoading || contactsLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title="Studio Insights"
        description={`Welcome back, ${user?.displayName || 'User'}. Your sender reputation is currently stable.`}
      />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Audience</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Unique verified leads</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Intelligence</CardTitle>
            <Target className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parses?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Successful extractions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Outreach</CardTitle>
            <Rocket className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Managed campaigns</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Trust</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.total > 0 ? Math.round((stats.valid / stats.total) * 100) : 100}%
            </div>
            <p className="text-xs text-muted-foreground">Verified email percentage</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle>Audience Verification Status</CardTitle>
            </div>
            <CardDescription>Real-time breakdown of your database health.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ChartContainer config={chartConfig}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                   stroke="hsl(var(--muted-foreground))" 
                   fontSize={12} 
                   tickLine={false} 
                   axisLine={false} 
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                   {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <CardTitle>Growth Strategy</CardTitle>
            </div>
            <CardDescription>Optimization steps for your studio.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             {stats.total > 0 && stats.valid / stats.total < 0.9 && (
              <div className="flex items-start gap-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="mt-1 rounded-full bg-amber-100 p-2 text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-900">Cleaning Recommended</p>
                  <p className="mt-1 text-xs text-amber-700">You have {stats.total - stats.valid} unverified contacts. Clean your list in the <Link href="/contacts" className="font-bold underline">Contacts Intelligence</Link> panel to avoid bounces.</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50">
              <div className="mt-1 rounded-full bg-primary/10 p-2 text-primary">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Ready for Launch</p>
                <p className="mt-1 text-xs text-muted-foreground">You have {stats.valid} verified leads ready for immediate high-performance outreach.</p>
                <Button size="sm" variant="link" asChild className="p-0 h-auto text-xs">
                  <Link href="/campaigns/new">Draft Campaign</Link>
                </Button>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50">
              <div className="mt-1 rounded-full bg-accent/10 p-2 text-accent-foreground">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Scale Audience</p>
                <p className="mt-1 text-xs text-muted-foreground">Use the <Link href="/extract" className="font-bold underline">Extract tool</Link> to find more leads from your existing data sources.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
