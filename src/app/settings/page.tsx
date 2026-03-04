
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/page-header";
import type { SmtpConfig } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { testSmtpConnectionAction } from "@/lib/actions";
import { useState } from "react";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const smtpSchema = z.object({
  host: z.string().min(1, "Host is required"),
  port: z.coerce.number().min(1, "Port is required"),
  secure: z.boolean(),
  user: z.string().min(1, "User is required"),
  pass: z.string().min(1, "Password is required"),
});

const defaultSmtpConfig: SmtpConfig = {
  host: "",
  port: 587,
  secure: false,
  user: "",
  pass: "",
};

export default function SettingsPage() {
  const [smtpConfig, setSmtpConfig] = useLocalStorage<SmtpConfig>(
    "smtp-config",
    defaultSmtpConfig
  );
  const { toast } = useToast();
  const [isTesting, setIsTesting] = useState(false);

  const form = useForm<z.infer<typeof smtpSchema>>({
    resolver: zodResolver(smtpSchema),
    defaultValues: smtpConfig,
  });

  function onSubmit(values: z.infer<typeof smtpSchema>) {
    setSmtpConfig(values);
    toast({
      title: "Settings Saved",
      description: "Your SMTP settings have been updated.",
    });
  }

  const handleTestConnection = async () => {
    const values = form.getValues();
    setIsTesting(true);
    try {
      const result = await testSmtpConnectionAction(values);
      if (result.success) {
        toast({
          title: "Connection Successful",
          description: result.message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Connection Failed",
          description: result.message,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Test Error",
        description: "An unexpected error occurred during testing.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title="Settings"
        description="Configure your SMTP service to send emails securely."
      />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>SMTP Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="host"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Host</FormLabel>
                          <FormControl>
                            <Input placeholder="smtp.example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="port"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Port</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="587" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="user"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="your-username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pass"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password / API Key</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="your-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="secure"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Use SSL/TLS</FormLabel>
                          <FormDescription>
                            Enable for ports like 465. Disable for 587 (STARTTLS).
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <Button type="submit" className="flex-1">Save Settings</Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex-1"
                      onClick={handleTestConnection}
                      disabled={isTesting}
                    >
                      {isTesting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Testing...
                        </>
                      ) : "Test Connection"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Usage Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p>Use Port 587 with SSL/TLS disabled for modern STARTTLS delivery (recommended for most providers).</p>
              </div>
              <div className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p>If using Gmail, generate an <strong>App Password</strong> rather than using your main account password.</p>
              </div>
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p>SMTP settings are stored locally in your browser and are never saved to our database.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
