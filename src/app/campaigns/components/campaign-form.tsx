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
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
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

    setDoc(docRef, data, { merge: true })
      .then(() => {
        toast({ title: campaignId ? "Campaign Updated" : "Campaign Saved as Draft" });
        if (!campaignId) {
          router.push(`/campaigns/${id}/edit`);
        }
      })
      .catch(async () => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: "write",
          requestResourceData: data,
        });
        errorEmitter.emit("permission-error", permissionError);
      })
      .finally(() => {
        setIsLoading(false);
      });
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
      
      const result = await processBatchAction(campaignData as Campaign, batch, sender);
      
      totalSent += result.sent;
      totalFailed += result.failed;

      updateDoc(campaignRef, {
        sentCount: totalSent,
        failedCount: totalFailed,
        updatedAt: serverTimestamp(),
      });

      const logsRef = collection(db, "users", user.uid, "campaigns", campaignData.id, "logs");
      for (const log of result.logs) {
        addDoc(logsRef, log);
      }
      
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

  if (campaignId && campaignLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
              </CardContent>
            </Card>

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
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="body"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message Body (HTML Supported)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Hi {{firstName}}, I noticed {{company}} is..."
                          className="min-h-[400px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-8">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <CardTitle>Review & Launch</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
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
                        SUCCESS: {campaignData?.sentCount || 0}
                      </div>
                      <div className="p-2 bg-red-50 text-red-700 rounded border border-red-100">
                        FAILED: {campaignData?.failedCount || 0}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    <div className="space-y-2 p-3 rounded-lg bg-muted/30 border">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-muted-foreground">Recipients</span>
                        <span className="font-bold">{selectedList?.contacts.length || 0}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-muted-foreground">Sender Email</span>
                        <span className="font-medium truncate max-w-[120px]">{sender.fromEmail || "Not Set"}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-muted-foreground">Status</span>
                        <span className={cn("font-bold uppercase", sender.isDomainVerified ? "text-green-600" : "text-red-600")}>
                          {sender.isDomainVerified ? "Verified" : "Action Required"}
                        </span>
                      </div>
                    </div>

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
                      Save Draft
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

                <Separator />

                <div className="space-y-3">
                   <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Rate Limiting</Label>
                      <p className="text-[10px] text-muted-foreground">Smooth dispatch</p>
                    </div>
                    <Switch 
                      checked={form.watch("smartRateLimiting")} 
                      onCheckedChange={(val) => form.setValue("smartRateLimiting", val)}
                      disabled={isSending}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Safety Auto-Pause</Label>
                      <p className="text-[10px] text-muted-foreground">Pause if bounce rate &gt; 5%</p>
                    </div>
                    <Switch 
                      checked={form.watch("pauseOnBounceThreshold")} 
                      onCheckedChange={(val) => form.setValue("pauseOnBounceThreshold", val)}
                      disabled={isSending}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </Form>
    </div>
  );
}
