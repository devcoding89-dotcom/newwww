
"use client";

import { useState } from "react";
import { Check, Loader2, Zap, Rocket, ShieldCheck, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/page-header";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { initializePaymentAction } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function PricingPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const { data: profile } = useDoc(userProfileRef);

  const handleUpgrade = async () => {
    if (!user || !profile) return;
    setLoading(true);

    try {
      const result = await initializePaymentAction(user.email!, 1000);
      
      if (result.simulation) {
        // Prototype Simulation Logic
        toast({ title: "Simulating Payment Process...", description: "Connecting to Paystack Secure..." });
        await new Promise(r => setTimeout(r, 2000));
        
        if (userProfileRef) {
          await updateDoc(userProfileRef, {
            subscriptionTier: "elite",
            updatedAt: new Date().toISOString()
          });
          toast({ title: "Payment Successful!", description: "Welcome to Elite membership." });
        }
      } else if (result.data?.authorization_url) {
        // Real Paystack Redirect
        window.location.href = result.data.authorization_url;
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Payment Failed", description: "Please try again later." });
    } finally {
      setLoading(false);
    }
  };

  const isElite = profile?.subscriptionTier === "elite";

  return (
    <div className="container mx-auto py-12 max-w-5xl">
      <div className="text-center mb-16 space-y-4">
        <PageHeader 
          title="Simple, Transparent Pricing" 
          description="Scale your outreach with our Elite infrastructure."
        />
        <p className="text-muted-foreground text-lg">
          Join 2,000+ Nigerian businesses automating their sales intelligence.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:max-w-4xl lg:mx-auto">
        {/* Free Tier */}
        <Card className="flex flex-col relative overflow-hidden">
          <CardHeader>
            <CardTitle className="text-xl">Free Tier</CardTitle>
            <CardDescription>Perfect for individual testing.</CardDescription>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-bold">₦0</span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <div className="space-y-2">
              <FeatureItem text="50 AI Email Extractions" />
              <FeatureItem text="1 Active Campaign" />
              <FeatureItem text="Standard Delivery Rates" />
              <FeatureItem text="Basic Personalization" />
              <FeatureItem text="Community Support" inactive />
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" disabled={!isElite}>
              {isElite ? "Downgrade" : "Current Plan"}
            </Button>
          </CardFooter>
        </Card>

        {/* Elite Tier */}
        <Card className={cn(
          "flex flex-col relative overflow-hidden border-primary/50 shadow-xl",
          isElite && "border-green-500 shadow-green-100"
        )}>
          <div className="absolute top-0 right-0 p-1 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-3 rounded-bl-lg">
            Recommended
          </div>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Elite Growth</CardTitle>
              <Zap className="h-5 w-5 text-amber-500 fill-amber-500" />
            </div>
            <CardDescription>For serious marketing teams.</CardDescription>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-bold">₦1,000</span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <div className="space-y-2">
              <FeatureItem text="Unlimited AI Extractions" highlight />
              <FeatureItem text="Unlimited Email Campaigns" highlight />
              <FeatureItem text="Priority Batch Processing" highlight />
              <FeatureItem text="Custom Domain Sending" highlight />
              <FeatureItem text="Advanced Analytics Dashboard" highlight />
              <FeatureItem text="24/7 Priority Support" highlight />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button 
              className="w-full h-12 text-lg font-bold" 
              onClick={handleUpgrade}
              disabled={loading || isElite}
            >
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : isElite ? <ShieldCheck className="mr-2 h-5 w-5" /> : <Rocket className="mr-2 h-5 w-5" />}
              {isElite ? "Elite Active" : "Upgrade to Elite"}
            </Button>
            <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
              <CreditCard className="h-3 w-3" />
              Secure payments via Paystack
            </div>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-20 grid gap-8 md:grid-cols-3">
        <ValueCard 
          icon={<ShieldCheck className="h-8 w-8 text-green-500" />}
          title="Verified Delivery"
          description="Elite members get access to pre-warmed sending infrastructure."
        />
        <ValueCard 
          icon={<Zap className="h-8 w-8 text-amber-500" />}
          title="AI Speed"
          description="Zero-queue processing for all intelligent data extractions."
        />
        <ValueCard 
          icon={<CreditCard className="h-8 w-8 text-blue-500" />}
          title="Local Payments"
          description="Pay easily in Naira via Transfer, USSD, or Card."
        />
      </div>
    </div>
  );
}

function FeatureItem({ text, highlight, inactive }: { text: string; highlight?: boolean; inactive?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2 text-sm", inactive && "opacity-40")}>
      <Check className={cn("h-4 w-4 shrink-0", highlight ? "text-primary" : "text-muted-foreground")} />
      <span className={highlight ? "font-semibold" : ""}>{text}</span>
    </div>
  );
}

function ValueCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 rounded-xl border bg-card text-center space-y-3">
      <div className="flex justify-center">{icon}</div>
      <h3 className="font-bold">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
