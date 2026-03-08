
"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Mail, Rocket, AlertTriangle, CheckCircle2, BarChart3, History, Loader2, Target } from "lucide-react";
import PageHeader from "@/components/page-header";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, Cell, ResponsiveContainer } from "recharts";
import { useFirestore, useUser, useCollection } from "@/firebase";
import { collection, query } from "firebase/firestore";

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  // Firestore Queries
  const parsesQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, "users", user.uid, "parses"));
  }, [db, user]);

  const campaignsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, "users", user.uid, "campaigns"));
  }, [db, user]);

  const contactsQuery = useMemo(() => {
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
    { name: "Unverified", value: stats.total - stats.valid - stats.invalid, fill: "hsl(var(--muted))" },
    { name: "Invalid", value: stats.invalid, fill: "hsl(var(--destructive))" },
  ], [stats]);

  const chartConfig = {
    value: { label: "Contacts" },
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
        title="Platform Insights"
        description={`Welcome back, ${user?.displayName || 'User'}. Here's your campaign performance overview.`}
      />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cloud Contacts</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Securely synced profiles</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Extractions</CardTitle>
            <Target className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parses?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Intelligent parses performed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campaigns</CardTitle>
            <Rocket className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Active outreach projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Health</CardTitle>
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
            <CardDescription>Breakdown of data quality across your contact database.</CardDescription>
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
              <History className="h-5 w-5 text-primary" />
              <CardTitle>Growth Roadmap</CardTitle>
            </div>
            <CardDescription>Optimization steps for your studio.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50">
              <div className="mt-1 rounded-full bg-primary/10 p-2 text-primary">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Launch A/B Test</p>
                <p className="mt-1 text-xs text-muted-foreground">Create two campaigns with different subject lines to optimize open rates.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50">
              <div className="mt-1 rounded-full bg-accent/10 p-2 text-accent-foreground">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Verify Domain</p>
                <p className="mt-1 text-xs text-muted-foreground">Head to settings to authenticate your business domain for 99.9% inbox placement.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50">
              <div className="mt-1 rounded-full bg-destructive/10 p-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Clean Inactive Data</p>
                <p className="mt-1 text-xs text-muted-foreground">Your invalid email count is {stats.invalid}. We recommend removing these to protect your IP reputation.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
