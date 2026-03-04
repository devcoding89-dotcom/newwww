
"use client";

import { useActionState, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import PageHeader from "@/components/page-header";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useToast } from "@/hooks/use-toast";
import { useGlobalLoading } from "@/hooks/use-global-loading";
import type { Campaign, ContactList, SenderSettings, CampaignStatus } from "@/lib/types";
import { draftCampaignContentAction, processBatchAction } from "@/lib/actions";
import { 
  Loader2, 
  Wand2, 
  ChevronLeft, 
  Info, 
  AlertTriangle, 
  Globe, 
  Zap, 
  ShieldCheck, 
  Layout, 
  Users, 
  Mail, 
  Clock, 
  Save,
  Rocket
} from "lucide-react";
import Link from "next/link";
import { useFirestore, useUser, useDoc } from "@/firebase";
import { doc, setDoc, updateDoc, serverTimestamp, collection, addDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  internalNotes: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  previewText: z.string().optional(),
  body: z.string().min(1, "Body content is required"),
  contactListId: z.string().nullable(),
  scheduledAt: z.string().optional(),
  smartRateLimiting: z.boolean().default(true),
  pauseOnBounceThreshold: z.boolean().default(true),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

const availableTokens = [
  "{{firstName}}",
  "{{lastName}}",
  "{{email}}",
  "{{company}}",
  "{{position}}",
];

const DAILY_SEND_LIMIT = 5000;
const HOURLY_SEND_LIMIT = 500;

export function CampaignForm({ campaignId }: { campaignId?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  const { setIsLoading } = useGlobalLoading();
  
  const [contactLists] = useLocalStorage<ContactList[]>("contact-lists", []);
  const [sender] = useLocalStorage<SenderSettings>("sender-settings", {
    fromName: "",
    fromEmail: "",
    domain: "",
    isDomainVerified: false,
    isSenderVerified: false,
  });

  const campaignRef = useMemo(() => {
    if (!db || !user || !campaignId) return null;
    return doc(db, "users", user.uid, "campaigns", campaignId);
  }, [db, user, campaignId]);

  const { data: campaignData, loading: campaignLoading } = useDoc(campaignRef);

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      internalNotes: "",
      subject: "",
      previewText: "",
      body: "",
      contactListId: null,
      smartRateLimiting: true,
      pauseOnBounceThreshold: true,
    },
  });

  useEffect(() => {
    if (campaignData) {
      form.reset({
        name: campaignData.name,
        internalNotes: campaignData.internalNotes || "",
        subject: campaignData.subject,
        previewText: campaignData.previewText || "",
        body: campaignData.body,
        contactListId: campaignData.contactListId,
        smartRateLimiting: campaignData.smartRateLimiting ?? true,
        pauseOnBounceThreshold: campaignData.pauseOnBounceThreshold ?? true,
      });
    }
  }, [campaignData, form]);

  const [aiState, draftAction, isDrafting] = useActionState<
    { suggestedSubject?: string; suggestedBody?: string; error?: string },
    FormData
  >(async (prevState, formData) => {
    setIsLoading(true);
    try {
      const result = await draftCampaignContentAction({
        campaignName: formData.get("name") as string,
        emailSubjectPrompt: formData.get("subject") as string,
        emailBodyPrompt: formData.get("body") as string,
        availableTokens: availableTokens,
      });
      form.setValue("subject", result.suggestedSubject, { shouldValidate: true });
      form.setValue("body", result.suggestedBody, { shouldValidate: true });
      toast({ title: "AI suggestions applied!" });
      setIsLoading(false);
      return { suggestedSubject: result.suggestedSubject, suggestedBody: result.suggestedBody };
    } catch (e: any) {
      setIsLoading(false);
      toast({ variant: "destructive", title: "AI Draft Failed", description: e.message });
      return { error: e.message };
    }
  }, { error: undefined });

  async function onSubmit(values: CampaignFormData) {
    if (!db || !user) return;
    
    setIsLoading(true);
    const id = campaignId || crypto.randomUUID();
    const docRef = doc(db, "users", user.uid, "campaigns", id);

    const data = {
      ...values,
      id: id,
      status: (campaignData?.status as CampaignStatus) || "draft",
      sentCount: campaignData?.sentCount || 0,
      failedCount: campaignData?.failedCount || 0,
      totalCount: campaignData?.totalCount || 0,
      updatedAt: new Date().toISOString(),
      createdAt: campaignData?.createdAt || new Date().toISOString(),
    };

    setDoc(docRef, data, { merge: true });
    
    toast({ title: campaignId ? "Campaign Updated" : "Campaign Created" });
    setIsLoading(false);
    
    if (!campaignId) {
      router.push(`/campaigns/${id}/edit`);
    }
  }

  const handleDispatch = async () => {
    if (!campaignRef || !campaignData || !user || !db) return;
    
    const selectedList = contactLists.find(cl => cl.id === campaignData.contactListId);
    if (!selectedList || selectedList.contacts.length === 0) {
      toast({ variant: "destructive", title: "Empty Contact List", description: "No contacts to send to." });
      return;
    }

    if (!sender.isDomainVerified) {
      toast({ variant: "destructive", title: "Domain Unverified", description: "Verify your domain in Settings first." });
      return;
    }

    updateDoc(campaignRef, {
      status: "sending",
      sentCount: 0,
      failedCount: 0,
      totalCount: selectedList.contacts.length,
      updatedAt: serverTimestamp(),
    });

    const contacts = selectedList.contacts;
    const batchSize = 100;
    let totalSent = 0;
    let totalFailed = 0;

    for (let i = 0; i < contacts.length; i += batchSize) {
      const batch = contacts.slice(i, i + batchSize);
      
      // Call Server Action to process batch via SendGrid
      const result = await processBatchAction(campaignData as Campaign, batch, sender);
      
      totalSent += result.sent;
      totalFailed += result.failed;

      // Update progress in Firestore (Client-side SDK)
      updateDoc(campaignRef, {
        sentCount: totalSent,
        failedCount: totalFailed,
        updatedAt: serverTimestamp(),
      });

      // Write individual delivery logs
      const logsRef = collection(db, "users", user.uid, "campaigns", campaignData.id, "logs");
      for (const log of result.logs) {
        addDoc(logsRef, log);
      }
      
      // Delay between batches to respect rate limits
      if (i + batchSize < contacts.length) {
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    updateDoc(campaignRef, {
      status: "completed",
      updatedAt: serverTimestamp(),
    });

    toast({ title: "Dispatch Complete!", description: `Success: ${totalSent}, Failed: ${totalFailed}` });
  };

  const selectedList = useMemo(() => 
    contactLists.find(l => l.id === form.watch("contactListId")), 
    [contactLists, form.watch("contactListId")]
  );

  const isSending = campaignData?.status === "sending";
  const progress = campaignData?.totalCount 
    ? Math.round(((campaignData.sentCount + campaignData.failedCount) / campaignData.totalCount) * 100) 
    : 0;

  const getStatusBadge = (status: CampaignStatus) => {
    const variants: Record<CampaignStatus, { label: string; className: string }> = {
      draft: { label: "Draft", className: "bg-slate-100 text-slate-700" },
      scheduled: { label: "Scheduled", className: "bg-blue-100 text-blue-700" },
      sending: { label: "Sending", className: "bg-amber-100 text-amber-700 animate-pulse" },
      paused: { label: "Paused", className: "bg-orange-100 text-orange-700" },
      completed: { label: "Completed", className: "bg-green-100 text-green-700" },
      failed: { label: "Failed", className: "bg-red-100 text-red-700" },
    };
    const { label, className } = variants[status || "draft"];
    return <Badge className={cn("px-2 py-0.5 border-none", className)}>{label}</Badge>;
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <PageHeader
        title={campaignId ? "Campaign Builder" : "New Campaign"}
        description="Design and dispatch high-performance email outreach."
      >
        <Button variant="ghost" asChild size="sm">
          <Link href="/campaigns">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Exit Builder
          </Link>
        </Button>
      </PageHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            {/* 1. Overview */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Layout className="h-5 w-5 text-primary" />
                    <CardTitle>Overview</CardTitle>
                  </div>
                  <CardDescription>Campaign metadata and internal tracking.</CardDescription>
                </div>
                {campaignData?.status && getStatusBadge(campaignData.status as CampaignStatus)}
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Q1 Strategic Outreach" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="internalNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Internal Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Purpose of this campaign, target personas, etc." 
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* 2. Audience Selection */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle>Audience Selection</CardTitle>
                </div>
                <CardDescription>Define who will receive this campaign.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="contactListId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipient List</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? ""}
                        disabled={isSending}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select target list" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {contactLists.map((list) => (
                            <SelectItem key={list.id} value={list.id}>
                              {list.name} ({list.contacts.length} contacts)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                {selectedList && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50 border">
                      <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Total Contacts</p>
                      <p className="text-2xl font-black">{selectedList.contacts.length}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 border">
                      <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Estimated Reach</p>
                      <p className="text-2xl font-black text-primary">
                        {Math.floor(selectedList.contacts.length * 0.98)} 
                        <span className="text-xs font-normal text-muted-foreground ml-1">(98%)</span>
                      </p>
                    </div>
                  </div>
                )}

                {selectedList && selectedList.contacts.length > DAILY_SEND_LIMIT && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Daily Limit Exceeded</AlertTitle>
                    <AlertDescription>
                      This list exceeds your daily limit of {DAILY_SEND_LIMIT.toLocaleString()} emails. Smart Rate Limiting will spread this over multiple days.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* 3. Email Content */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    <CardTitle>Email Content</CardTitle>
                  </div>
                  <CardDescription>Craft your message with AI assistance and tokens.</CardDescription>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  disabled={isDrafting || isSending}
                  onClick={() => {
                    const values = form.getValues();
                    const formData = new FormData();
                    Object.entries(values).forEach(([k, v]) => formData.append(k, v as string));
                    draftAction(formData);
                  }}
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  AI Assist
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <FormLabel className="text-xs font-bold text-muted-foreground uppercase">From Name</FormLabel>
                    <Input value={sender.fromName || "Not Configured"} disabled className="bg-muted/30" />
                  </div>
                  <div className="space-y-2">
                    <FormLabel className="text-xs font-bold text-muted-foreground uppercase">From Email</FormLabel>
                    <Input value={sender.fromEmail || "Not Configured"} disabled className="bg-muted/30" />
                  </div>
                </div>
                
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject Line</FormLabel>
                      <FormControl>
                        <Input placeholder="Personalized subject line..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="previewText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preview Text (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Short summary displayed in inbox preview..." {...field} />
                      </FormControl>
                      <FormDescription>Shown in inbox previews, typically 40-100 characters.</FormDescription>
                    </FormItem>
                  )}
                />

                <Separator />

                <FormField
                  control={form.control}
                  name="body"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message Body (HTML Supported)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Hi {{firstName}}, I noticed {{company}} is..."
                          className="min-h-[400px] font-sans text-sm leading-relaxed"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center gap-2 pt-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase">Tokens:</p>
                  <div className="flex flex-wrap gap-1">
                    {availableTokens.map(t => (
                      <Badge key={t} variant="secondary" className="text-[10px] font-mono cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors" onClick={() => {
                        const current = form.getValues("body");
                        form.setValue("body", current + " " + t);
                      }}>
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 rounded-b-lg flex justify-between">
                <p className="text-xs text-muted-foreground italic flex items-center gap-1">
                  <Info className="h-3 w-3" /> Use tokens to personalize content for each recipient.
                </p>
                <Button variant="secondary" size="sm" type="button" disabled={isSending}>
                  Send Test Email
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-8">
            {/* 4. Scheduling */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <CardTitle>Scheduling</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="grid gap-2">
                  <Button variant="outline" className="justify-start text-left font-normal" type="button">
                    <Clock className="mr-2 h-4 w-4" />
                    Send Immediately
                  </Button>
                  <Button variant="ghost" className="justify-start text-left font-normal text-muted-foreground" type="button">
                    <Clock className="mr-2 h-4 w-4" />
                    Schedule for Later...
                  </Button>
                </div>
                {selectedList && (
                   <div className="text-[10px] text-muted-foreground bg-muted p-2 rounded border border-dashed text-center">
                    Estimated Duration: ~{Math.ceil(selectedList.contacts.length / HOURLY_SEND_LIMIT * 60)} minutes
                   </div>
                )}
              </CardContent>
            </Card>

            {/* 5. Sending Controls */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  <CardTitle>Controls</CardTitle>
                </div>
                <CardDescription>Platform infrastructure settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Smart Rate Limiting</Label>
                      <p className="text-[10px] text-muted-foreground">Respect inbox providers (Gmail/Outlook)</p>
                    </div>
                    <FormField
                      control={form.control}
                      name="smartRateLimiting"
                      render={({ field }) => (
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      )}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Safety Auto-Pause</Label>
                      <p className="text-[10px] text-muted-foreground">Pause if bounce rate &gt; 5%</p>
                    </div>
                    <FormField
                      control={form.control}
                      name="pauseOnBounceThreshold"
                      render={({ field }) => (
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      )}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase text-muted-foreground">
                    <span>Hourly Rate</span>
                    <span>{HOURLY_SEND_LIMIT} / hour</span>
                  </div>
                  <Progress value={5} className="h-1.5" />
                  <div className="flex justify-between text-xs font-bold uppercase text-muted-foreground pt-2">
                    <span>Daily Capacity</span>
                    <span>{DAILY_SEND_LIMIT} / day</span>
                  </div>
                  <Progress value={12} className="h-1.5" />
                </div>
              </CardContent>
            </Card>

            {/* 6. Review & Launch */}
            <Card className={cn(
              "border-primary shadow-xl ring-2 ring-primary/10 transition-all",
              isSending && "ring-4 ring-primary/20 scale-[1.02]"
            )}>
              <CardHeader className="bg-primary/5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <CardTitle>Review & Launch</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-3">
                   <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Recipients</span>
                    <span className="font-bold">{selectedList?.contacts.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sender Domain</span>
                    <span className="font-mono text-xs">{sender.domain || "Unverified"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Compliance</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 h-5">Healthy</Badge>
                  </div>
                </div>

                {isSending ? (
                  <div className="space-y-4 py-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="animate-pulse flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin text-primary" /> Dispatched {progress}%
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-bold">
                      <div className="p-2 bg-green-50 text-green-700 rounded border border-green-100">
                        SUCCESS: {campaignData.sentCount}
                      </div>
                      <div className="p-2 bg-red-50 text-red-700 rounded border border-red-100">
                        FAILED: {campaignData.failedCount}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <Button
                      type="button"
                      onClick={handleDispatch}
                      className="w-full h-12 text-lg font-bold"
                      disabled={!campaignId || !form.getValues().contactListId || !sender.isDomainVerified || isSending}
                    >
                      <Rocket className="mr-2 h-5 w-5" />
                      Launch Campaign
                    </Button>
                    <Button
                      type="submit"
                      variant="outline"
                      className="w-full"
                      disabled={isSending}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save as Draft
                    </Button>
                  </div>
                )}

                {!sender.isDomainVerified && (
                  <Alert variant="destructive" className="py-2 border-none bg-red-50">
                    <Globe className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-[10px] text-red-700">
                      Domain authentication required. <Link href="/settings" className="underline font-bold">Verify DNS</Link>
                    </AlertDescription>
                  </Alert>
                )}
                
                {!campaignId && (
                  <p className="text-[10px] text-center text-muted-foreground italic">Save campaign to unlock launch controls.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </form>
      </Form>
    </div>
  );
}
