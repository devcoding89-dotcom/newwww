
"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/page-header";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useToast } from "@/hooks/use-toast";
import { useGlobalLoading } from "@/hooks/use-global-loading";
import type { Campaign, ContactList, SmtpConfig } from "@/lib/types";
import { draftCampaignContentAction, sendCampaignAction } from "@/lib/actions";
import { Loader2, Wand2, Send, ChevronLeft, Info, CheckCircle2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  contactListId: z.string().nullable(),
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
  const { setIsLoading } = useGlobalLoading();
  const [campaigns, setCampaigns] = useLocalStorage<Campaign[]>("campaigns", []);
  const [contactLists] = useLocalStorage<ContactList[]>("contact-lists", []);
  const [smtpConfig] = useLocalStorage<SmtpConfig | null>("smtp-config", null);

  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null);

  const existingCampaign = campaignId
    ? campaigns.find((c) => c.id === campaignId)
    : null;

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: existingCampaign || {
      name: "",
      subject: "",
      body: "",
      contactListId: null,
    },
  });

  const [aiState, draftAction, isDrafting] = useActionState<
    { suggestedSubject?: string; suggestedBody?: string; error?: string },
    FormData
  >(async (prevState, formData) => {
    setIsLoading(true);
    const minWait = new Promise(resolve => setTimeout(resolve, 2000));
    try {
      const [result] = await Promise.all([
        draftCampaignContentAction({
          campaignName: formData.get("name") as string,
          emailSubjectPrompt: formData.get("subject") as string,
          emailBodyPrompt: formData.get("body") as string,
          availableTokens: availableTokens,
        }),
        minWait
      ]);
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

  function onSubmit(values: CampaignFormData) {
    if (campaignId) {
      const updatedCampaigns = campaigns.map((c) =>
        c.id === campaignId ? { ...c, ...values } : c
      );
      setCampaigns(updatedCampaigns);
      toast({ title: "Campaign Updated" });
    } else {
      const newCampaign: Campaign = {
        id: crypto.randomUUID(),
        ...values,
        createdAt: new Date().toISOString(),
      };
      setCampaigns([...campaigns, newCampaign]);
      toast({ title: "Campaign Saved" });
      router.push(`/campaigns/${newCampaign.id}/edit`);
    }
  }

  const handleSendCampaign = async () => {
    if (!smtpConfig || !smtpConfig.host) {
      toast({ variant: "destructive", title: "SMTP Not Configured", description: "Please configure your SMTP settings before sending." });
      return;
    }
    const values = form.getValues();
    if (!values.contactListId) {
      toast({ variant: "destructive", title: "No Contact List", description: "Please select a contact list." });
      return;
    }
    const contactList = contactLists.find(cl => cl.id === values.contactListId);
    if (!contactList || contactList.contacts.length === 0) {
      toast({ variant: "destructive", title: "Empty Contact List", description: "The selected contact list has no contacts." });
      return;
    }
    
    setIsSending(true);
    setIsLoading(true);
    setSendResult(null);
    
    try {
      const campaignData = { ...existingCampaign, ...values } as Campaign;
      const result = await sendCampaignAction(campaignData, contactList.contacts, smtpConfig);
      
      setSendResult({ sent: result.sent, failed: result.failed });
      
      if (result.failed === 0) {
        toast({
          title: "Campaign Sent Successfully!",
          description: `All ${result.sent} emails were delivered.`,
        });
      } else {
        toast({
          variant: result.sent > 0 ? "default" : "destructive",
          title: "Campaign Dispatch Finished",
          description: `${result.sent} sent, ${result.failed} failed. Check console for error details.`,
        });
        if (result.errors.length > 0) {
            console.error("Campaign Dispatch Errors:", result.errors);
        }
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Dispatch Failed", description: e.message });
    } finally {
      setIsSending(false);
      setIsLoading(false);
    }
  };

  const handleDraftWithAI = () => {
    const values = form.getValues();
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("subject", values.subject);
    formData.append("body", values.body);
    draftAction(formData);
  };

  useEffect(() => {
    if (campaignId && !existingCampaign) {
      router.push("/campaigns");
    }
  }, [campaignId, existingCampaign, router]);

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title={campaignId ? "Edit Campaign" : "New Campaign"}
        description="Craft your message, personalize it with tokens, and send it to your audience."
      >
        <Button variant="outline" asChild>
          <Link href="/campaigns">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </Link>
        </Button>
      </PageHeader>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-8 lg:grid-cols-3"
        >
          <div className="space-y-8 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Q3 Product Launch" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Subject</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="An exciting update for you!"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        You can use tokens like {"{{firstName}}"} in the subject too.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Email Content</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="body"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Body</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Hi {{firstName}}, we have an exciting announcement..."
                          className="min-h-[300px]"
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

          <div className="space-y-8 lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>AI Tools</CardTitle>
                <CardDescription>Use AI to polish your copy.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  type="button" 
                  variant="secondary" 
                  className="w-full" 
                  disabled={isDrafting}
                  onClick={handleDraftWithAI}
                >
                    <Wand2 className="mr-2 h-4 w-4"/>
                    {isDrafting ? "AI is writing..." : "Draft Content with AI"}
                </Button>
                <Button type="submit" className="w-full">
                  Save Changes
                </Button>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Tokens</AlertTitle>
                  <AlertDescription className="text-xs">
                    {availableTokens.join(" ")}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dispatch</CardTitle>
                <CardDescription>Send this campaign to a list.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Controller
                  control={form.control}
                  name="contactListId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipient List</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? ""}
                        disabled={contactLists.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a list" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {contactLists.map((list) => (
                            <SelectItem key={list.id} value={list.id}>
                              {list.name} ({list.contacts.length} recipients)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="button"
                  onClick={handleSendCampaign}
                  className="w-full h-12 text-lg font-bold shadow-lg"
                  disabled={!existingCampaign || isSending || !form.getValues().contactListId}
                >
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Dispatching...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      Send Campaign Now
                    </>
                  )}
                </Button>

                {sendResult && (
                  <div className="mt-4 p-4 rounded-lg bg-muted flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-green-500" /> Sent:</span>
                      <span className="font-bold">{sendResult.sent}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-1"><AlertTriangle className="h-4 w-4 text-amber-500" /> Failed:</span>
                      <span className="font-bold">{sendResult.failed}</span>
                    </div>
                  </div>
                )}

                {!existingCampaign && (
                  <p className="text-xs text-muted-foreground text-center italic">Save the campaign first to unlock sending.</p>
                )}
                 {!smtpConfig?.host && (
                  <p className="text-xs text-destructive text-center font-medium">SMTP not configured in Settings.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </form>
      </Form>
    </div>
  );
}
