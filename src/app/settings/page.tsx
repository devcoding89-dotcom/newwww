"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/page-header";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { verifyDomainAction, isPublicDomain } from "@/lib/actions";
import { 
  ShieldCheck, 
  Globe, 
  UserCheck, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  Loader2,
  Lock,
  Copy
} from "lucide-react";
import type { SenderSettings, ComplianceSettings } from "@/lib/types";

export default function SettingsPage() {
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false);
  
  const [sender, setSender] = useLocalStorage<SenderSettings>("sender-settings", {
    fromName: "",
    fromEmail: "",
    domain: "",
    isDomainVerified: false,
    isSenderVerified: false,
  });

  const [compliance, setCompliance] = useLocalStorage<ComplianceSettings>("compliance-settings", {
    handleBounces: true,
    handleSpam: true,
    bounceRate: 0.12,
    complaintRate: 0.02,
  });

  const handleSenderUpdate = async (field: keyof SenderSettings, value: string) => {
    if (field === "fromEmail") {
      const isPublic = await isPublicDomain(value);
      if (isPublic) {
        toast({
          variant: "destructive",
          title: "Public Domain Restricted",
          description: "Please use a custom business domain (no Gmail, Yahoo, etc.)."
        });
        return;
      }
    }
    setSender({ ...sender, [field]: value, isSenderVerified: false });
  };

  const handleVerifyDomain = async () => {
    if (!sender.domain) return;
    setIsVerifying(true);
    try {
      const result = await verifyDomainAction(sender.domain);
      if (result.success) {
        setSender({ ...sender, isDomainVerified: true, isSenderVerified: true });
        toast({ title: "Verification Success", description: result.message });
      } else {
        toast({ variant: "destructive", title: "Verification Failed", description: result.message });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Something went wrong." });
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <PageHeader
        title="Settings"
        description="Configure your sender identity and domain verification for platform-managed infrastructure."
      />

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Sender Identity */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                <CardTitle>Sender Identity</CardTitle>
              </div>
              <CardDescription>Configure how your emails appear to recipients.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fromName">From Name</Label>
                  <Input 
                    id="fromName" 
                    placeholder="e.g. Jane from EmailCraft" 
                    value={sender.fromName}
                    onChange={(e) => handleSenderUpdate("fromName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="fromEmail">From Email Address</Label>
                    {sender.isSenderVerified ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">Verified</Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 border-amber-200">Pending</Badge>
                    )}
                  </div>
                  <Input 
                    id="fromEmail" 
                    type="email"
                    placeholder="jane@yourdomain.com" 
                    value={sender.fromEmail}
                    onChange={(e) => handleSenderUpdate("fromEmail", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Domain Verification */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  <CardTitle>Domain Verification</CardTitle>
                </div>
                {sender.isDomainVerified ? (
                  <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Verified
                  </Badge>
                ) : (
                  <Badge variant="destructive">Unverified</Badge>
                )}
              </div>
              <CardDescription>Authorize our infrastructure to send on behalf of your domain.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="domain">Business Domain</Label>
                  <Input 
                    id="domain" 
                    placeholder="example.com" 
                    value={sender.domain}
                    onChange={(e) => setSender({...sender, domain: e.target.value, isDomainVerified: false})}
                  />
                </div>
                <Button 
                  className="sm:mt-8" 
                  disabled={!sender.domain || isVerifying}
                  onClick={handleVerifyDomain}
                >
                  {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Verify Domain"}
                </Button>
              </div>

              {sender.domain && (
                <div className="space-y-4 pt-4">
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold">SPF Record (TXT)</h4>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(`v=spf1 include:sendgrid.net ~all`)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <code className="text-[10px] break-all block p-2 bg-background rounded border">
                      v=spf1 include:sendgrid.net ~all
                    </code>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold">DKIM Record (CNAME)</h4>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(`s1._domainkey.${sender.domain}`)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <code className="text-[10px] break-all block p-2 bg-background rounded border">
                      s1.domainkey.u123456.sendgrid.net
                    </code>
                  </div>
                  <Alert variant="default" className="bg-blue-50 border-blue-100">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800">DMARC Suggestion</AlertTitle>
                    <AlertDescription className="text-blue-700 text-xs">
                      We recommend adding: <code>v=DMARC1; p=none;</code> to your DNS to monitor delivery.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Settings */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Sending Limits */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                <CardTitle>Limits</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Daily Limit</span>
                  <span className="font-medium">5,000</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[12%]" />
                </div>
                <p className="text-[10px] text-muted-foreground text-right">600 / 5,000 used today</p>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Hourly Rate</span>
                  <span className="font-medium">500</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[5%]" />
                </div>
                <p className="text-[10px] text-muted-foreground text-right">25 / 500 current hour</p>
              </div>
            </CardContent>
          </Card>

          {/* Compliance & Protection */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-green-500" />
                <CardTitle>Compliance</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Auto-Handle Bounces</Label>
                  <p className="text-[10px] text-muted-foreground">Automatically suppress failures</p>
                </div>
                <Switch 
                  checked={compliance.handleBounces} 
                  onCheckedChange={(val) => setCompliance({...compliance, handleBounces: val})}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Spam Protection</Label>
                  <p className="text-[10px] text-muted-foreground">Remove spam complaints</p>
                </div>
                <Switch 
                  checked={compliance.handleSpam} 
                  onCheckedChange={(val) => setCompliance({...compliance, handleSpam: val})}
                />
              </div>

              <div className="pt-4 border-t space-y-4">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Bounce Rate</span>
                  <Badge variant={compliance.bounceRate > 5 ? "destructive" : "secondary"} className="text-[10px]">
                    {compliance.bounceRate}%
                  </Badge>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Complaint Rate</span>
                  <Badge variant={compliance.complaintRate > 0.1 ? "destructive" : "secondary"} className="text-[10px]">
                    {compliance.complaintRate}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Safety Notice */}
          <Alert variant="destructive" className="bg-red-50/50 border-red-100">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="text-xs font-bold uppercase tracking-tight">Account Safety</AlertTitle>
            <AlertDescription className="text-[10px] leading-relaxed">
              Emails are sent using platform-managed infrastructure. Abuse, high bounce rates, or spam complaints may result in automatic account suspension.
            </AlertDescription>
          </Alert>
          
          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="flex items-center gap-2 mb-2 text-primary">
              <Lock className="h-4 w-4" />
              <h4 className="text-xs font-bold uppercase">Infrastructure</h4>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Email delivery is powered by Twilio SendGrid. You do not need to provide SMTP credentials. All delivery is handled by our core systems.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
