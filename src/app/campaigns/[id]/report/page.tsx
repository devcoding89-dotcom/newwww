
"use client";

import { useParams } from "next/navigation";
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import PageHeader from "@/components/page-header";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  AlertCircle, 
  Mail, 
  Clock, 
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { Campaign, EmailLog } from "@/lib/types";

export default function CampaignReportPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { user } = useUser();
  const db = useFirestore();

  const campaignRef = useMemoFirebase(() => {
    if (!db || !user || !id) return null;
    return doc(db, "users", user.uid, "campaigns", id);
  }, [db, user, id]);

  const { data: campaign, loading: campaignLoading } = useDoc<Campaign>(campaignRef);

  const logsQuery = useMemoFirebase(() => {
    if (!db || !user || !id) return null;
    return query(
      collection(db, "users", user.uid, "campaigns", id, "logs"),
      orderBy("sentAt", "desc")
    );
  }, [db, user, id]);

  const { data: logs, loading: logsLoading } = useCollection<EmailLog>(logsQuery);

  if (campaignLoading || logsLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="container py-12 text-center">
        <h2 className="text-xl font-bold">Campaign not found</h2>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/campaigns">Back to Campaigns</Link>
        </Button>
      </div>
    );
  }

  const successRate = campaign.totalCount 
    ? Math.round((campaign.sentCount / campaign.totalCount) * 100) 
    : 0;

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <PageHeader
        title={campaign.name}
        description={`Outreach Performance Report • Dispatched ${formatDistanceToNow(new Date(campaign.updatedAt))} ago`}
      >
        <Button variant="ghost" asChild size="sm">
          <Link href="/campaigns">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Success Rate</CardDescription>
            <CardTitle className="text-3xl font-black text-primary">{successRate}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={successRate} className="h-1.5" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Total Delivered</CardDescription>
            <CardTitle className="text-3xl font-black">{campaign.sentCount}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-xs text-green-600 font-medium">
            <CheckCircle2 className="h-3 w-3" /> Successfully reached mailbox
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Failed/Bounced</CardDescription>
            <CardTitle className="text-3xl font-black text-destructive">{campaign.failedCount}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <AlertCircle className="h-3 w-3" /> Blocked or invalid address
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Delivery Audit Trail
              </CardTitle>
              <CardDescription>Granular logs for every recipient in this batch.</CardDescription>
            </div>
            {logs && <Badge variant="secondary">{logs.length} Total Logs</Badge>}
          </div>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dispatch Time</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs?.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm">{log.recipientName}</span>
                      <span className="text-xs text-muted-foreground font-mono">{log.recipientEmail}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.status === 'delivered' ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100 uppercase text-[9px] font-black">
                        Delivered
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="uppercase text-[9px] font-black">
                        Failed
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(log.sentAt).toLocaleTimeString()}
                  </TableCell>
                  <TableCell className="text-right text-[10px] font-medium text-muted-foreground italic">
                    {log.error || "Mail accepted by server"}
                  </TableCell>
                </TableRow>
              ))}
              {logs?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    No delivery events recorded for this campaign.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
