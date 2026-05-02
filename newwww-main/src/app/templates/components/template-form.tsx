
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ChevronLeft, Save, Loader2, Sparkles, Wand2 } from "lucide-react";
import Link from "next/link";
import PageHeader from "@/components/page-header";
import { Badge } from "@/components/ui/badge";

const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  category: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body content is required"),
});

type TemplateFormData = z.infer<typeof templateSchema>;

const preBuiltTemplates = [
  {
    name: "Cold Outreach - Strategy A",
    category: "Sales",
    subject: "Quick question about {{company}}",
    body: "Hi {{firstName}},\n\nI've been following your work at {{company}} and noticed your focus on scaling. We help {{position}}s like yourself automate outreach while keeping it personal.\n\nWould you be open to a 5-minute chat next Tuesday?\n\nBest,\n[Your Name]"
  },
  {
    name: "Follow-Up - Non-Responsive",
    category: "Engagement",
    subject: "Re: Checking in",
    body: "Hi {{firstName}},\n\nWanted to float this to the top of your inbox. Totally understand if you're busy at {{company}} right now.\n\nIs scaling outreach still a priority for your team?\n\nBest,\n[Your Name]"
  },
  {
    name: "Event Invitation",
    category: "Networking",
    subject: "Exclusive Invite: {{position}} Roundtable",
    body: "Hi {{firstName}},\n\nWe're hosting a private roundtable for {{position}}s in the industry. Given your role at {{company}}, I thought you'd bring a great perspective to the table.\n\nDate: October 14th\nLocation: Virtual\n\nHope to see you there!\n\nBest,\n[Your Name]"
  }
];

export function TemplateForm({ templateId }: { templateId?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  const [isSaving, setIsSaving] = useState(false);

  const templateRef = useMemoFirebase(() => {
    if (!db || !user || !templateId) return null;
    return doc(db, "users", user.uid, "templates", templateId);
  }, [db, user, templateId]);

  const { data: templateData, loading: templateLoading } = useDoc(templateRef);

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      category: "General",
      subject: "",
      body: "",
    },
  });

  useEffect(() => {
    if (templateData) {
      form.reset({
        name: templateData.name,
        category: templateData.category || "General",
        subject: templateData.subject,
        body: templateData.body,
      });
    }
  }, [templateData, form]);

  const handleApplyPrebuilt = (prebuilt: any) => {
    form.setValue("name", prebuilt.name);
    form.setValue("category", prebuilt.category);
    form.setValue("subject", prebuilt.subject);
    form.setValue("body", prebuilt.body);
    toast({ title: "Template applied!", description: "You can now customize it." });
  };

  async function onSubmit(values: TemplateFormData) {
    if (!db || !user) return;
    
    setIsSaving(true);
    const id = templateId || crypto.randomUUID();
    const docRef = doc(db, "users", user.uid, "templates", id);

    const data = {
      ...values,
      id: id,
      updatedAt: new Date().toISOString(),
      createdAt: templateData?.createdAt || new Date().toISOString(),
    };

    try {
      await setDoc(docRef, data, { merge: true });
      toast({ title: templateId ? "Template Updated" : "Template Saved" });
      router.push("/templates");
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save template." });
    } finally {
      setIsSaving(false);
    }
  }

  if (templateId && templateLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <PageHeader
        title={templateId ? "Edit Template" : "New Template"}
        description="Design reusable content with smart personalization tags."
      >
        <Button variant="ghost" asChild size="sm">
          <Link href="/templates">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Library
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Template Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Q4 Cold Outreach - Variant A" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Sales, Follow-up, Networking" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Content</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-[10px] font-mono">{"{{firstName}}"}</Badge>
                    <Badge variant="outline" className="text-[10px] font-mono">{"{{company}}"}</Badge>
                  </div>
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
                    name="body"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Body (HTML Supported)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Hi {{firstName}}, checking in on {{company}}..."
                            className="min-h-[350px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                        <FormDescription className="text-xs">
                          Use tags like {"{{firstName}}"}, {"{{lastName}}"}, {"{{company}}"}, or {"{{position}}"} to personalize.
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-end gap-4">
                <Button variant="outline" asChild disabled={isSaving}>
                  <Link href="/templates">Cancel</Link>
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {templateId ? "Update Template" : "Save to Library"}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        <div className="space-y-6">
          {!templateId && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Pre-built Library</CardTitle>
                </div>
                <CardDescription>Start with a high-performing baseline.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {preBuiltTemplates.map((t, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleApplyPrebuilt(t)}
                    className="w-full text-left p-3 rounded-lg border bg-background hover:bg-accent transition-colors group"
                  >
                    <p className="text-sm font-bold group-hover:text-primary transition-colors">{t.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-tighter">{t.category}</p>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Smart Tags Reference</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground">Standard Personalization</p>
                <div className="grid grid-cols-2 gap-2">
                  <code className="text-[10px] p-1 bg-muted rounded">{"{{firstName}}"}</code>
                  <code className="text-[10px] p-1 bg-muted rounded">{"{{lastName}}"}</code>
                  <code className="text-[10px] p-1 bg-muted rounded">{"{{company}}"}</code>
                  <code className="text-[10px] p-1 bg-muted rounded">{"{{position}}"}</code>
                  <code className="text-[10px] p-1 bg-muted rounded">{"{{email}}"}</code>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Tags are automatically replaced with recipient data during campaign dispatch. Ensure your contact lists include these fields.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
