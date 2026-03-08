"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Mail, Rocket, AlertTriangle, CheckCircle2, BarChart3, Loader2, Target, ShieldCheck, TrendingUp, Sparkles } from "lucide-react";
import PageHeader from "@/components/page-header";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, Cell, Line, LineChart, ResponsiveContainer } from "recharts";
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, orderBy, limit, doc } from "firebase/firestore";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const { data: profile } = useDoc(userProfileRef);

  const parsesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "users", user.uid, "parses"), orderBy("createdAt", "desc"), limit(5));
  }, [db, user]);

  const campaignsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "users", user.uid, "campaigns"), orderBy("updatedAt", "desc"));
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

  const campaignMetrics = useMemo(() => {
    if (!campaigns) return { totalSent: 0, totalFailed: 0 };
    return campaigns.reduce((acc, curr) => ({
      totalSent: acc.totalSent + (curr.sentCount || 0),
      totalFailed: acc.totalFailed + (curr.failedCount || 0),
    }), { totalSent: 0, totalFailed: 0 });
  }, [campaigns]);

  const chartData = useMemo(() => [
    { name: "Verified", value: stats.valid, fill: "hsl(var(--primary))" },
    { name: "Pending", value: stats.total - stats.valid - stats.invalid, fill: "hsl(var(--muted))" },
    { name: "Flagged", value: stats.invalid, fill: "hsl(var(--destructive))" },
  ], [stats]);

  const performanceData = useMemo(() => {
    if (!campaigns) return [];
    return campaigns.slice(0, 7).reverse().map(c => ({
      name: c.name.substring(0, 10),
      delivered: c.sentCount || 0,
      failed: c.failedCount || 0,
    }));
  }, [campaigns]);

  const chartConfig = {
    value: { label: "Recipients" },
    delivered: { label: "Delivered", color: "hsl(var(--primary))" },
    failed: { label: "Failed", color: "hsl(var(--destructive))" },
  };

  if (isUserLoading || parsesLoading || campaignsLoading || contactsLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isElite = profile?.subscriptionTier === "elite";

  return (
    <div className="container mx-auto py-4 sm:py-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <PageHeader
          title="Studio Insights"
          description={`Welcome back, ${user?.displayName || 'User'}. Tracking ${campaigns?.length || 0} active campaigns.`}
        />
        {!isElite && (
          <Button variant="outline" className="border-amber-500 text-amber-600 hover:bg-amber-50" asChild>
             <Link href="/pricing">
               <Sparkles className="mr-2 h-4 w-4" /> Upgrade to Elite
             </Link>
          </Button>
        )}
      </div>
      
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard 
          title="Local Audience" 
          value={stats.total.toLocaleString()} 
          label="Unique verified leads" 
          icon={<Users className="h-4 w-4 text-primary" />} 
        />
        <StatCard 
          title="Successful Outreach" 
          value={campaignMetrics.totalSent.toLocaleString()} 
          label="Emails Delivered" 
          icon={<CheckCircle2 className="h-4 w-4 text-green-500" />} 
        />
        <StatCard 
          title="Active Campaigns" 
          value={(campaigns?.length || 0).toString()} 
          label="Managed campaigns" 
          icon={<Rocket className="h-4 w-4 text-primary" />} 
        />
        <StatCard 
          title="AI Intelligence" 
          value={(parses?.length || 0).toString()} 
          label="Extractions in Lagos" 
          icon={<Target className="h-4 w-4 text-accent" />} 
        />
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle>Delivery Performance</CardTitle>
            </div>
            <CardDescription>Outcome tracking across your recent Nigerian outreach batches.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] pt-4">
             <ChartContainer config={chartConfig}>
              <BarChart data={performanceData}>
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="delivered" fill="var(--color-delivered)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="failed" fill="var(--color-failed)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <CardTitle>List Health</CardTitle>
            </div>
            <CardDescription>Overall database verification status.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] pt-4">
            <ChartContainer config={chartConfig}>
              <BarChart data={chartData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" fontSize={10} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                   {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-12">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle>Recent Activity</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
             <div className="grid gap-4 md:grid-cols-3">
               {campaigns?.slice(0, 3).map(c => (
                 <div key={c.id} className="p-4 rounded-xl border bg-muted/20 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold truncate pr-2">{c.name}</span>
                      <Badge variant="secondary" className="text-[10px] uppercase font-black">{c.status}</Badge>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-muted-foreground">Success Rate</span>
                      <span className="font-mono">{c.totalCount ? Math.round((c.sentCount / c.totalCount) * 100) : 0}%</span>
                    </div>
                    <Progress value={c.totalCount ? (c.sentCount / c.totalCount) * 100 : 0} className="h-1" />
                 </div>
               ))}
               {campaigns?.length === 0 && (
                 <p className="col-span-3 text-center py-8 text-sm text-muted-foreground">No outreach activity recorded yet.</p>
               )}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, label, icon, className }: { title: string; value: string; label: string; icon: React.ReactNode; className?: string }) {
  return (
    <Card className="overflow-hidden border-border/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-black", className)}>{value}</div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-tight mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}
